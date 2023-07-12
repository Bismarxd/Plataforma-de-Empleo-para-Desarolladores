const mongoose = require('mongoose')
mongoose.Promise = global.Promise
const slug = require('slug')
const shortid = require('shortid')

const vacantesSchema = new mongoose.Schema({
  titulo: {
    type: String,
    required: "El Nombre de la Vacante es Obligatorio",
    trim: true,
    index: 'text',
  },
  empresa: {
    type: String,
    trim: true,
  },
  ubicacion: {
    type: String,
    required: "La Ubicación es Obligatoria",
    trim: true,
  },
  salario: {
    type: String,
    default: 0,
    trim: true,
  },
  contrato: {
    type: String,
    trim: true,
  },
  descripcion: {
    type: String,
    trim: true,
    index: 'text',
  },
  url: {
    type: String,
    lowercase: true,
  },
  skills: {
    type: [String],
  },
  candidatos: [
    {
      nombre: String,
      email: String,
      celular: Number,
      cv: String,
    },
  ],
  autor: {
    type: mongoose.Schema.ObjectId,
    ref: "Usuarios",
    required: "El autor es obligatorio",
  },
});
vacantesSchema.pre('save', function(next) {
    
    //Crear la URL
    const url = slug(this.titulo)
    this.url = `${url}-${shortid.generate()}` //shortid genera un id unico

    next()
})

//Crear un indice
vacantesSchema.index({titulo : 'text'});

module.exports = mongoose.model('Vacante', vacantesSchema);