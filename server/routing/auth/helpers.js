const jwt = require('jsonwebtoken')
const { userRoles, organizations, platforms } = require('../../constants')
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

/*
Sample profile = {
            provider: 'dataporten',
            provider_id: data.sub,
            login_id: '',    // <-- THIS is intended to match Dataporten user ID and Canvas LTI + API token user ID
            email: data.email || '',
            fullName: data.name || '',
            organization: ''
          }
*/
async function setUserAttributes(user, profile, tokenSet) {
  user.profile.username = profile.login_id
  user.profile.provider_id = profile.provider_id
  user.profile.reference = createReference(user.profile.provider_id)
  user.profile.fullName = profile.fullName
  user.profile.email = profile.email
  user.profile.organization = profile.organization

  // Tokens from Issuer service
  if (tokenSet.access_token) user.tokens.access_token = tokenSet.access_token
  if (tokenSet.id_token) user.tokens.id_token = tokenSet.id_token
  // Token to validate a Google Drive transfer. To be used in conjunction with Dataporten Tokens
  user.tokens.csrf_token = require('crypto').randomBytes(20).toString('hex')
  // Token for API requests to VIVA
  user.tokens.local_token = signJWT(user.id)

  // Status update
  user.status.provider = profile.provider
  const tDiff = new Date().getTime() - new Date(user.status.lastLogin).getTime()
  if (tDiff > 1000 * 60 * 60) user.status.lastLogin = new Date()
}

// Check the 'prerequisite' course has been completed
// This is the course id environment variable: CANVAS_DEPENDENT_COURSE_ID
function getPrerequisiteCourseProgress(user) {
  if (process.env.CANVAS_DEPENDENT_COURSE_ID === 'none') {
    user.status.prerequisiteCompleted = true
    return Promise.resolve()
  }
  // TODO: Fix this for superToken..
  return canvas.courseProgress(user.tokens.access_token, user.profile.oauthId, process.env.CANVAS_DEPENDENT_COURSE_ID).then((progress) => {
    user.status.prerequisiteCompleted = progress.requirement_count == progress.requirement_completed_count
  })
}

function setUserGroups(user) {
  // The 'organization' determines what system takes care of groups
  const platform = organizations[user.profile.organization]
  if (platform === platforms.dataporten) {
       return dataporten.groupsForUser(user).then((groups) => {
        user.profile.groups = groups.map((g) => ({ id: g.id, name: g.displayName }))
       })
  } else if (platform === platforms.canvas) {
    return canvas.coursesInAccount(process.env.CANVAS_VIVA_ACCOUNT_ID)
    .then(async (coursesInAccount) => {
      const courses = []
      for (let c of coursesInAccount) {
        canvas.usersForCourse(c.id).then((users) => {
          const t = users.some((u) => u.login_id === user.profile.username)
          if (t) courses.push(c)
        })
      }
      user.profile.groups = courses.map((c) => {
        let isAdmin = c.enrollments.length && c.enrollments.some((e) => e.role === process.env.CANVAS_ADMIN_ROLE)
        return { id: c.id, name: c.course_code, isAdmin }
      })
      return getPrerequisiteCourseProgress(user)
    })
    .catch((error) => console.log(error))
  } else {
    return Promise.resolve()
  }
}

function setUserRole(user) {
  // TESTING
  canvas.coursesForUser(`sis_login_id:${user.profile.username}`)
    .then((courses) => console.log(courses))
    .catch((error) => console.log(error))

  return canvas.usersForGroup(process.env.CANVAS_ADMIN_GROUP_ID).then((users) => {
    if (users.some((u) => u.login_id === user.profile.username)) {
      user.status.role = userRoles.admin
      console.log(`User ${user.profile.username} was set to 'admin' role`)
    }
    else user.status.role = userRoles.user
  }).catch((err) => {
    console.error(err)
  })
}

function createOrUpdateUser(tokenSet, profile) {
  return new Promise((resolve, reject) => {
    User.findOne({ 'profile.username': profile.login_id }, async (err, usr) => {
      let user
      if (err) return reject(`Error checking user ${err}`)
      user = usr || new User()
      setUserAttributes(user, profile, tokenSet)
      if (profile.client === 'mobileApp' || profile.client === 'lti') {
        await setUserGroups(user)
      } else if (profile.client === 'admin') {
        await setUserRole(user)
      }
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
  const { client, remember } = request.session
  const host = process.env.VUE_APP_SERVER_HOST

  if (client === 'lti') {
    redirectUrl = process.env.NODE_ENV === 'development' ? `${host}:8080` : `${host}/lti`
  } else if (client === 'admin') {
    redirectUrl = process.env.NODE_ENV === 'development' ? `${host}:8081` : `${host}`
  }
  // Mobile app will be passed a token via Apple's ASWebAuthenticationSession / Google Custom Tabs
  // which must then be passed back to the /token route obtain a Session
  else if (client === 'mobileApp' || client === 'webApp') {
    if (client === 'mobileApp') {
      redirectUrl = `viva://oauth_callback?mode=login&code=${user.tokens.local_token}&remember=${remember}`
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
