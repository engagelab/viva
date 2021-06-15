const fs = require('fs')
const router = require('express').Router()
const { generators } = require('openid-client')
const jwt = require('jsonwebtoken')
const jwksClient = require('jwks-rsa')
const utilities = require('../../utilities')
const { createOrUpdateUser, completeCallback } = require('./helpers')

const openidClient = require('../../services/openid')

// Activate the Dataporten Clients
let CanvasLTIClient, CanvasLTIIssuer, CanvasAPIClient
openidClient
  .createClient('canvasLTI')
  .then((struct) => { CanvasLTIClient = struct.client; CanvasLTIIssuer = struct.issuer})
openidClient
  .createClient('canvasAPI')
  .then((struct) => (CanvasAPIClient = struct.client))

// --------------- For Canvas Login  -----------------

// STEP 1
// Authentication called from Canvas for LTI
// Uses OpenID to retrieve an id_token, and an "LTI Advantage Services" access_token
// NOTE: This does *NOT* give Canvas API access
// Use this procedure to initiate the LTI
// http://www.imsglobal.org/spec/security/v1p0/#step-1-third-party-initiated-login
router.post('/canvas/login', function (request, response) {
  const { device, remember } = request.query
  request.session.nonce = generators.nonce()
  request.session.state = generators.state()
  request.session.device = device
  request.session.client = 'lti'
  request.session.remember = remember

  let redirectUrl = CanvasLTIClient.authorizationUrl({
    lti_message_hint: request.body.lti_message_hint,
    login_hint: request.body.login_hint,
    scope: 'openid',
    state: request.session.state,
    response_mode: 'form_post',
    prompt: 'none',
    nonce: request.session.nonce,
  })
  response.redirect(redirectUrl)
})

// STEP 2
// POST Callback from Canvas contains the id_token for an OpenID LTI authentication
router.post('/canvas/callback', function (request, response) {
  const idToken = request.body.id_token
  const decodedToken = jwt.decode(idToken, { complete: true })

  if (request.session.state != response.req.body.state) {
    console.error('/canvas/callback: Session state does not match')
    return response.status(401).end()
  }
  if (decodedToken.payload.iss !== CanvasLTIIssuer.metadata.issuer) {
    console.error('/canvas/callback: Issuer does not match')
    return response.status(401).end()
  }

  // STEP 4: Using the LTI access_token, get user details using "Names & roles" LTI service
  // Save the details to the User's profile including id_token
  const requestUserInformation = (LTItokenSet, verified_decoded_id_token) => {
    const user_id = verified_decoded_id_token.sub
    const parsedUrl = new URL(verified_decoded_id_token['https://purl.imsglobal.org/spec/lti-nrps/claim/namesroleservice'].context_memberships_url)
    const options = {
      hostname: parsedUrl.host,
      path: parsedUrl.pathname,
      method: 'GET',
      headers: {
          Authorization: `Bearer ${LTItokenSet.access_token}`
      }
    }
    utilities.httpRequest(options)
      .then(namesAndRoles => {
        if (namesAndRoles) {
          const myUser = namesAndRoles.members.find((n) => n.user_id === user_id)
          createOrUpdateUser(
            { id_token: idToken },
            { sub: verified_decoded_id_token.sub },
            myUser || {}
          ).then((user) => {
            return completeCallback(request, response, user)
          })
        }
      })
      .catch(e => {
        console.error(e)
      });
  }

  // STEP 3: Authenticate using 'client_credentials' for a 'non-specific-user' LTI access_token
  // Applies to certain LTI Advantage services
  // Calls the 'names and roles' LTI service to obtain user info
  // https://canvas.instructure.com/doc/api/file.oauth.html#accessing-lti-advantage-services
  const requestLTIServicesAccessToken = (verified_decoded_id_token) => {
    const kid = process.env.JWK_CURRENT_KID
    const privateKey = fs.readFileSync(process.env.JWK_PRIVATE_KEY_FILE)
    const CANVAS_TOKEN_VALIDITY_PERIOD = 1000 * 60 // 1 minute
    const issuedAtDate = Math.floor(Date.now().valueOf() / 1000)
    const expiryDate = new Date(Date.now() + CANVAS_TOKEN_VALIDITY_PERIOD)
    const expiryInSeconds = Math.floor(expiryDate.valueOf() / 1000)

    const jwtContent = {
      sub: process.env.CANVAS_LTI_CLIENT_ID,
      iss: 'https://canvas.instructure.com',
      jti: '1234567890987654321', // Do we really need this?
      exp: expiryInSeconds,
      iat: issuedAtDate,
      aud: 'https://uio.instructure.com/login/oauth2/token',
    }
    const signedTokenPayload = jwt.sign(jwtContent, privateKey, {
      algorithm: 'RS256',
      header: { kid },
    })

    const CCbody = {
      grant_type: 'client_credentials',
      client_assertion_type:
        'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
      client_assertion: signedTokenPayload,
      scope: 'https://purl.imsglobal.org/spec/lti-nrps/scope/contextmembership.readonly',
    }

    // Request a Token Grant, then request the User's information
    CanvasLTIClient.grant(CCbody).then((LTItokenSet) => {
      requestUserInformation(LTItokenSet, verified_decoded_id_token)
    }).catch((error) => console.log(`Error granting access_token: ${error}`))
  }

  // Verify the token using a JWK specified by 'kid' in the decoded token's header
  const verifyTokenByRemoteJWK = async () => {
    // Retrieve Canvas public JWKs
    const theJwksClient = jwksClient({
      jwksUri: CanvasLTIIssuer.metadata.jwks_uri,
    })
    const remoteKeyObject = await theJwksClient.getSigningKey(
      decodedToken.header.kid
    )
    const signingKey = remoteKeyObject.getPublicKey()

    // Vertify the ID_Token against Canvas' public JWK
    return new Promise((resolve, reject) => {
      jwt.verify(
        idToken,
        signingKey,
        { algorithms: ['RS256'] },
        (error, verified_decoded_id_token) => {
          if (error) {
            console.error('Invalid ID Token received')
            return reject(error)
          }
          resolve(verified_decoded_id_token)
        }
      )
    })
  }

  verifyTokenByRemoteJWK().then((verified_decoded_id_token) => {
    requestLTIServicesAccessToken(verified_decoded_id_token)
  }).catch((error) => {
    console.log(`Token not valid with remote jwks.json: ${error}`)
    response.status(401).end()
  })
})

