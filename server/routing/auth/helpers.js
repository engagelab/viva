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
function setUserAttributes(user, profile, tokenSet) {
  user.profile.username = profile.login_id
  user.profile.provider_id = profile.provider_id
  user.profile.ltiID = profile.ltiID
  user.profile.reference = createReference(
    user.profile.provider_id || user.profile.ltiID || user.profile.username
  )
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
  if (!tDiff || tDiff > 1000 * 60 * 60) user.status.lastLogin = new Date()
}

// Check the 'prerequisite' course has been completed
// This is the course id environment variable: CANVAS_DEPENDENT_COURSE_ID
// Set the env var to 'none' to skip this step
// If the user is an admin, also skip this step
function setPrerequisiteCourseProgress(user) {
  if (
    process.env.CANVAS_DEPENDENT_COURSE_ID === 'none'
    // || user.status.role === userRoles.admin
  ) {
    user.status.prerequisiteCompleted = true
    return Promise.resolve()
  }
  return canvas
    .courseProgress(
      `sis_login_id:${user.profile.username}`,
      process.env.CANVAS_DEPENDENT_COURSE_ID
    )
    .then((progress) => {
      user.status.prerequisiteCompleted =
        progress.requirement_count == progress.requirement_completed_count
      console.log(
        `Dependent course was completed: ${user.status.prerequisiteCompleted}`
      )
    })
    .catch((error) => {
      console.log(
        `Error requesting prerequisite course progress from Canvas: ${error}. Check that at least one 'requirement' is added to a module`
      )
      return Promise.resolve()
    })
}

// Configure the User model with the list of courses
async function setUserGroups(user, coursesInAccount) {
  let courses = []
  if (user.status.role === userRoles.admin) courses = coursesInAccount
  else {
    for (let c of coursesInAccount) {
      const users = await canvas.usersForCourse(c.id)
      const t = users.some((u) => u.login_id === user.profile.username)
      if (t) courses.push(c)
    }
  }
  user.profile.groups = courses.map((c) => {
    return { id: c.id, name: c.course_code }
  })
}

function getUserGroups(user) {
  // The 'organization' determines what system takes care of groups
  const config = organizations[user.profile.organization]
  if (config.platform === platforms.dataporten) {
    return dataporten.groupsForUser(user).then((groups) => {
      user.profile.groups = groups.map((g) => ({
        id: g.id,
        name: g.displayName,
      }))
    })
  } else if (config.platform === platforms.canvas) {
    return canvas
      .coursesInAccount(process.env.CANVAS_VIVA_ACCOUNT_ID)
      .then((coursesInAccount) => setUserGroups(user, coursesInAccount))
      .catch((error) => console.log(error))
  } else {
    return Promise.resolve()
  }
}

function setUserRole(user) {
  return canvas
    .usersForGroup(process.env.CANVAS_ADMIN_GROUP_ID)
    .then((users) => {
      if (users.some((u) => u.login_id === user.profile.username)) {
        user.status.role = userRoles.admin
        console.log(`User ${user.profile.username} was set to 'admin' role`)
      } else user.status.role = userRoles.user
    })
    .catch((err) => {
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
      if (process.env.NODE_ENV !== 'testing') {
        if (profile.client === 'admin') {
          await setUserRole(user)
        }
        await getUserGroups(user)
        await setPrerequisiteCourseProgress(user)
      }
      try {
        const savedUser = await user.save()
        resolve(savedUser)
      } catch (e) {
        console.error(e)
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
  const isEngagelab = host.includes('engagelab')
  const isVivaProduction = host.includes('viva')

  if (client === 'lti') {
    redirectUrl =
      process.env.NODE_ENV === 'development' && !isEngagelab && !isVivaProduction
        ? `${host}:8080`
        : `${host}/lti`
    s = `${new Date().toLocaleString()}: LTI Login: ${user.profile.username}`
  } else if (client === 'admin') {
    redirectUrl =
      process.env.NODE_ENV === 'development' && !isEngagelab && !isVivaProduction
        ? `${host}:8081`
        : `${host}`
    s = `${new Date().toLocaleString()}: Admin Login: ${user.profile.username}`
  }
  // Mobile app will be passed a token via Apple's ASWebAuthenticationSession / Google Custom Tabs
  // which must then be passed back to the /token route obtain a Session
  else if (client === 'mobileApp' || client === 'webApp') {
    if (client === 'mobileApp') {
      // This calls the app's custom scheme 'viva' that must be defined in Cordova's config.xml and XCode at Info > URL Types
      redirectUrl = `viva://oauth_callback?mode=login&code=${user.tokens.local_token}&remember=${remember}`
      s = `${new Date().toLocaleString()}: Mobile App Login: ${user.fullName}`
    } else {
      redirectUrl =
        process.env.NODE_ENV === 'development' && !isEngagelab && !isVivaProduction
          ? `${host}:8082`
          : `${host}/app`
    }
  }

  // Engagelab / VIVA Prod server Vue App uses the 'hash' based history system, as it must proxy to a subdirectory
  if (isEngagelab || isVivaProduction) {
    redirectUrl = redirectUrl + '/#/postlogin'
  } else redirectUrl = redirectUrl + '/postlogin'

  // Set the session here at last!
  // Web app receives a Session immediately, does not need to pass a token
  request.session.ref = user.id
  if (process.env.NODE_ENV !== 'testing') {
    console.log(`Redirecting client to: ${redirectUrl}`)
    console.log(`${s} Session: ${request.session.ref}`)
  }
  return response.redirect(redirectUrl)
}

module.exports = {
  createOrUpdateUser,
  completeCallback,
}
