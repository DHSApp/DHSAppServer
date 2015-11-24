var skywardController = require('./skywardController.js');
var bodyParser = require('body-parser')

module.exports = function (app) {
  // app === userRouter injected from middlware.js
  // app.use(bodyParser.urlencoded({extended: true}));
  // app.use(bodyParser.json());

  app.post('/gradebook', skywardController.getGradeBook);

};
