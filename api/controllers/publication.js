'use strict'

var path = require('path');
var fs = require('fs');
var moment = require('moment');
var mongoosePaginate = require('mongoose-pagination');

var Publication = require('../models/publication');
var User = require('../models/user');
var Follow = require('../models/follow');

function probando(req, res) {
    res.status(200).send({
        message: "Prueba"
    });
}

function savePublication(req, res) {
    var params = req.body;

    if(!params.text) return res.status(200).send({message: 'Debes enviar un texto'});
    
    var publication = new Publication();
    publication.text = params.text;
    publication.file = 'null';
    publication.user = req.user.sub;
    publication.created_at = moment().unix();

    publication.save((err,publicationStored) => {
        if(err) return res.status(500).send({message: 'Error al guardar la publicación'});

        if(!publicationStored) return res.status(404).send({message: 'La publicación no ha sido guardada'});

        return res.status(200).send({publication: publicationStored});
    })

}

function getPublications(req, res) {
    var page = 1; 
    if(req.params.page) {
        page = req.params.page;
    }

    var itemsPerPage = 4;

    Follow.find({user: req.user.sub}).populate('followed').exec((err, follows) => {
        if(err) return res.status(500).send({message: 'Error al devolver el seguimiento'});
        
        var follows_clean = [];

        follows.forEach((follow) => {
            follows_clean.push(follow.followed);
        });     

        Publication.find({user: {"$in": follows_clean}}).sort('created_ad').populate('user').paginate(page, itemsPerPage, (err, publications, total) => {
            if(err) return res.status(500).send({message: 'Error al devolver publicaciones'});

            if(!publications) return res.status(404).send({message: 'No hay publicaciones'});

            return res.status(200).send({
                totalItems: total,
                pages: Math.ceil(total/itemsPerPage),
                page: page,
                publications
            });
        });
    });
}

function getPublication(req, res) {
    var publicationId = req.params.id;

    Publication.findById(publicationId, (err, publication) => {
        if(err) return res.status(500).send({message: 'Error al devolver publicación'});
        
        if(!publication) return res.status(404).send({message: 'No existe esa publicación'});

        return res.status(200).send({publication});
        
    });
}

function deletePublication(req, res) {
    var publicationId = req.params.id;

    Publication.find({'user': req.user.sub, '_id': publicationId}).remove( err => {
        if(err) return res.status(500).send({message: 'Error al borrar la publicación'});
        
        return res.status(200).send({message: 'Publicación eliminada'});
        
    });
}

// Subir archivos de imagen/publicación de usuario

function uploadImage(req, res) {
    var publicationId = req.params.id;

    if(req.files) {
        var filePath = req.files.image.path;

        var fileSplit = filePath.split('\\');
        // Si se usa en linux la ruta estaría especificada por / y no por \
        if(fileSplit.length == 1) fileSplit =  filePath.split('/');

        var fileName = fileSplit[2];

        var extSplit = fileName.split('\.');
        
        var fileExt = extSplit[1];

        if(fileExt == 'png' || fileExt == 'jpg' || fileExt == 'jpeg' || fileExt == 'gif') {
            // Actualizar documento de la publicación
            Publication.findByIdAndUpdate(publicationId, {file: fileName}, {new: true}, (err, publicationUpdated) => {
                if(err) return res.status(500).send({message : 'Error en la petición'});
                
                if(!publicationUpdated) return res.status(404).send({message : 'No se ha actualizado el usuario'});
console.log("entra")
                return res.status(200).send({publication: publicationUpdated});
            });
        } else {
           return removeFileOfUploads(res, filePath, 'Extensión no válida');
        }

    } else {
        return res.status(200).send({message: 'No se han subido archvios de imagen'});
    }

}

function removeFileOfUploads(res, filePath, Message) {
    fs.unlink(filePath, (err) => {
        if(err) return res.status(200).send({message : Message})
    });
}

function getImageFile(req, res) {
    var imageFile = req.params.imageFile;

    var pathFile = './uploads/publications/'+imageFile;
    fs.exists(pathFile, (exists) => {
        if(exists) {
            res.sendFile(path.resolve(pathFile));
        } else {
            res.status(200).send({message: 'No existe la imagen'});
        }
    })
}


module.exports = {
    probando,
    savePublication,
    getPublications,
    getPublication,
    deletePublication,
    uploadImage,
    getImageFile
}

