var News = require('./newsModel.js');

var newsController = {
  getNews : function (req, res) {
    // body...
    News.find(function(err, allNews){
      res.send(allNews);
    });

  },

  addNews: function (req, res) {

    var username = req.body.username;
    var password = req.body.password;
    var description = req.body.description;
    var title = req.body.title;
    var lastUpdated = req.body.lastUpdated;

    if (username !== process.env.ADMIN_USERNAME || password !== process.env.ADMIN_PASSWORD) {
      res.status(401).send({error: "Invalid authentication"});
      return;
    }

    if (req.body.edit) {

    } else {
      var newNews = new News({description: description, title: title, lastUpdated: lastUpdated});
      newNews.save(function(err, model){
        res.send(201);
      })
    }

  }
}

module.exports = newsController;