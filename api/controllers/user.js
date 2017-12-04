'use strict'

var bcrypt = require('bcrypt-nodejs');
var jwt = require('../services/jwt');
var mongoosePaginate = require('mongoose-pagination');
var fs = require('fs');
var path = require('path');

var User = require('../models/user');
var Follow = require('../models/follow');

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
// Registro
function saveUser(req, res) {
    var params = req.body;
    var user = new User();
    if(params.name && params.surname &&
       params.nick && params.email && params.password) {

        user.name = params.name;
        user.surname = params.surname;
        user.nick = params.nick;
        user.email = params.email;
        user.role = 'ROLE_USER';
        user.image = null;
        
        // Controlamos que no haya usuarios duplicados
        
        User.find({$or: [
            {email: user.email.toLowerCase()},
            {user: user.nick.toLowerCase()}
        ]}).exec((err, users) => {
            if(err) return res.status(500).send({message: 'Error al guardar el usuario'})

            if(users && users.length >= 1) {
                return res.status(200).send({message: 'El usuario que intenta registrar ya existe'})
            } else {
                 // Cifra y guarda los datos
                bcrypt.hash(params.password, null, null, (err, hash) => {
                user.password = hash;

                 user.save((err, userStore) => {

                if(err) return res.status(500).send({message: 'Error al guardar el usuario'})

                if(userStore) {
                    res.status(200).send({user:userStore});
                } else {
                    res.status(404).send({message: 'No se ha registrado el usuario'})
                }

    });
});
            }
        });
        
    } else {
        res.status(200).send({
            message: 'Envia todos los campos necesarios'
        })
    }
}
// Login
function loginUser(req, res) {
    var params = req.body;

    var email = params.email;
    var password = params.password;

    User.findOne({email: email}, (err, user) => {
        if(err) return res.status(500).send({message: 'Error en la petición'});

        if(user) {
            bcrypt.compare(password, user.password, (err, check) => {
                if(check) {
                    if(params.gettoken) {
                        //devolver token y devolver el token
                        return res.status(200).send({
                            token: jwt.createToken(user)
                        })
                    } else {
                        // Devolver datos de usuario
                        user.password = undefined;
                        return res.status(200).send({user});
                    }
                   
                } else {
                    res.status(404).send({message: 'El usuario no se ha podido identificar'})  
                }
            });
        } else {
            res.status(404).send({message: 'El usuario no se ha podido identificar'})  
            
        }
    });
}

// Conseguir datos de un usuario
function getUser(req, res) {
    var userId = req.params.id;

    User.findById(userId, (err, user) => {
        if(err) return res.status(500).send({message : 'Error en la petición'});

        if(!user) return res.status(404).send({message : 'El usuario no existe'});
        
       followThisUser(req.user.sub, userId).then((value)=> {
            return res.status(200).send({user, 
                following: value.following,
                followed: value.followed
            });
       });

           
    
    });
}

async function followThisUser(identityUserId, userId) {
    var following = await Follow.findOne({"user": identityUserId, "followed": userId}).exec((err, follow) => {
        if(err) return res.status(500).send({message : 'Error al comprobar el seguimiento'});
        return follow;
    });

    var followed = await Follow.findOne({"user": userId, "followed": identityUserId}).exec((err, follow) => {
        if(err) return res.status(500).send({message : 'Error al comprobar el seguimiento'});
        return follow;
    });

    return {
        following: following,
        followed: followed
    }
}

// Devolver un listado de usuarios paginado 
function getUsers(req, res) {
    var identityUserId = req.user.sub;
   
    var page = 1;
    if(req.params.page) {
      page = req.params.page;  
    }

    var itemsPerPage = 5;

    User.find().sort('_id').paginate(page, itemsPerPage, (err, users, total) => {
        if(err) return res.status(500).send({message : 'Error en la petición'});
        
        if(!users) return res.status(404).send({message : 'No hay usuarios a listar'});
        
        followUserIds(identityUserId).then((value) => {
            return res.status(200).send({
                users,
                users_following: value.following,
                user_follow_me: value.followed,
                total,
                pages: Math.ceil(total/itemsPerPage)
            });

        });

    });
}

async function followUserIds(userId) {
    var following = await Follow.find({"user":userId}).select({'_id':0, '__v':0, 'user':0}).exec((err, follows) => {
       return follows;
    });

    var followed = await Follow.find({"followed":userId}).select({'_id':0, '__v':0, 'followed':0}).exec((err, follows) => {
        return follows;
    });

    // procesar following ids
    var followingClean = [];
            following.forEach((follow) => {
                followingClean.push(follow.followed);
            });
          
    // procesar followed ids    
    var followedClean = [];
            followed.forEach((follow) => {
                followedClean.push(follow.user);
            });

    return {
        following: followingClean,
        followed: followedClean
    }
}

// Edición de datos de usuario
function updateUser(req,res) {
    var userId = req.params.id;
    var update = req.body;

    // borrar propiedad password 
    delete update.password;
    
    if(userId != req.user.sub) {
        return res.status(500).send({message: 'No tienes permisos para modificar los datos del usuario identificado'});
    }

    User.findByIdAndUpdate(userId, update, {new: true}, (err, userUpdated) => {
        if(err) return res.status(500).send({message : 'Error en la petición'});
        
        if(!userUpdated) return res.status(404).send({message : 'No se ha actualizado el usuario'});
        
        return res.status(200).send({user: userUpdated});
    
    });    
}

// Subir archivos de imagen/avatar de usuario

function uploadImage(req, res) {
    var userId = req.params.id;

    if(userId != req.user.sub) {
       return removeFileOfUploads(res, filePath, 'No tienes permisos para modificar los datos del usuario identificado');        
    }

    if(req.files) {
        var filePath = req.files.image.path;

        var fileSplit = filePath.split('\\');
        // Si se usa en linux la ruta estaría especificada por / y no por \
        if(fileSplit.length == 1) fileSplit =  filePath.split('/');

        var fileName = fileSplit[2];

        var extSplit = fileName.split('\.');
        
        var fileExt = extSplit[1];

        if(fileExt == 'png' || fileExt == 'jpg' || fileExt == 'jpeg' || fileExt == 'gif') {
            // Actualizar documento de usuario logeado
            User.findByIdAndUpdate(userId, {image: fileName}, {new: true}, (err, userUpdated) => {
                if(err) return res.status(500).send({message : 'Error en la petición'});
                
                if(!userUpdated) return res.status(404).send({message : 'No se ha actualizado el usuario'});
                
                return res.status(200).send({user: userUpdated});
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

    var pathFile = './uploads/users/'+imageFile;
    fs.exists(pathFile, (exists) => {
        if(exists) {
            res.sendFile(path.resolve(pathFile));
        } else {
            res.status(200).send({message: 'No existe la imagen'});
        }
    })
}

module.exports = {
    home,
    pruebas,
    saveUser,
    loginUser,
    getUser,
    getUsers,
    updateUser,
    uploadImage,
    getImageFile
}