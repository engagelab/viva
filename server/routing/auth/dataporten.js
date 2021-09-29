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
const router = require('express').Router()
const { generators } = require('openid-client')
const jwt = require('jsonwebtoken')
const User = require('../../models/User')
const { organizations } = require('../../constants')
const { createOrUpdateUser, completeCallback } = require('./helpers')
const openidClient = require('../../services/openid')

// Activate the Dataporten Clients
const DPClient = openidClient.createClient('dataporten').client

// --------------- For Dataporten Login -----------------

router.get('/dataporten/login', (req, res) => {
  const { organization, remember, testing, client } = req.query
  if (Object.keys(organizations).includes(organization)) {
    req.session.organization = organization // Which organization is hosting the service e.g. 'uio'
  }
  req.session.client = client // Administration: 'admin' or Recorder: 'webApp' / 'mobileApp'
  req.session.remember = remember
  req.session.testing = testing || ''

  const code_verifier = generators.codeVerifier()
  // store the code_verifier in the framework's session mechanism, if it is a cookie based solution
  // it should be httpOnly (not readable by javascript) and encrypted.
  req.session.code_verifier = code_verifier
  const code_challenge = generators.codeChallenge(code_verifier)

  let redirectUrl = ''
  if (process.env.NODE_ENV === 'test') {
    const split = process.env.VUE_APP_SERVER_HOST.split(':')
    redirectUrl = `http:${split[1]}:${process.env.VUE_APP_SERVER_PORT}/auth/dataporten/callback` // Jest tests function on HTTP protocol
  } else {
    redirectUrl = DPClient.authorizationUrl({
      scope:
        'openid groups profile email userid userid-feide groups-org groups-edu groups-other',
      // resource: 'https://my.api.example.com/resource/32178',
      code_challenge,
      code_challenge_method: 'S256',
    })
  }
  res.redirect(redirectUrl)
})

// Given data from the LTI launch, retrieve the login_id we need to match the Dataporten user ID
function getProviderLoginID(pdata) {
  let login_id = ''
  let provider_id =
  pdata['dataporten-userid_sec'] || pdata['connect-userid_sec']
  provider_id = provider_id.length > 0 ? provider_id[0].split(':') : []
  login_id = provider_id.length === 2 ? provider_id[1] : ''
  return login_id
}

router.get('/dataporten/callback', function (request, response) {
  const { code_verifier, testing, organization, client } = request.session

  // FOR AUTOMATED TESTS ONLY. This section will return directly without contacting dataporten
  if (process.env.NODE_ENV === 'test') {
    const tokenSet = {
      access_token: '',
      id_token: '',
    }
    const profile = {
      provider: 'dataporten',
      provider_id: '',
      login_id: 'testuser1', // <-- THIS is intended to match Dataporten user ID and Canvas LTI + API token user ID
      email: `${testing}@engagelab.uio.no`,
      fullName: 'Test User',
      organization: organization,
      ltiID: '1',
      client,
    }
    return createOrUpdateUser(tokenSet, profile).then((user) =>
      completeCallback(request, response, user)
    )
  }

  // Verify the received code with Dataporten, which should return the tokenSet
  const params = DPClient.callbackParams(request)
  DPClient.callback(DPClient.metadata.redirect_uris[0], params, {
    code_verifier,
  }) // => Promise
    .then((tokenSet) => {
      const tokenInfo = tokenSet.claims()
      if (
        tokenInfo.iss != 'https://auth.dataporten.no' ||
        tokenInfo.aud != process.env.FEIDE_CLIENT_ID
      ) {
        const e = 'Invalid token at login'
        const error = new Error(e)
        console.error(`Invalid token at login. Tokeninfo: `)
        console.dir(tokenInfo)
        return response.status(403).send(error)
      }

      // Now use the access_token to retrieve user profile information
      DPClient.userinfo(tokenSet.access_token, {
        params: { scope: 'groups-org groups-edu groups-other' },
      }) // => Promise
        .then((data) => {

          // Dataporten calls for retrieving GROUPS and ORGS (orgs not working..)

          /*           const options = {
            host: 'groups-api.dataporten.no',
            path: `/groups/me/groups`,
            method: 'GET',
            headers: {
              Authorization: `Bearer ${tokenSet.access_token}`,
              'Content-Type': 'application/json',
            },
          }
          httpRequest(options, '').then((groups) => {
            console.dir(groups)
            const options2 = {
              host: 'api.feide.no',
              path: `/2/org/all`,
              method: 'GET',
              headers: {
                Authorization: `Bearer ${tokenSet.access_token}`,
                'Content-Type': 'application/json',
              },
            }
            httpRequest(options2, '').then((orgs) => {
              console.dir(orgs)
            }).catch(error => console.log(error.toString()))
          }) */

          console.log(
            `\nGot DP user; logging in ${data.name} : ${data.email} ...`
          )
          const profile = {
            provider: 'dataporten',
            provider_id: data.sub,
            login_id: getProviderLoginID(data), // <-- THIS is intended to match Dataporten user ID and Canvas LTI + API token user ID
            email: data.email || '',
            fullName: data.name || '',
            organization: organization,
            client,
          }

          // Configure the user profile in our DB, and finally respond to the client
          createOrUpdateUser(tokenSet, profile).then((user) =>
            completeCallback(request, response, user)
          )
        })
        .catch((err) => {
          console.error('Error caught at DPClient userinfo: ' + err)
        })
    })
    .catch((err) => {
      console.error('Error caught at DPClient callback: ' + err)
    })
})

// For mobile app only - exchange a 'local' JWT token for Session after a successful Dataporten login
router.get('/token', function (request, response) {
  console.log('Token exchange route called')
  const jwtToken = request.headers.authorization
    ? request.headers.authorization.substring(4)
    : ''
  try {
    const token = jwt.verify(
      jwtToken,
      new Buffer.from(process.env.JWT_SECRET, 'base64')
    )
    if (token) {
      console.log('Token is valid')
      User.findById(token.ref, (err, user) => {
        if (!err && user) {
          request.session.ref = user.id
          request.session.save()
          console.log(
            `${new Date().toLocaleString()} Token valid. Session set. User: ${
              user.username
            } ID: ${request.session.id} Ref: ${request.session.ref}`
          )
          return response.status(200).end()
        } else if (err) {
          console.error(err.message)
          return response.status(400).send(err)
        } else {
          const e = 'User not found'
          console.error(e)
          return response.status(401).send(e)
        }
      })
    }
  } catch (e) {
    console.error('Error validating token: ' + e.message)
    return response.status(401).end()
  }
})

router.get('/logout', (request, response) => {
  request.session.destroy(() => {
    response.clearCookie('id')
    request.session = null
    response.status(200).send()
  })
})

module.exports = router
