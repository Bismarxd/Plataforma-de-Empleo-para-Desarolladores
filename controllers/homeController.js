const Vacante = require("../models/Vacantes");

exports.mostrarTrabajos = async (req, res) => {

    const vacantes = await Vacante.find().lean();

    if (!vacantes) return next() 

  res.render("home", {
    nombrePagina: "TechHire- Plataforma de Empleo",
    tagline: "Encuentra y Pública Trabajo para Desarolladores",
    barra: true,
    boton: true,
    vacantes
  });
};
