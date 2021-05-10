const jwt = require('jsonwebtoken')
const utilities = require('../utilities')
const { createReference } = require('../../utilities')
const User = require('../../models/User')

function createOrUpdateUser(tokenSet, userIdentifier, profile) {
  return new Promise(function (resolve, reject) {
    const query = {}
    if (userIdentifier.sub) query.oauthId = userIdentifier.sub
    else if (userIdentifier.id) query._id = userIdentifier.id
    const userProfile = profile.data ? profile.data : profile
    User.findOne(query, async (err, usr) => {
      let user

      if (err) {
        console.log(`Error checking user ${err}`)
        reject(err)
      } else if (!err && usr !== null) {
        user = usr
      } else {
        user = new User()
      }

      if (!user.oauthId) {
        user.oauthId = userIdentifier.sub || userIdentifier.id
      }
      if (!user.reference) {
        user.reference = createReference(user.oauthId)
      }
      if (!user.username) {
        if (userProfile.email) {
          user.username = userProfile.email.substring(
            0,
            userProfile.email.lastIndexOf('@')
          )
        } else {
          if (!user.fullName) {
            user.fullName = userProfile.name
          }
          user.username = user.fullName.replace(/[^\d\s\wæøå&@]/gi, '')
        }
      }
      if (
        !user.lastLogin ||
        (user.lastLogin &&
          new Date().getTime() - new Date(user.lastLogin).getTime() >
            1000 * 60 * 60)
      ) {
        user.lastLogin = new Date()
      }

      // Tokens from Issuer service
      if (tokenSet.access_token) user.tokens.access_token = tokenSet.access_token
      if (tokenSet.id_token) user.tokens.id_token = tokenSet.id_token
      // Token to validate a Google Drive transfer. To be used in conjunction with Dataporten Tokens
      user.tokens.csrf_token = require('crypto').randomBytes(20).toString('hex')
      // Token for API requests to VIVA
      user.tokens.local_token = jwt.sign(
        { ref: user.id },
        new Buffer.from(process.env.JWT_SECRET, 'base64'),
        { expiresIn: process.env.VUE_APP_JWT_EXPIRY + 's' }
      )
      user.provider = Object.keys(userProfile).includes('lis_person_sourcedid')
      ? 'canvas'
      : 'Dataporten'

      if (userProfile.roles) {
        user.isAdmin = userProfile.roles.find(
          (role) => role.includes('Admin') == true
        )
          ? true
          : false
      }

      user
        .save()
        .then((savedUser) => {
          resolve(savedUser)
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
        ? `${utilities.baseUrl}/#/login`
        : `${utilities.baseUrl}/login`
  }
  console.log(s)
  console.log(`Session: ${request.session.ref}`)
  return response.redirect(redirectUrl)
}

module.exports = {
  createOrUpdateUser,
  completeCallback,
}
