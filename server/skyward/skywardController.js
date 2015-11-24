
var request = require('request');



var requestGrades = function (sessionid, cb) {


  var gradeBookParser = function(page) {

  }

  request({
    url: 'https://skywarddhs.isg.edu.sa/scripts/wsisa.dll/WService=wsEAPlusDHS/sfgradebook001.w',
    method: 'POST',
    form: 'sessionid=' + sessionid,
  }, function(err, res, body){

    if (err) {
      // deal with it later
    }

    gradeBookParser(body);

    cb(body);
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


