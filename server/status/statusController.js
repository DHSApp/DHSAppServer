var statusModel = require('./statusModel.js');

var statusMethods = {
  getStatus : function (req, res) {
    // body...
    res.send(statusModel);
  },

  changeStatus : function (req, res) {

    var username = req.body.username;
    var password = req.body.password;

    if (username !== process.env.ADMIN_USERNAME || password !== process.env.ADMIN_PASSWORD) {
      res.status(401).send({error: "Invalid authentication"});
      return;
    }

    var newStatus = req.body.status;
    var newLastUpdate = req.body.date;
    var newDescription = req.body.description;

    statusModel.description = newDescription;
    statusModel.lastUpdated = newLastUpdate;
    statusModel.status = newStatus;
    res.send(201);

  }
}

module.exports = statusMethods;