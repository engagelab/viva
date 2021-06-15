/*
 Designed and developed by Richard Nesnass & Sharanya Manivasagam
*/
const crypto = require('crypto')
const bcrypt = require('bcrypt')
const https = require('https')
const jwt = require('jsonwebtoken')
const ObjectId = require('mongoose').Types.ObjectId
const User = require('./models/User')
const { userRoles } = require('./constants')

let TEST_MODE = false

const addZero = i => {
  return i < 10 ? '0' + i : i
}
const asFormattedDateString = date => {
  return (
    date.getDate() +
    '-' +
    (date.getMonth() + 1) +
    '-' +
    date.getFullYear() +
    '_' +
    addZero(date.getHours()) +
    '-' +
    addZero(date.getMinutes())
  )
}

function createReference(data) {
  return crypto
    .createHash('sha256')
    .update(data)
    .digest('base64');
}

// Returns a Promise(hashed version of the password)
const hash = (password) => bcrypt.hash(password, 10)
// Returns a Promise(true) if password matches the hashed password
const hashCompare = (password, hashedPassword) => bcrypt.compare(password, hashedPassword)

const tempUserStore = {}

const shuffleArray = (array) => {
  const a = array.slice()
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const setTestMode = (mode) => {
  TEST_MODE = mode
}

const getTestMode = () => TEST_MODE

function createToken(req, res, next) {
  const jwtToken = req.headers.authorization
    ? req.headers.authorization.substring(4)
    : req.query.jwt
  try {
    return jwt.verify(
      jwtToken,
      new Buffer.from(process.env.JWT_SECRET, 'base64')
    )
  } catch (error) {
    return next(error)
  }
}

function tokenAuth(req, res, next, googleMobileAppTransfer) {
  // This is needed to compensate for an Android issue where session cookie is not being set in the webview.
  // So we attempt to use the token for verification instead..
  const token = createToken(req, res)
  if (token && token.ref && tempUserStore[token.ref]) {
    // Avoid a DB lookup if possible
    req.session.ref = tempUserStore[token.ref]
    req.session.save()
    console.log(
      `${new Date().toUTCString()} Authorisation by token (temp store) for userid: ${
        req.session.ref
      } ${googleMobileAppTransfer ? 'for Google Transfer' : ''}`
    )
    return next()
  } else if (token && token.ref) {
    User.findOne({ reference: token.ref }, (err2, user) => {
      if (!err2 && user) {
        req.session.ref = user.id
        tempUserStore[token.ref] = user.id
        req.session.save()
        console.log(
          `${new Date().toUTCString()} Authorisation by token for userid: ${
            user.id
          } username: ${user.username} ${
            googleMobileAppTransfer ? 'for Google Transfer' : ''
          }`
        )
        return next()
      } else {
        return next(err2)
      }
    })
  }
}

const authoriseUser = (req, res, next) => {
  const device = req.query.device
  const mobileApp = typeof device === 'string' && device == 'mobileApp'
  const googleMobileAppTransfer =
    mobileApp && req.route.path == '/google_transfer'
  if (req.method == 'OPTIONS') {
    next()
  } else if (req.session && req.session.id && req.session.ref) {
    User.findById(req.session.ref, (usererr, user) => {
      if (!usererr && user) {
        res.locals.user = user
        req.session.user = user
        return next()
      } else {
        return next(usererr)
      }
    })
  } else if (req.headers.authorization || googleMobileAppTransfer) {
    tokenAuth(req, res, next, googleMobileAppTransfer)
  } else {
    var err = new Error('Invalid login')
    err.status = 401
    return next(err)
  }
}

// Check that a user has at least the role requested
const hasMinimumUserRole = (user, requestedRole) => {
  if (!user) return false
  switch (requestedRole) {
    case userRoles.user:
      return true
    case userRoles.monitor:
      return user.profile.role === userRoles.monitor ||
        user.profile.role === userRoles.admin
        ? true
        : false
    case userRoles.admin:
      return user.profile.role === userRoles.admin ? true : false
    default:
      return false
  }
}

/**  https Request to TSD/ outside portal from  VIVA server */
function httpRequest(params, postData) {
  return new Promise(function (resolve, reject) {
    const req = https.request(params, function (res) {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        reject(
          new Error(
            `Rejected HTTP Response. statusCode: ${res.statusCode} calling: ${
              params.hostname + params.path
            } `
          )
        )
      }
      let data = []
      res.on('data', function (chunk) {
        data.push(chunk)
      })
      res.on('end', function () {
        if(data.join("") === "") {
          // You are being throttled - handle it
          return reject(new Error('Remote server throttling'))
        } else if (data.join("").startsWith("<!DOCTYPE html>")) {
          // The user is invalid - handle it
          return reject(new Error('Invalid response'))
        } else {
          // Everything is OK
          // json = JSON.parse(Buffer.concat(data).toString())
          const json = JSON.parse(data.join(''));
          resolve(json)
        }
      })
    })
    req.on('error', function (error) {
      console.log(`HTTP Request error: ${error}`)
      reject(error)
    })
    if (postData) {
      req.write(postData)
    }
    req.end()
  })
}

const isValidObjectId = (id) =>
  ObjectId.isValid(id) && String(new ObjectId(id) === id)

module.exports = {
  asFormattedDateString,
  shuffleArray,
  createReference,
  hash,
  hashCompare,
  authoriseUser,
  hasMinimumUserRole,
  setTestMode,
  getTestMode,
  httpRequest,
  isValidObjectId,
}
