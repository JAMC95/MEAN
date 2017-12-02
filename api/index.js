'use strict'

var mongoose = require('mongoose');
var app = require('./app')
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/curso_mean_social', {useMongoClient: true})
        .then(() => {
            console.log("La conexión se ha realizado con éxito")
        })
        .catch(err => console.log(err))