/*
 Designed and developed by Richard Nesnass and Sharanya Manivasagam
*/

require('dotenv').config({ silent: process.env.NODE_ENV !== 'development' })

const express = require('express')


//const MemoryStore = require('memorystore')(session)


const session = require('express-session')
const MemoryStore = require('memorystore')(session)

const cors = require('cors')
const path = require('path')

// Local includes
const utilities = require('./utilities')
const db = require('./database')
const apiRoutes = require('./routing/api')
const authenticationRoutes = require('./routing/auth')
const setup = require('./setup')
// Create directories if necessary
setup.createVideoDirectories()

const uploadRoutes = require('./routing/tusUpload')

db.connect('VIVA Sever')
const app = express()
app.locals.pretty = true

// Content Security Policy
/* app.use(function(req, res, next) {
  res.setHeader("Content-Security-Policy", "default-src 'self' data: gap: file: mailto:* cdvfile: content: https://ssl.gstatic.com 'unsafe-eval' 'unsafe-inline'");
  return next();
}); */

// Send the whole build folder to the user or anyone connected to the server
app.use(express.static(path.join(__dirname, '../clients/app/www')))
app.use('/lti', express.static(path.join(__dirname, '../clients/lti/www')))
app.use(express.static(path.join(__dirname, '../server/public')))
app.use(express.json({ limit: '25mb', extended: true }))
app.use(express.urlencoded({ limit: '25mb', extended: true }))

// We encounter CORS issues if the server is serving the webpage locally
// CORS (Cross-Origin Resource Sharing) headers to support Cross-site HTTP requests
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    // res.header('Access-Control-Allow-Origin', 'http://localhost:8080');
    const allowedOrigins = [
      `${process.env.VUE_APP_SERVER_HOST}:${process.env.VUE_APP_SERVER_PORT}`,
    ]
    const host = `${req.protocol}://${req.get('Host')}`
    const i = allowedOrigins.indexOf(host)
    let origin = req.headers.Origin || req.headers.origin
    if (i > -1 && typeof origin === 'undefined') {
      origin = allowedOrigins[i]
    }
    // add details of what is allowed in HTTP request headers to the response headers
    res.header('Access-Control-Allow-Origin', origin)
    res.header(
      'Access-Control-Allow-Methods',
      'POST, GET, PUT, DELETE, OPTIONS'
    )
    res.header('Access-Control-Max-Age', '86400')
    res.header(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, DELETE, OPTIONS, PATCH'
    )
    res.header(
      'Access-Control-Allow-Headers',
      'Origin, Content-Type, X-Requested-With, X-HTTP-Method-Override, Accept, Authorization, tus-resumable, upload-offset'
    )
    res.header('Access-Control-Allow-Credentials', true)
    return next()
  })
}
app.use(cors({ credentials: true, origin: utilities.baseUrl }))

const sessionOptions = {
  secret: process.env.SESSION_SECRET,
  store: new MemoryStore({
    checkPeriod: 86400000, // prune expired entries every 24h
  }),
  rolling: true,
  resave: true,
  saveUninitialized: true,
  cookie: { httpOnly: true, maxAge: 86400000, sameSite: 'none' },
}

// Start a secure server
app.set('trust proxy', 1) // trust first proxy
sessionOptions.proxy = true
sessionOptions.cookie.secure = true // serve secure cookies
app.use(session(sessionOptions))

// Redirect http calls to https
app.use((req, res, next) => {
  if (!req.secure) {
    const redirect = `https://${req.headers.host}${req.url}`
    return res.redirect(redirect)
  }
  return next()
})

app.use('/upload', uploadRoutes)
app.use('/viva/auth', authenticationRoutes)
app.use('/api', apiRoutes)

function clientErrorHandler(err, req, res, next) {
  if (req.xhr) {
    res.status(500).send({ err })
  } else {
    next(err)
  }
}
function errorHandler(req, res) {
  res.status(400).end()
}
app.use(clientErrorHandler)
app.use(errorHandler)

module.exports = app
