'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Mesagechema = Schema({
  text: String,
  created_at: String,
  emitter: {type: Schema.ObjectId, ref: 'User'},
  reciver: {type: Schema.ObjectId, ref: 'User'}
});

module.exports = mongoose.model('Message', MessageSchema);