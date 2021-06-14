const router = require('express').Router()
const { generators } = require('openid-client')
const jwt = require('jsonwebtoken')
const utilities = require('../../utilities')
const User = require('../../models/User')
const { createOrUpdateUser, completeCallback } = require('./helpers')
const openidClient = require('../../services/openid')

// Activate the Dataporten Clients
let DPClient
openidClient.createClient('dataporten').then((struct) => (DPClient = struct.client))

// --------------- For Dataporten Login -----------------

router.get('/dataporten/login', (req, res) => {
  const { device, remember, testing } = req.query
  req.session.device = device
  req.session.remember = remember
  req.session.testing = testing || ''

  const code_verifier = generators.codeVerifier()
  // store the code_verifier in the framework's session mechanism, if it is a cookie based solution
  // it should be httpOnly (not readable by javascript) and encrypted.
  req.session.code_verifier = code_verifier
  const code_challenge = generators.codeChallenge(code_verifier)

  let redirectUrl = DPClient.authorizationUrl({
    scope: 'openid groups profile email',
    // resource: 'https://my.api.example.com/resource/32178',
    code_challenge,
    code_challenge_method: 'S256',
  })
  if (process.env.NODE_ENV !== 'production' && testing) {
    redirectUrl = `${utilities.baseUrl}/auth/dataporten/callback`
  }
  res.redirect(redirectUrl)
})

router.get('/dataporten/callback', function (request, response) {
  const params = DPClient.callbackParams(request)
  const { device, code_verifier, testing, remember } = request.session

  // FOR AUTOMATED TESTS ONLY
  if (process.env.NODE_ENV !== 'production' && testing) {
    const tokenSet = {
      access_token: '',
      id_token: '',
    }
    const tokenInfo = {
      sub: testing === 'testuser' || testing === 'testuser2' ? testing : 'testuser',
    }
    const profile = {
      name: testing === 'testuser1' ? 'Test User - pedleder' : 'Test User - foresatt',
      email: `${testing}@engagelab.uio.no`,
    }
    return createOrUpdateUser(
      tokenSet,
      { sub: tokenInfo.sub },
      profile
    ).then((user) =>
      completeCallback(request, response, user, device, remember)
    )
  }

  // Verify the received code with Dataporten, which should return the tokenSet
  DPClient.callback(DPClient.metadata.redirect_uris[0], params, { code_verifier }) // => Promise
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
      DPClient.userinfo(tokenSet.access_token) // => Promise
        .then((profile) => {
          console.log(
            `\nGot DP user; logging in ${profile.name} : ${profile.email} ...`
          )

          // Configure the user profile in our DB, and finally respond to the client
          createOrUpdateUser(
            tokenSet,
            { sub: tokenInfo.sub },
            profile
          ).then((user) =>
            completeCallback(request, response, user, device, remember)
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
