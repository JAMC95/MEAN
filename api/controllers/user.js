'use strict'

var bcrypt = require('bcrypt-nodejs');
var jwt = require('../services/jwt');

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
        if(err) return res.status(500).send({message : "Error en la petición"});

        if(!user) return res.status(404).send({message : "El usuario no existe"});
        
        return res.status(200).send({user});
    });
}

module.exports = {
    home,
    pruebas,
    saveUser,
    loginUser,
    getUser
}