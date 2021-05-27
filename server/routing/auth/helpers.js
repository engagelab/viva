const jwt = require('jsonwebtoken')
const { userRoles } = require('../../constants')
const { createReference, baseUrl } = require('../../utilities')
const User = require('../../models/User')
const dataporten = require('../services/dataporten')
const canvas = require('../services/canvas')

function signJWT(data) {
  return jwt.sign(
    { ref: data },
    new Buffer.from(process.env.JWT_SECRET, 'base64'),
    { expiresIn: process.env.VUE_APP_JWT_EXPIRY + 's' }
  )
}

async function setUserAttributes(user, userProfile, userIdentifier, tokenSet) {
  user.profile.oauthId = userIdentifier.sub || userIdentifier.id
  user.profile.reference = createReference(user.profile.oauthId)
  user.profile.fullName = userProfile.name
  user.profile.username = user.profile.fullName.replace(/[^\d\s\wæøå&@]/gi, '')
  if (userProfile.email) {
    const lastIndex = userProfile.email.lastIndexOf('@')
    user.profile.username = userProfile.email.substring(0, lastIndex)
  }
  const tDiff = new Date().getTime() - new Date(user.status.lastLogin).getTime()
  if (tDiff > 1000 * 60 * 60) user.status.lastLogin = new Date()

  // Tokens from Issuer service
  if (tokenSet.access_token) user.tokens.access_token = tokenSet.access_token
  if (tokenSet.id_token) user.tokens.id_token = tokenSet.id_token
  // Token to validate a Google Drive transfer. To be used in conjunction with Dataporten Tokens
  user.tokens.csrf_token = require('crypto').randomBytes(20).toString('hex')
  // Token for API requests to VIVA
  user.tokens.local_token = signJWT(user.id)
  user.status.provider = Object.keys(userProfile).includes(
    'lis_person_sourcedid'
  )
    ? 'canvas'
    : 'dataporten'

  if (userProfile.roles) {
    user.status.role = userProfile.roles.some((role) => role.includes('Admin'))
      ? userRoles.admin
      : userRoles.user
  }
}

async function setUserGroups(user) {
  switch (user.status.provider) {
    case 'dataporten':
      user.profile.groups = await dataporten.groupsForUser(user)
      break
    case 'canvas':
      user.profile.groups = await canvas.groupsForUser(user)
      break
    default:
      break
  }
}

function createOrUpdateUser(tokenSet, userIdentifier, profile) {
  const query = {}
  if (userIdentifier.sub) query.oauthId = userIdentifier.sub
  else if (userIdentifier.id) query._id = userIdentifier.id
  const userProfile = profile.data ? profile.data : profile

  return new Promise((resolve, reject) => {
    User.findOne(query, (err, usr) => {
      let user
      if (err) return reject(`Error checking user ${err}`)
      user = usr || new User()
      setUserAttributes(user, userProfile, userIdentifier, tokenSet)
      try {
        setUserGroups(user)
      } catch (error) {
        reject(error)
      }
      user
        .save()
        .then((savedUser) => {
          return resolve(savedUser)
        })
        .catch((error) => {
          return reject(error)
        })
    })
  })
}

// Return to the client with the correct data to continue login
function completeCallback(request, response, user, device, remember) {
  let redirectUrl
  let s = ''
  const mobileApp = typeof device === 'string' && device == 'mobileApp'

  // Mobile app will be passed a token via Apple's ASWebAuthenticationSession / Google Custom Tabs
  // which must then be passed back to the /token route obtain a Session
  if (mobileApp) {
    redirectUrl = `${process.env.APP_BUNDLE_ID}://oauth_callback?mode=login&code=${user.tokens.local_token}&remember=${remember}`
    s = `${new Date().toLocaleString()}: Mobile App Login: ${user.fullName}`
  } else {
    // Set the session here at last!
    // Web app receives a Session immediately, does not need to pass a token
    request.session.ref = user.id
    s = `${new Date().toLocaleString()}: Web App Login: ${user.fullName}`
    // Engagelab server Vue App uses the 'hash' based history system, as it must proxy to a subdirectory
    redirectUrl =
      process.env.NODE_ENV === 'testing'
        ? `${baseUrl}/#/login`
        : `${baseUrl}/login`
  }
  console.log(s)
  console.log(`Session: ${request.session.ref}`)
  return response.redirect(redirectUrl)
}

module.exports = {
  createOrUpdateUser,
  completeCallback,
}