// OPTIONAL
// Authenticate a specific user by "authentication_flow" and retrieve a JWT API access_token
// Use this procedure in addition to /login/initiate for specific user access to the Canvas API
router.post('/canvas/login/user', function (request, response) {
  const { device, remember, client } = request.query
  const body = response.req.body
  request.session.device = device
  request.session.client = client
  request.session.remember = remember
  request.session.state = generators.state()

  request.session.userProfile = {
    user_id: body.user_id,
    email: body.custom_canvas_user_login_id,
    username: body.custom_canvas_user_login_id.substring(
      0,
      body.custom_canvas_user_login_id.lastIndexOf('@')
    )
  }

  let redirectUrl = CanvasAPIClient.authorizationUrl({
    state: request.session.state,
    // scope: '/auth/userinfo',
  })

  console.log(redirectUrl, 'redirectUrl')
  console.log(response.req.body, 'first response')
  response.redirect(redirectUrl)
})

// OPTIONAL
// Callback for "authentication_flow" specific-user authorisation
// GET Callback contains 'code' to exchange for a specific user's access_token
router.get('/canvas/callback', function (request, response) {
  const { userProfile } = request.session
  const { code } = request.query
  const params = CanvasAPIClient.callbackParams(request)

  console.log(response.req.query, 'second reponse')

  if (!code) {
    console.error(
      `Error returned at /canvas/login/user/callback: ${params.error}`
    )
    return response.status(401).end()
  } else {
    const body = {
      grant_type: 'authorization_code',
      code,
    }
    CanvasAPIClient.grant(body).then((tokenSet) => {
      console.log(tokenSet)
      // const tokenInfo = tokenSet.claims()
      // if (tokenInfo.iss !== CanvasAPIClient.metadata.issuer) {
      //   const e = 'Invalid Canvas token at login'
      //   const error = new Error(e)
      //   console.error(`Invalid token at login. Tokeninfo: `)
      //   console.dir(tokenInfo)
      //   return response.status(403).send(error)
      // }
      //const { device, remember } = request.session

      request.session.access_token = tokenSet.access_token
      let profile = tokenSet.user
      profile.user_id = userProfile.user_id
      profile.username = userProfile.username
      profile.email = userProfile.email
      console.log(profile, 'userProfile')
      createOrUpdateUser(
        tokenSet,
        { username: profile.username },
        profile
      ).then((user) => {
        console.log(user)
        completeCallback(request, response, user)
        /* request.session.ref = user.id
        let s = `${new Date().toLocaleString()}: Web App Login: ${
          user.username
        }`
        // Engagelab server Vue App uses the 'hash' based history system, as it must proxy to a subdirectory
        let redirectUrl =
          process.env.NODE_ENV === 'testing'
            ? `${utilities.baseUrl}/#/login`
            : `${utilities.baseUrl}/login`
        console.log(s)
        return response.redirect(redirectUrl) */
      })
      // Now use the access_token to retrieve user profile information
      // DPClient.userinfo(tokenSet.access_token) // => Promise
      //   .then((profile) => {
      //     console.log(
      //       `\nGot Canvas user; logging in ${profile.name} : ${profile.email} ...`
      //     )
      //     // Save the access_token to the User profile
      //     // Also update any extra user information
      //     // We assume the user has already been logged in at /canvas/login
      //     // There therefore should already be a session set for the user
      //     console.log(profile)
      //     // createOrUpdateUser(tokenSet, { sub: decoded.sub }, request.body.user || {}).then(() => response.status(200).end())
      //   })
      //   .catch((err) => {
      //     console.error('Error caught at DPClient userinfo: ' + err)
      //   })
    })
  }
})

module.exports = router
