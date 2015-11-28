var newsController = require('./newsController.js');

module.exports = function (app) {
  // app === userRouter injected from middlware.js
  // app.use(bodyParser.urlencoded({extended: true}));
  // app.use(bodyParser.json());

  app.get('/', newsController.getNews);
  app.post('/', newsController.changeNews);

};
