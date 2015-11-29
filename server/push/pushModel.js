var mongoose = require('mongoose');

var PushSchema = new mongoose.Schema({
 token: String,
 date: String
});

module.exports = mongoose.model('Push', PushSchema);