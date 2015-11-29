var morgan      = require('morgan'), // used for logging incoming request
    bodyParser  = require('body-parser'),
    helpers     = require('./helpers.js'); // our custom middleware


module.exports = function (app, express) {
  // Express 4 allows us to use multiple routers with their own configurations
  var skywardRouter = express.Router();
  var statusRouter = express.Router();
  var pushRouter = express.Router();

  app.use(morgan('dev'));
  app.use(bodyParser.urlencoded({extended: true}));
  app.use(bodyParser.json());

  app.use('/api/skyward', skywardRouter); // use user router for all user request
  app.use('/api/status', statusRouter); // use user router for all user request
  app.use('/api/push', pushRouter); // use user router for all user request

  app.use(helpers.errorLogger);
  app.use(helpers.errorHandler);

  // inject our routers into their respective route files
  require('../skyward/skywardRoutes.js')(skywardRouter);
  require('../status/statusRoutes.js')(statusRouter);
  require('../push/pushRoutes.js')(pushRouter);

};
