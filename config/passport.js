const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const mongoose = require('mongoose');
const Usuarios = mongoose.model('Usuarios');

passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
    }, async (email, password, done) => {
      const usuario = await Usuarios.findOne({email});

      //Verific si el usuario existe
      if (!usuario) return done(null, false , {
        message: 'Usuario no Existente'
      });

      //Si el usuario exite, hay que verificarlo
      const verificarPass = usuario.compararPassword(password);
      if (!verificarPass) return done(null, false, {
          message: "Contraseña Incorrecta",
        });

      //Si paso la validaciones y el usuario si existe
      return done(null, usuario);
}));

passport.serializeUser((usuario, done) => done(null, usuario._id))

passport.deserializeUser(async (id, done) => {
  const usuario = await Usuarios.findById(id).exec();
  return done(null, usuario);
})

module.exports = passport;