/*
 Designed and developed by Richard Nesnass and Sharanya Manivasagam
*/

require('dotenv').config({ silent: process.env.NODE_ENV !== 'development' })

const express = require('express')
const session = require('express-session')
const MemoryStore = require('memorystore')(session)

const cors = require('cors')
const path = require('path')

// Local includes
const db = require('./database')
const apiRoutes = require('./routing/api')
const authenticationRoutes = require('./routing/auth')
const setup = require('./setup')
// Create directories if necessary
setup.createVideoDirectories()

const uploadRoutes = require('./routing/tusUpload')

db.connect('VIVA Server')
const app = express()
app.locals.pretty = true

// Send the whole build folder to the user or anyone connected to the server
app.use('/', express.static(path.join(__dirname, '../clients/admin/www')))
app.use('/lti', express.static(path.join(__dirname, '../clients/lti/www')))
app.use('/app', express.static(path.join(__dirname, '../clients/app/www')))
app.use(express.static(path.join(__dirname, '../server/public')))
app.use(express.json({ limit: '25mb', extended: true }))
app.use(express.urlencoded({ limit: '25mb', extended: true }))

// We encounter CORS issues if the server is serving the webpage locally
// CORS (Cross-Origin Resource Sharing) headers to support Cross-site HTTP requests
if (process.env.NODE_ENV === 'development') {
  let origin = ''
  app.use((req, res, next) => {
    const allowedOrigins = [
      `${process.env.VUE_APP_SERVER_HOST}:${process.env.VUE_APP_SERVER_PORT}`,
      `${process.env.VUE_APP_SERVER_HOST}:8080`,
      `${process.env.VUE_APP_SERVER_HOST}:8081`,
      `${process.env.VUE_APP_SERVER_HOST}:8082`,
      'https://auth.dataporten.no'
    ]
    let referer = req.headers.referer || req.headers.Referer
    if (referer.charAt(referer.length - 1) === '/') referer = referer.slice(0, -1)
    const i = allowedOrigins.indexOf(referer)
    if (i > -1) {
      origin = referer
      res.header('Access-Control-Allow-Origin', origin)
    }
    // add details of what is allowed in HTTP request headers to the response headers
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
  app.use(cors({ credentials: true, origin }))
}
else app.use(cors({ credentials: true, origin: process.env.VUE_APP_SERVER_HOST }))

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
app.use('/auth', authenticationRoutes)
app.use('/api', apiRoutes)

function clientErrorHandler(err, req, res, next) {
  if (req.xhr) {
    res.status(400).send({ err })
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
