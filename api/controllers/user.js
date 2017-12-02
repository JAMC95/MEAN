'use strict'

var User = require('../models/user');

function home(req, res) {
    res.status(200).send({
        message: 'Acción de pruebas'
    });
}

function pruebas(req, res) {
    res.status(200).send({
        message: 'Acción de pruebas'
    });
}

module.exports = {
    home,
    pruebas
}