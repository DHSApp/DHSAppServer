
var request = require('request');
var htmlparser = require("htmlparser2");

var requestGrades = function (userdata, cb) {
  var sessionid = userdata.sessionid;

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

      cb(body);
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
      cb(data);
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


