const Vacante = require("../models/Vacantes");
const multer = require("multer");
const shortid = require("shortid");

const { body, validationResult, sanitizeBody } = require("express-validator");

exports.formularioNuevaVacante = (req, res) => {
  res.render("nueva-vacante", {
    nombrePagina: "Nueva Vacante",
    tagline: "Llena el Formulario para Publicar la Oferta de Trabajo",
    cerrarSesion: true,
    nombre: req.user.nombre,
    imagen: req.user.imagen,
  });
};

//Agrega las vacantes a la base de datos
exports.agregarVacante = async (req, res) => {
  const vacante = new Vacante(req.body);

  //Usuario autor de la vacante
  vacante.autor = req.user._id;

  //CRear arreglo de hablidades(skills)
  vacante.skills = req.body.skills.split(",");

  //Almacenarlo en la bae de datos
  const nuevaVacante = await vacante.save();
  //Redirrecionar al usuario
  res.redirect(`/vacantes/${nuevaVacante.url}`);
};

//Muestra una vacnte
exports.mostrarVacante = async (req, res) => {
  const vacante = await Vacante.findOne({ url: req.params.url })
    .lean()
    .populate("autor");

  //Si no hay resultados
  if (!vacante) return next();

  res.render("vacante", {
    vacante,
    nombrePagina: vacante.titulo,

    barra: true,
  });
};

//Eitar una vacante
exports.formEditarVacante = async (req, res, next) => {
  const vacante = await Vacante.findOne({ url: req.params.url }).lean();
  //Si no hay resultados
  if (!vacante) return next();

  res.render("editar-vacante", {
    vacante,
    nombrePagina: `Editar - ${vacante.titulo}`,
    cerrarSesion: true,
    nombre: req.user.nombre,
    imagen: req.user.imagen,
  });
};

exports.editarVacante = async (req, res) => {
  const vacanteActualizada = req.body;

  vacanteActualizada.skills = req.body.skills.split(",");

  const vacante = await Vacante.findOneAndUpdate(
    { url: req.params.url },
    vacanteActualizada,
    {
      new: true,
      runValidators: true,
    }
  );

  res.redirect(`/vacantes/${vacante.url}`);
};

//Validar y sanitizar los campos de las nueva vacantes
exports.validarVacante = async (req, res, next) => {
  const rules = [
    //sanitizar y validar los campos
    body("titulo")
      .not()
      .isEmpty()
      .withMessage("El Titulo es obligatorio")
      .escape(),
    body("empresa")
      .not()
      .isEmpty()
      .withMessage("El nombre de la empresa es obligatorio")
      .escape(),
    body("ubicacion")
      .not()
      .isEmpty()
      .withMessage("La ubicacion es obligatoria")
      .escape(),
    body("salario")
      .not()
      .isEmpty()
      .withMessage("El salario es obligatorio")
      .escape(),
    body("contrato")
      .not()
      .isEmpty()
      .withMessage("El contrato es obligatorio")
      .escape(),
    body("skills")
      .not()
      .isEmpty()
      .withMessage("Agrega almenos una habilidad")
      .escape(),
  ];

  await Promise.all(rules.map((validation) => validation.run(req)));
  const errores = validationResult(req);

  //Silo errores estn vacios
  if (errores.isEmpty()) {
    return next();
  }

  //crear los errores
  req.flash(
    "error",
    errores.array().map((error) => error.msg)
  );
  res.render("nueva-vacante", {
    nombrePagina: "Nueva Oferta de trabajo",
    tagline: "Llena el formulario para llenar las ofertas de trabajo",
    cerrarSesion: true,
    nombre: req.user.nombre,
    mensajes: req.flash(),
  });
  return;
};

//Eliminar una vacante
exports.eliminarVacante = async (req, res) => {
  const { id } = req.params;

  const vacante = await Vacante.findById(id);

  if (verificarAutor(vacante, req.user)) {
    //Si esta bien se elimina
    vacante.deleteOne();
    res.status(200).send("Oferta de Trabajo Eliminada Correctamente");
  } else {
    //No esta permitido
    res.status(403).send("Error");
  }
};

const verificarAutor = (vacante = {}, usuario = {}) => {
  if (!vacante.autor.equals(usuario._id)) {
    return false;
  }
  return true;
};

//Subir hoja de vida en pdf
exports.subirCV = (req, res, next) => {
  upload(req, res, function (error) {
    if (error) {
      if (error instanceof multer.MulterError) {
        if (error.code === "LIMIT_FILE_SIZE") {
          req.flash("error", "El archivo es muy grande max: 1MB");
        } else {
          req.flash("error", error.message);
        }
      } else {
        req.flash("error", error.message);
      }
      res.redirect("back");
      return;
    } else {
      return next();
    }
  });
};

//Opciones de multer
const configuracionMulter = {
  limits: { fileSize: 1000000 },
  storage: (fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, __dirname + "../../public/uploads/cv");
    },
    filename: (req, file, cb) => {
      //Reescribe el nombre de la image
      const extension = file.mimetype.split("/")[1];
      cb(null, `${shortid.generate()}.${extension}`);
    },
  })),
  fileFilter(req, file, cb) {
    if (file.mimetype === "application/pdf") {
      //El callback se ejecut como true o false: true cuando el archivo se acepta
      cb(null, true);
    } else {
      cb(new Error("Formato no Valido"), false);
    }
  },
};

const upload = multer(configuracionMulter).single("cv");

//Almacenar los candiatos en la bse de datos
exports.contactar = async (req, res, next) => {
  const vacante = await Vacante.findOne({ url: req.params.url });

  //Si no exite la vacante
  if (!vacante) return next();

  //Si etsa todo bien hay que construir el objeto
  const nuevoCandidato = {
    nombre: req.body.nombre,
    email: req.body.email,
    celular: req.body.celular,
    cv: req.file.filename, //generado por multer
  };

  //Almacenar la vacante
  vacante.candidatos.push(nuevoCandidato);
  await vacante.save();

  //Mensaje flash y redirecciona
  req.flash("correcto", "Se Envio Correctamente");
  res.redirect("/");
};

//Mostrar los candidato
exports.mostrarCandidatos = async (req, res, next) => {
  const vacante = await Vacante.findById(req.params.id).lean();

  if (vacante.autor != req.user._id.toString()) {
    next();
  }

  if (!vacante) return next();

  res.render("candidatos", {
    nombrePagina: `Candidatos Vacante - ${vacante.titulo}`,
    cerrarSesion: true,
    nombre: req.user.nombre,
    imagen: req.user.imagen,
    candidatos: vacante.candidatos,
  });
};

//Buscador de vacantes
exports.buscarVacantes = async (req, res) => {
    const vacantes = await Vacante.find({

        $text: {
          $search: req.body.q,
        },

    }).lean();

  //Mostrar la vacantes
  res.render('home', {
    nombrePagina: `Resultados para la Busqueda : ${req.body.q}`,
    barra: true,
    vacantes

  })
};
