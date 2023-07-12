const Usuarios = require("../models/Usuarios");
const multer = require('multer')
const shortid = require('shortid')

const { body, validationResult, sanitizeBody } = require("express-validator");

exports.subirImagen = (req, res , next) => {
  upload(req, res, function(error){
    if (error) {
      if (error instanceof multer.MulterError) {
        if(error.code === 'LIMIT_FILE_SIZE') {
          req.flash('error', 'El archivo es muy grande max: 100kb')
        }else {
          req.flash("error", error.message);
        }
      } else {
        req.flash("error", error.message);
      }
      res.redirect('/administracion');
      return;
    } else {
        return next();
    }
      
  });
}

//Opciones de multer
const configuracionMulter = {
  limits : {fileSize : 100000},
  storage: fileStorage = multer.diskStorage({
    destination : (req, file, cb) => {
      cb(null, __dirname+'../../public/uploads/perfiles');
    },
    filename : (req, file, cb) => {

      //Reescribe el nombre de la image
      const extension = file.mimetype.split('/')[1]
      cb(null, `${shortid.generate()}.${extension}`);
    }
  }),
  fileFilter(req, file, cb) {
    if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
        //El callback se ejecut como true o false: true cuando la imagen se acepta
        cb(null, true)
    }else{
        cb(new Error('Formato no Valido'), false)
    }
  },
  
}

const upload = multer(configuracionMulter).single('imagen');

exports.formCrearCuenta = (req, res) => {
  res.render("crear-cuenta", {
    nombrePagina: "Crear Cuenta en TechHire",
    tagline: "Comienza a publicar tus ofertas de trabajo",
  });
};



exports.validarRegistro = async (req, res, next) => {
  const rules = [
    //Sanitizar

    body("nombre")
      .not()
      .isEmpty()
      .withMessage("El nombre es obligatorio")
      .escape(),
    body("email")
      .isEmail()
      .withMessage("El email es obligatorio")
      .normalizeEmail(),
    body("password")
      .not()
      .isEmpty()
      .withMessage("El password es obligatorio")
      .escape(),
    body("confirmar")
      .not()
      .isEmpty()
      .withMessage("Repetir password es obligatorio")
      .escape(),
    body("confirmar")
      .equals(req.body.password)
      .withMessage("Los passwords no son iguales"),
  ];

  await Promise.all(rules.map((validation) => validation.run(req)));
  const errores = validationResult(req);

    if (errores.isEmpty()) {
      return next();
    }
    req.flash(
      "error",
      errores.array().map((error) => error.msg)
    );
    res.render("crear-cuenta", {
      nombrePagina: "Crea tu cuenta en devJobs",
      tagline:
        "Comienza a publicar tus vacantes gratis, solo debes crear una cuenta",
      mensajes: req.flash(),
    });
    return;
};

exports.crearUsuario = async (req, res, next) => {
  //Crear usuario
  const usuario = new Usuarios(req.body);


  try {
    await usuario.save();
    res.redirect("/iniciar-sesion");
    
  } catch (error) {
    req.flash('error', error)
    res.redirect("/crear-cuenta");
  }

  
};

//Formulario para inihciar sesion
exports.formIniciarSesion = (req, res) => {
  res.render('iniciar-sesion', {
    nombrePagina: 'Iniciar Sesión TechHire'
  })
} 

//Forma para editar el perfil
exports.formEditarPerfil = (req, res) => {

  res.render("editar-perfil", {
    nombrePagina: "Edita tu Perfil",
    usuario: req.user.toObject(),
    cerrarSesion: true,
    nombre: req.user.nombre,
    imagen: req.user.imagen
  });
}

//Guarar cmbios editar perfiñl
exports.editarPerfil = async (req, res) => {
  const usuario = await Usuarios.findOne(req.user._id);
  
  usuario.nombre = req.body.nombre
  usuario.email = req.body.email;

  if (req.body.password) {
    usuario.password = req.body.password
  }

  //sube la imagen al servidor
  if (req.file) {
    usuario.imagen = req.file.filename
  }

  //Guardar en la base de datos
  await usuario.save()

  req.flash('correcto', 'Cambios Guardado Correctamente')
  //redireccionar
  res.redirect('/administracion')
}

//Sanitizar y validar el formulario e editar perfil
exports.validarPerfil = async (req, res, next) => {
   const rules = [
    //sanitizar y validar los campos
    body("nombre")
      .not()
      .isEmpty()
      .withMessage("El Nombre es obligatorio")
      .escape(),
    body("email")
      .not()
      .isEmpty()
      .withMessage("El Correo Electronico es obligatorio")
      .escape(),
    req.body.password ? body("password").escape() : null

   
    ];

    
      await Promise.all(rules.map((validation) => validation.run(req)));
      const errores = validationResult(req)

      //Silo errores estn vacios
      if (errores.isEmpty()) {
        return next();
      }

      //crear los errores
      req.flash(
        "error",
        errores.array().map((error) => error.msg)
      );
      res.render("editar-perfil", {
        nombrePagina: "Edita tu Perfil",
        usuario: req.user,
        cerrarSesion: true,
        nombre: req.user.nombre,
        mensajes: req.flash(),
        imagen: req.user.imagen,
      });
      return;

}