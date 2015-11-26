
var request = require('request');
var htmlparser = require("htmlparser2");

// <span class='fwn'>

var recurseDom = function(body, decider, segment, hash){
  var targets;
  if (hash) {
    targets = {};
  } else {
    targets = [];
  }


  var recurseSearch = function(element) {
    if (decider(element)) {
      var val = segment(element);
      if (hash) {
        targets[val] = [];
      } else {
        targets.push(val);
      }
    }

    if (element.children) {
      element.children.forEach(function(element){
        recurseSearch(element);
      })        
    }
  }

  recurseSearch(body);
  return targets;

}

var requestGrades = function (userdata, cb) {
  var sessionid = userdata.sessionid;

  var finalClassDataParser = function(arr, cb) {

    var getassignments = function(categories) {
      var grades = {}
      for (var i = 0; i < categories.length; i ++) {


        var location = categories[i].data;
        grades[location] = [];

        var catStart = categories[i].parent.parent.next.next;
        while (true) {


          if (!catStart || catStart.attribs.class === "sf_Section cat") {
            
            if (catStart && catStart.prev.prev.attribs.class === "sf_Section cat" && catStart.next.next) {
              catStart = catStart.next.next;
              continue;
            } 

            break;

          }

          var unavaibile = catStart.children[0].children[0].data.charAt(0) === "T" ? true : false;
          if (unavaibile) {
            grades[location].push({unavaibile: true});
          } else {
            grades[location].push(
              {
                date: catStart.children[0].children[0].data, 
                name: catStart.children[1].children[0].children[0].data,
                grade: [catStart.children[2].children[0].data.trim(), catStart.children[2].children[2].data.trim()]
              });
          }
          

          catStart = catStart.next.next;
        }

      }

      return grades;

    }

    var analyzeDoms = function(doms) {

      var classes = [];
      for (var i = 0; i < doms.length; i++) {
        var currentClass = {};

        currentClass.name = doms[i][0].children[0].children[0].data;
        currentClass.period = doms[i][0].children[2].children[1].children[0].data;
        currentClass.grade = recurseDom({children: doms[i]}, 
          function(element){
            if (element.attribs && element.attribs.style === "float:left;display:inline;padding-left:5px;font-weight:normal;font-style:italic;") {
              return true;
            }
            return false;

          },

          function(element) {
            return element.children[0].data;
          }

        )

        

        var categories = recurseDom({children: doms[i]}, 
          function(element){
            if (element.attribs && element.attribs.style === "padding:0px 0px 0px 2px !important;background-color:#C9D6E4 !important;font-weight:bold !important") {
              return true;
            }
            return false;

          },

          function(element) {
            return element.children[0];
          }

        )

        console.log(currentClass.name);
        currentClass.categories = getassignments(categories);
        console.log();

        classes.push(currentClass);
        
      }


      return classes;

    }

    var createDoms = function (arr, cb) {

      var total = arr.length;
      var doms = [];

      for (var i = 0; i < arr.length; i++) {

        var handler = new htmlparser.DomHandler(function (error, dom) {
          if (error) { 
              
          } else {

            doms.push(dom);

            if (doms.length === total) cb(doms);
          }
        });

        var parser = new htmlparser.Parser(handler);
        parser.write(arr[i]);
        parser.done();

      
      }
    }


    createDoms(arr, function(doms) {
      cb(analyzeDoms(doms));
    })

  }

  var courseRequester = function (courses, userdata, cb) {
    var responses = [];
    var numObjs = Object.keys(courses).length;
    for (var key in courses) {
      individualCourseRequest(userdata, key, function(body){
        responses.push(body);
        if (responses.length === numObjs) {
          cb(responses);
        }
      })
    }
  }


  var individualCourseRequest = function (userdata, courseid, cb) {
    var options = { method: 'POST',
      url: 'https://skywarddhs.isg.edu.sa/scripts/wsisa.dll/WService=wsEAPlusDHS/httploader.p',
      qs: { file: 'sfgradebook001.w' },
      form: 
       { action: 'viewGradeInfoDialog',
         bucket: 'SEM 1',
         corNumId: courseid,
         fromHttp: 'yes',
         ishttp: 'true',
         sessionid: userdata.sessionid,
         stuId: userdata.nameid } 
    };

    request(options, function (error, response, body) {
      if (error) throw new Error(error);

      var gradeHTML = body.substring(body.indexOf("<span class='fWn'>"), body.indexOf(']]') - 2);
      cb(gradeHTML);
    });

  }

  var domSearcher = function(domTree, cb) {
    var findBody = function (domTree) {
      for (var i = 0; i < domTree.length; i++) {
        if (domTree[i].name === "html") {

          var html = domTree[i];
          for (var i = 0; i < html.children.length; i++) {
            if (html.children[i].name === "body") {
              return html.children[i];
            }
          }

        }
      }  
    }

    var findCourseIds = function(body, id) {
      var ids = {};

      var recurseSearch = function(element, id) {
        if (element.name === "table" && element.attribs.id.substring(0, id.length) === "grid_classDesc") {
          var courseId = element.attribs.id.split('_')[3];
          ids[courseId] = courseId;
        }

        if (element.children) {
          element.children.forEach(function(element){
            recurseSearch(element, id);
          })        
        }
      }

      recurseSearch(body, id);
      return ids;
    }


    var x = findCourseIds(findBody(domTree), "grid_classDesc");
    courseRequester(x, userdata, function(data){
      // cb(data);
      finalClassDataParser(data, function(doms){
        // console.log(doms);
        cb(doms);
      })
    })
  }

  var gradeBookParser = function(page, cb) {
    var rawHtml = page;
    var handler = new htmlparser.DomHandler(function (error, dom) {
      if (error) { 
          
      } else {
        domSearcher(dom, function(data){
          cb(data);
        })
      }
    });
    var parser = new htmlparser.Parser(handler);
    parser.write(rawHtml);
    parser.done();
    
  }




  // Fetch the gradebook data.
  request({
    url: 'https://skywarddhs.isg.edu.sa/scripts/wsisa.dll/WService=wsEAPlusDHS/sfgradebook001.w',
    method: 'POST',
    form: 'sessionid=' + sessionid,
  }, function(err, res, body){

    if (err) {
      // deal with it later
    }

    
    // Parse. This method deals with that.
    gradeBookParser(body, function(data){
      cb(data);
    });
  })
}





