
var request = require('request');
var htmlparser = require("htmlparser2");

var requestGrades = function (sessionid, cb) {

  var domSearcher = function(domTree) {
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

    var findGradeTables = function(body, id) {

      var tables = [];

      var recurseSearch = function(element, id) {
        if (element.name === "table" && element.attribs.id.substring(0, id.length) === "grid_classDesc") {
          tables.push(element);
        }

        if (element.children) {
          element.children.forEach(function(element){
            recurseSearch(element, id);
          })        
        }
      }

      recurseSearch(body, id);
      return tables;
    }

    var circularRemoval = function(elements) {
      for (var i = 0; i < elements.length; i++) {
        delete elements[i].prev;
        delete elements[i].next;
        delete elements[i].parent;
        if (elements[i].children) {
          circularRemoval(elements[i].children);
        }
      }
    }

    var x = findGradeTables(findBody(domTree), "grid_classDesc");
    circularRemoval(x);
    return x;
  }

  var gradeBookParser = function(page, cb) {
    var rawHtml = page;
    var handler = new htmlparser.DomHandler(function (error, dom) {
      if (error) { 
          
      } else {
        cb(domSearcher(dom));
      }
    });
    var parser = new htmlparser.Parser(handler);
    parser.write(rawHtml);
    parser.done();
    
  }

  request({
    url: 'https://skywarddhs.isg.edu.sa/scripts/wsisa.dll/WService=wsEAPlusDHS/sfgradebook001.w',
    method: 'POST',
    form: 'sessionid=' + sessionid,
  }, function(err, res, body){

    if (err) {
      // deal with it later
    }

    

    gradeBookParser(body, function(data){
      cb(data);
    });
  })
}

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
      requestGrades(userData.sessionid, function(data){
        res.send(data);
      })
    });

    
  }
}


