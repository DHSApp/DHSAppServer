var pushController = require('./pushController.js');

module.exports = function (app) {
  // app === userRouter injected from middlware.js
  // app.use(bodyParser.urlencoded({extended: true}));
  // app.use(bodyParser.json());

  app.post('/send', pushController.sendPush);
  app.post('/register', pushController.register);

};
