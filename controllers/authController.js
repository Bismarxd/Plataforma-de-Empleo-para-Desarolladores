const { default: mongoose } = require('mongoose');
const passport = require('passport');
const Vacante = require('../models/Vacantes')
const Usuarios = require("../models/Usuarios");
const crypto = require('crypto')
const enviarEmail = require('../handlers/email')

exports.autenticarUsuario = passport.authenticate("local", {
  successRedirect: "/administracion",
  failureRedirect: "/iniciar-sesion",
  failureFlash: true,
  badRequestMesage: "Ambos Campos son Obligatorios",
});


//Revisar si el uuario esta autenticao o no
exports.verificarUsuario = (req, res, next) => {
  //revisar el usuarios
  if (req.isAuthenticated()) {
    return next() // estan autenticados
    
  }

  //Redirrecionar
  res.redirect('/iniciar-sesion')
}


exports.mostrarPanel = async (req, res) => {

  //Consultar el usuario autenticado
  const vacantes = await Vacante.find({autor: req.user._id}).lean() 

  res.render("administracion", {
    nombrePagina: "Panel de Administración",
    tagline: "Crear y Administra tus Ofertas de Trabajo",
    cerrarSesion: true,
    nombre: req.user.nombre,
    imagen: req.user.imagen,
    vacantes
  });
}

exports.cerrarSesion = (req, res, next) => {
 req.logout((err) => {
   if (err) {
     // manejar el error
     return next(err);
   }
   // redirigir al usuario a la página de inicio de sesión después de cerrar la sesión
   req.flash('correcto', 'Cerraste Sesion Correctamente')
   return res.redirect("/iniciar-sesion");
 });
};


//Formulario para reestablecer el pssword
exports.formReestablecerPassword = (req, res) => {
  res.render("reestablecer-password" , {
    nombrePAgina: 'Reestablece tu Contraseña',
    tagline: 'Si olvidaste tu contraseña coloca tu email'
  });
}

//Enviar Token para reestablecer la contraseña
exports.enviarToken =async (req, res) => {

  const usuario = await Usuarios.findOne({email: req.body.email});

  if(!usuario) {
    req.flash('error', 'No exite es cuenta')
    return 
  }

    //Si el usuario existe generar un token
    usuario.token = crypto.randomBytes(20).toString('hex');
    usuario.expira = Date.now() + 3600000

    //Guardar el usuariol
    await usuario.save()
    const resetUrl = `http://${req.headers.host}/reestablecer-password/${usuario.token}`

    console.log(resetUrl);

    //TODO: envir notificacion por email
    await enviarEmail.enviar({
      usuario,
      subject : 'Pasword Reset',
      resetUrl,
      archivo: 'reset'
    })

    //Si esta todo bien
    req.flash('correcto', 'Revisa tu email para las indicaciones')
    res.redirect('/iniciar-sesion')

}

//Valida si el token es valido y exite el usuario
exports.reestablecerPassword = async (req, res) => {
  const usuario = await Usuarios.findOne({
    token : req.params.token,
    expira : {
      $gt : Date.now()
    }
  });

  if(!usuario) {
    req.flash('error', 'El Formulario ya no es Válido, intenta de nuevo');
    return res.redirect("/reestablecer-password");
  }

  //Si esta bien mostrar el formulario
  res.render('nuevo-password', {
    nombrePagina : 'Nueva Contraseña'
  })
}

//Almacena la nueva contraeña en la base de datos
exports.guardarPassword = async (req, res) => {
  const usuario = await Usuarios.findOne({
    token: req.params.token,
    expira: {
      $gt: Date.now(),
    },
  });

  //No existe el usuario o el token es invalido
   if (!usuario) {
     req.flash("error", "El Formulario ya no es Válido, intenta de nuevo");
     return res.redirect("/reestablecer-password");
   }

   //Guardar en la base de datos
   usuario.password = req.body.password,
   usuario.token = undefined;
   usuario.expira = undefined;

   //Aegrga y elimina valores del objeto
   await usuario.save();

   //redirigir
   req.flash('correcto', 'Contraseña Modificada Correctamente');
   res.redirect('/iniciar-sesion')
}