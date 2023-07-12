const mongoose = require('mongoose')
require('./config/db')

const express = require('express')
const exphbs = require('express-handlebars');
const path = require('path')
const router = require('./routes')
const cookieParser = require('cookie-parser')
const session = require('express-session')
const MongoStore = require('connect-mongo')
const bodyParser = require('body-parser')
const flash = require('connect-flash')
const createError = require('http-errors')
const passport = require('./config/passport');
const { log } = require('console');

require('dotenv').config({path: 'variables.env'})

const app = express();

//Habilitar body parser
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))

//Validacion de campos con expreess-validator


//Habilitar Handlebars como view
app.engine('handlebars', 
    exphbs.engine({
        defaultLayout: 'layout',
        helpers: require('./helpers/handlebars')
    })
);
app.set('view engine', 'handlebars');

//static files
app.use(express.static(path.join(__dirname, 'public')));

app.use(cookieParser())

app.use(
  session({
    secret: process.env.SECRETO,
    key: process.env.key,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.DATABASE })
  })
);

//iniciar passport para la autenticacion
app.use(passport.initialize());
app.use(passport.session());

//Alertas y flash de Mensajes
app.use(flash());

//Crear un middleware
app.use((req, res, next) => {
  res.locals.mensajes = req.flash();
  next();
})

app.use('/', router())

//404 pagina no existente
app.use((req, res, next) => {
  next(createError(404, 'No Encontrado'))
})

//Administracion de errores
app.use((error, req, res, next) => {
  res.locals.mensaje = error.message
  const status = error.status || 500;

  res.locals.status = status;
  res.status(status)
  res.render('error')
})

//Dejar que el servidor asigne el puerto
const host = '0.0.0.0'
const port = process.env.PUERTO;

app.listen(port, host, () => {
  console.log(`El Servidor esta funcionando en el puerto: ${port}`);
})