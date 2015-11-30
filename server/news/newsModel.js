var mongoose = require('mongoose');

var NewsSchema = new mongoose.Schema({
 description: String,
 lastUpdated: String,
 title: String
});

module.exports = mongoose.model('News', NewsSchema);