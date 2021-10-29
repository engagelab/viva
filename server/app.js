/*
 Designed and developed by Richard Nesnass, Sharanya Manivasagam, and Ole Smørdal

 This file is part of VIVA.

 VIVA is free software: you can redistribute it and/or modify
 it under the terms of the GNU Affero General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 GPL-3.0-only or GPL-3.0-or-later

 VIVA is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU Affero General Public License for more details.

 You should have received a copy of the GNU Affero General Public License
 along with VIVA.  If not, see <http://www.gnu.org/licenses/>.
 */

require('dotenv').config({ silent: process.env.NODE_ENV !== 'development' })

const express = require('express')
const session = require('express-session')
const MemoryStore = require('memorystore')(session)
const cors = require('cors')
const path = require('path')

// Local includes
const apiRoutes = require('./routing/api')
const authenticationRoutes = require('./routing/auth')
const uploadRoutes = require('./routing/tusUpload')

const app = express()
app.locals.pretty = true

// Send the whole build folder to the user or anyone connected to the server
app.use('/', express.static(path.join(__dirname, '../clients/admin/www')))
app.use('/lti', express.static(path.join(__dirname, '../clients/lti/www')))
app.use('/app', express.static(path.join(__dirname, '../clients/app/www')))
app.use(express.static(path.join(__dirname, '../server/public')))
app.use(express.json({ limit: '25mb', extended: true }))
app.use(express.urlencoded({ limit: '25mb', extended: true }))

const sessionOptions = {
  secret: process.env.SESSION_SECRET,
  resave: false,
  proxy: true,
  saveUninitialized: false,
  cookie: { httpOnly: true, maxAge: 86400000, sameSite: 'none', secure: true },
}

// We encounter CORS issues if the server is serving the webpage locally
// CORS (Cross-Origin Resource Sharing) headers to support Cross-site HTTP requests
if (process.env.NODE_ENV === 'development') {
  let origin = 'https://localhost'
  app.use((req, res, next) => {
    const allowedOrigins = [
      `${process.env.VUE_APP_SERVER_HOST}:${process.env.VUE_APP_SERVER_PORT}`,
      `${process.env.VUE_APP_SERVER_HOST}:8080`, // LTI dev
      `${process.env.VUE_APP_SERVER_HOST}:8081`, // Admin dev
      `${process.env.VUE_APP_SERVER_HOST}:8082`, // App dev
      `${process.env.ANDROID_CLIENT}`, // Android app dev
      `${process.env.IOS_CLIENT}`, // iOS app dev
      'https://auth.dataporten.no',
    ]
    let referer = req.headers.referer || req.headers.Referer
    if (referer) {
      if (referer.charAt(referer.length - 1) === '/') referer = referer.slice(0, -1)
      const i = allowedOrigins.indexOf(referer)
      if (i > -1) {
        origin = referer
        res.header('Access-Control-Allow-Origin', origin)
      }
    } else {
      const ip = req.ip.split(':').pop()
      res.header('Access-Control-Allow-Origin', `https://${ip}`)
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
  // app.use(cors({ credentials: true, origin }))
}
else if (process.env.NODE_ENV === 'test') {
  sessionOptions.cookie = { httpOnly: false, maxAge: 86400000, sameSite: 'none', secure: false }
} else {
  sessionOptions.store = new MemoryStore({
    checkPeriod: 86400000, // prune expired entries every 24h
  })
  app.use(cors({ credentials: true, origin: [/\.engagelab\.uio\.no$/, /\.instructure\.com$/] }))
}

// Setup secure session
app.set('trust proxy', 1) // trust first proxy
app.use(session(sessionOptions))

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

module.exports = { app }
