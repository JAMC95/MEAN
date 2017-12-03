'use strict'

var path = require('path');
var fs = require('fs');
var mongoosePaginate = require('mongoose-pagination');

var User = require('../models/user');
var Follow = require('../models/follow');

function saveFollow(req, res) {
    var params = req.body;

    var follow = new Follow();
    follow.user = req.user.sub;
    follow.followed = params.followed;

    follow.save((err, followStored) => {
        if(err) return res.status(500).send({message: "Error al guardar el seguimiento"});

        if(!followStored) return res.status(404).send({message: "El seguimiento no se ha guardado"});

        return res.status(200).send({message: followStored});
    });
}

function deleteFollow(req,res) {
    var userId = req.user.sub;
    var followId = req.params.id;

    Follow.find({'user':userId, 'followed': followId}).remove(err => {
        if(err) return res.status(500).send({message: "Error al dejar de seguir usuario"});        
        return res.status(200).send({message: "El follow se ha eliminado"});
    });
}

// Devuelve usuarios que sigo
function getFollowingUsers(req, res) {
    var userId = req.user.sub;

    if(req.params.id && req.params.page) {
        userId = req.params.id;
    }

    var page = 1

    if(req.params.page) {
        page = req.params.page;
    } else {
        page = req.params.id;
    }

    var itemsPerPage = 4;

    Follow.find({user:userId}).populate({path: 'followed'}).paginate(page, itemsPerPage, (err, follows, total) => {
        if(err) return res.status(500).send({message: "Error al listar usuarios"});        
        
        if(!follows) return res.status(404).send({message: 'No estas siguiendo a ningún usuario'});

        return res.status(200).send({
            total: total,
            pages: Math.ceil(total/itemsPerPage),
            follows
        });
    });
}

// Devuelve usuarios que me siguen
function getFollowedUsers(req, res) {
    var userId = req.user.sub;
    
    if(req.params.id && req.params.page) {
        userId = req.params.id;
    }
    
    var page = 1
    
    if(req.params.page) {
            page = req.params.page;
    } else {
            page = req.params.id;
    }
    
        var itemsPerPage = 4;
    
        Follow.find({followed:userId}).populate({path: 'user followed'}).paginate(page, itemsPerPage, (err, follows, total) => {
            if(err) return res.status(500).send({message: "Error al listar usuarios"});        
            
            if(!follows) return res.status(404).send({message: 'No te sigue ningún usuario'});
    
            return res.status(200).send({
                total: total,
                pages: Math.ceil(total/itemsPerPage),
                follows
            });
        });
}

// Devuelve usuarios que sigo o que me siguen sin paginar
function getMyFollows(req, res) {
    var userId = req.user.sub;

    var find = Follow.find({user: userId});

    if(req.params.followed) {
        find = Follow.find({followed: userId});
    }

    find.populate('user followed').exec((err, follows) => {
        if(err) return res.status(500).send({message: "Error al listar usarios"});   

        if(!follows) return res.status(404).send({message: 'No se encontró ningún usuario'});

        return res.status(200).send({follows});

    });
}


module.exports = {
    saveFollow,
    deleteFollow,
    getFollowingUsers, 
    getFollowedUsers,
    getMyFollows
}