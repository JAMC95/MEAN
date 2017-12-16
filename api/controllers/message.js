'use strict'

var moment = require('moment');
var mongoosePaginate = require('mongoose-pagination');

var User = require('../models/user');
var Follow = require('../models/follow');
var Message = require('../models/message');

function saveMessage(req, res) {
    var params = req.body;

    if(!params.text || !params.reciver) return res.status(200).send({message: 'Rellena todos los campos necesarios'});

    var message = new Message();

    message.emmiter = req.user.sub;
    message.reciver = params.reciver;
    message.text = params.text;
    message.created_at = moment().unix();

    message.save((err, messageStored) => {
        if(err) if(!params.text || !params.reciver) return res.status(500).send({message: 'Error en la petición'});
        if(!messageStored) if(!params.text || !params.reciver) return res.status(500).send({message: 'Error al enviar el mensaje'});

        return res.status(200).send({message: messageStored});


    });
}

module.exports = {
    saveMessage
}