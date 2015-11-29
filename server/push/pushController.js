var request = require('request');
var PushToken = require('./pushModel.js');

var sendToken = function(msgData, tokens, cb) {
  var JSONData = {
    tokens: tokens,
    production: true,
    notification: {
      alert: msgData.message
    }
  }

  var reqData {
    url: "https://push.ionic.io/api/v1/push/",
    method: "POST",
    body: JSONData,
    json: true,
    headers: {
      "X-Ionic-Application-Id": process.env.IONIC_APP_ID,
      "Authorization": "Basic " + btoa(process.env.IONIC_PRIVATE_APP_ID + ":")
    }
  }

  request(reqData, function(err, res){
    cb(err);
  })

}

var controller = {};

controller.sendPush = function (req, res) {

  var username = req.body.username;
  var password = req.body.password;
  var message = req.body.message;
  var title = req.body.title;
  var tokens = req.body.tokens;

  if (username !== process.env.ADMIN_USERNAME || password !== process.env.ADMIN_PASSWORD) {
    res.status(401).send({error: "Invalid authentication"});
    return;
  }

  if (!tokens) {

    tokens = [];
    PushToken.find(function(err, tokens) {
      tokens.forEach(function(element){
        tokens.push(element.token);
      });

      sendToken({message: message, title: title}, tokens, function(err){
        res.send(200);
      });
    });

  } else {

    sendToken({message: message, title: title}, tokens, function(err){
      res.send(200);
    });

  }

}

controller.register = function (req, res) {

  var token = req.body.token;
  var oldToken = req.body.replaceToken;
  var date = req.body.date;

  var tokenModel;

  if (!oldToken) {
    tokenModel = new PushToken({token: token, date: date});
    tokenModel.save(function(err, model) {
      res.send(201);
    })
  } else {
    PushToken.findOne({token: oldToken}, function(err, model) {
      model.token = token;
      model.date = date;
      model.save(function(err, newModel){
        res.send(201);
      })
    })
  }

}

module.exports = controller;
