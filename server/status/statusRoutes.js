var statusController = require('./statusController.js');

module.exports = function (app) {
  // app === userRouter injected from middlware.js
  // app.use(bodyParser.urlencoded({extended: true}));
  // app.use(bodyParser.json());

  app.get('/', statusController.getStatus);
  app.post('/', statusController.changeStatus)

};
