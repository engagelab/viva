const jwt = require('jsonwebtoken')
const { userRoles } = require('../../constants')
const { createReference } = require('../../utilities')
const User = require('../../models/User')
const dataporten = require('../../services/dataporten')
const canvas = require('../../services/canvas')

function signJWT(data) {
  return jwt.sign(
    { ref: data },
    new Buffer.from(process.env.JWT_SECRET, 'base64'),
    { expiresIn: process.env.VUE_APP_JWT_EXPIRY + 's' }
  )
}

async function setUserAttributes(user, userProfile, userIdentifier, tokenSet) {
  user.profile.oauthId = userIdentifier.sub || userIdentifier.id || ''
  user.profile.reference = createReference(user.profile.oauthId)
  user.profile.fullName = userProfile.name
  user.profile.username = user.profile.fullName.replace(/[^\d\s\wæøå&@]/gi, '')
  user.profile.email = userProfile.email || userProfile.primary_email || ''
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
  user.status.provider = userProfile.provider
  if (userProfile.roles) {
    user.status.role = userProfile.roles.some((role) => role.includes('Admin'))
      ? userRoles.admin
      : userRoles.user
  }
}

function setUserGroups(user) {
  if (user.status.provider === 'dataporten') {
       return dataporten.groupsForUser(user.tokens.access_token).then((groups) => {
        user.profile.groups = groups.map((g) => ({ id: g.id, name: g.displayName }))
       })
  } else if (user.status.provider === 'canvas') {
      return canvas.coursesForUser(user.tokens.access_token).then((courses) => {
        user.profile.groups = courses.map((c) => ({ id: c.id, name: c.course_code }))
      })
  } else {
    return Promise.resolve()
  }
}

function createOrUpdateUser(tokenSet, userIdentifier, profile) {
  const query = { }
  if (userIdentifier.sub) query['profile.oauthId'] = userIdentifier.sub
  else if (userIdentifier.email) query['profile.email'] = userIdentifier.email
  else if (userIdentifier.id) query._id = userIdentifier.id
  const userProfile = profile.data ? profile.data : profile

  return new Promise((resolve, reject) => {
    User.findOne(query, async (err, usr) => {
      let user
      if (err) return reject(`Error checking user ${err}`)
      user = usr || new User()
      setUserAttributes(user, userProfile, userIdentifier, tokenSet)
      if (user.tokens.access_token) await setUserGroups(user)
      try {
        const savedUser = await user.save()
        resolve(savedUser)
      } catch (e) {
        console.error(e);
      }
    })
  })
}

// Return to the client with the correct data to continue login
function completeCallback(request, response, user) {
  let redirectUrl
  let s = ''
  const { client, remember, device } = request.session
  const host = process.env.VUE_APP_SERVER_HOST

  if (client === 'lti') {
    redirectUrl = process.env.NODE_ENV === 'development' ? `${host}:8080` : `${host}/lti`
  } else if (client === 'admin') {
    redirectUrl = process.env.NODE_ENV === 'development' ? `${host}:8081` : `${host}`
  }
  // Mobile app will be passed a token via Apple's ASWebAuthenticationSession / Google Custom Tabs
  // which must then be passed back to the /token route obtain a Session
  else if (client === 'mobileApp') {
    if (device == 'mobileApp') {
      redirectUrl = `${process.env.APP_BUNDLE_ID}://oauth_callback?mode=login&code=${user.tokens.local_token}&remember=${remember}`
      s = `${new Date().toLocaleString()}: Mobile App Login: ${user.fullName}`
    } else {
      redirectUrl = process.env.NODE_ENV === 'development' ? `${host}:8082` : `${host}/app`
    }
  }

  // Engagelab server Vue App uses the 'hash' based history system, as it must proxy to a subdirectory
  if (process.env.NODE_ENV === 'testing') {
    redirectUrl = redirectUrl + '/#/postlogin'
  }
  else redirectUrl = redirectUrl + '/postlogin'

  // Set the session here at last!
  // Web app receives a Session immediately, does not need to pass a token
  request.session.ref = user.id
  s = `${new Date().toLocaleString()}: Web App Login: ${user.fullName}`
  console.log(s)
  console.log(`Session: ${request.session.ref}`)
  return response.redirect(redirectUrl)
}

module.exports = {
  createOrUpdateUser,
  completeCallback,
}