// Authenticates user, gains a session ID
var authUser = function(user, pass, cb) {

  var authParser = function(data) {
    data = data.substring(4, data.length - 5);
    console.log(data);
    data = data.split("^");
    var newReqData = {};
    newReqData.duserid = data[5];
    newReqData.dwd = data[0];
    newReqData.enc = data[13];
    newReqData.web_data_recid = data[1];
    newReqData.wfaacl = data[3];
    newReqData.wfaacl_recid = data[2];
    newReqData.nameid = data[4];
    newReqData.sessionid = newReqData.web_data_recid + "\u0015" +  newReqData.wfaacl_recid;
    return newReqData;
  }

  var qryFirstAuthStr = "codeType=tryLogin&codeValue=" + user 
              + "&duserid=-1&login=" + user + "&loginID=-1&password=" 
              + pass + "&requestAction=eel";

  request({
    url : 'https://skywarddhs.isg.edu.sa/scripts/wsisa.dll/WService=wsEAPlusDHS/skyporthttp.w',
    method: 'POST',
    form: qryFirstAuthStr,
  }, function(err, res, body){

    if (err) {
      // deal with it later
    }

    cb(authParser(body));
  })

}




module.exports = {
  getGradeBook : function  (req, res) {

    var username = req.body.username;
    var password = req.body.password;

    authUser(username, password, function(userData) {
      requestGrades(userData, function(data){
        res.send(data);
      })
    });

    
  }
}


