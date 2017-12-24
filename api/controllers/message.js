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

    message.emitter = req.user.sub;
    message.reciver = params.reciver;
    message.text = params.text;
    message.created_at = moment().unix();
    message.viewed = 'false';

    message.save((err, messageStored) => {
        if(err) if(!params.text || !params.reciver) return res.status(500).send({message: 'Error en la petición'});
        if(!messageStored) return res.status(404).send({message: 'Error al enviar el mensaje'});

        return res.status(200).send({message: messageStored});


    });
}

function getRecivedMessages(req, res) {
    var userId = req.user.sub;

    var page = 1;
    if(req.params.page) {
        page = req.params.page;
    }

    var itemsPerPage = 4;

    Message.find({reciver: userId}).populate('emitter','name surname nick image _id').paginate(page, itemsPerPage, (err, messages,total) => {
        if(err) if(!params.text || !params.reciver) return res.status(500).send({message: 'Error en la petición'});
        if(!messages) return res.status(404).send({message: 'No hya mensajes'});

        return res.status(200).send({
            total: total,
            pages: Math.ceil(total/itemsPerPage),
            messages
        })

    });

}

function getEmmitedMessages(req, res) {
    var userId = req.user.sub;

    var page = 1;
    if(req.params.page) {
        page = req.params.page;
    }

    var itemsPerPage = 4;

    Message.find({emitter: userId}).populate('emitter reciver','name surname nick image _id').paginate(page, itemsPerPage, (err, messages,total) => {
        if(err) return res.status(500).send({message: 'Error en la petición'});
        if(!messages) return res.status(404).send({message: 'No hay mensajes'});

        return res.status(200).send({
            total: total,
            pages: Math.ceil(total/itemsPerPage),
            messages
        })

    });

}

function getUnviewedMessages(req, res) {
    var userId = req.user.sub;
    console.log(req.user.sub)
    Message.count({reciver: userId, viewed: 'false'}).exec((err, count) => {
        if(err) return res.status(500).send({message: 'Error en la petición'});
        return res.status(200).send({
            'unviewed': count
        })
    });
}

module.exports = {
    saveMessage,
    getRecivedMessages,
    getEmmitedMessages,
    getUnviewedMessages
}