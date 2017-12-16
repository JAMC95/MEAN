'use strict'

var express = require('express');
var MessageController = require('../controllers/message');
var api = express.Router();
var md_auth = require('../middlewares/authenticated');

api.post('/message', md_auth.ensureAuth, MessageController.saveMessage);
api.get('/my-messages', md_auth.ensureAuth, MessageController.getRecivedMessages);
api.get('/messages', md_auth.ensureAuth, MessageController.getEmmitedMessages);

module.exports = api;

