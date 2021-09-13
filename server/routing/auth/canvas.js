const fs = require('fs')
const router = require('express').Router()
const { generators } = require('openid-client')
const jwt = require('jsonwebtoken')
const jwksClient = require('jwks-rsa')
const { createOrUpdateUser, completeCallback } = require('./helpers')

const { httpRequest } = require('../../utilities')
const openidClient = require('../../services/openid')
const { userDetails } = require('../../services/canvas')

// Activate the Dataporten Clients
const canvasLTIStructures = openidClient.createClient('canvasLTI')
const CanvasLTIClient = canvasLTIStructures.client
const CanvasLTIIssuer = canvasLTIStructures.issuer
const CanvasAPIClient = openidClient.createClient('canvasAPI').client

// --------------- For Canvas Login  -----------------

// STEP 1
// Authentication called from Canvas for LTI
// Uses OpenID to retrieve an id_token, and an "LTI Advantage Services" access_token
// NOTE: This does *NOT* give Canvas API access
// Use this procedure to initiate the LTI
// http://www.imsglobal.org/spec/security/v1p0/#step-1-third-party-initiated-login
router.post('/canvas/login', function (request, response) {
  const { organization } = request.query
  request.session.nonce = generators.nonce()
  request.session.state = generators.state()
  request.session.organization = organization || 'uio'
  request.session.client = 'lti'

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
  const { state, organization, client } = request.session
  request.session.canvasData = {}
  const idToken = request.body.id_token
  const decodedToken = jwt.decode(idToken, { complete: true })

  if (state != request.body.state) {
    console.error('/canvas/callback: Session state does not match')
    return response.status(401).end()
  }
  if (decodedToken.payload.iss !== CanvasLTIIssuer.metadata.issuer) {
    console.error('/canvas/callback: Issuer does not match')
    return response.status(401).end()
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
      iss: `https://${process.env.CANVAS_ISSUER_DOMAIN}`,
      jti: '1234567890987654321', // Do we really need this?
      exp: expiryInSeconds,
      iat: issuedAtDate,
      aud: `https://${process.env.CANVAS_ENDPOINT_DOMAIN}/login/oauth2/token`,
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
      scope:
        'https://purl.imsglobal.org/spec/lti-nrps/scope/contextmembership.readonly',
    }

    // Request a Token Grant, then request the User's information
    CanvasLTIClient.grant(CCbody)
      .then((LTItokenSet) => {
        requestUserInformation(LTItokenSet, verified_decoded_id_token)
      })
      .catch((error) => console.log(`Error granting access_token: ${error}`))
  }

  // STEP 4: Using the LTI access_token, get user details using "Names & roles" LTI service
  // Save the details to the User's profile including id_token
  // LTI must be configured with the "variable substitute" in 'Custom Fields' with:  `user_id=$Canvas.user.id`
  const requestUserInformation = (LTItokenSet, verified_decoded_id_token) => {
    // Configure data from 'variable substitutes'
    const custom_vars =
      verified_decoded_id_token[
        'https://purl.imsglobal.org/spec/lti/claim/custom'
      ]
    const profile = {
      provider: 'canvas',
      provider_id: custom_vars.user_id,
      login_id: custom_vars.login_id, // <-- THIS is intended to match Dataporten user ID and Canvas API token user ID
      email: custom_vars.user_email || '',
      fullName: custom_vars.person_name || '',
      organization: organization || '',
      ltiID: verified_decoded_id_token['sub'],
      client,
    }

    // Note the course we are launching from
    if (custom_vars.course_id)
      request.session.canvasData.courseId = custom_vars.course_id

    // Configure data from Names and Roles service
    const parsedUrl = new URL(
      verified_decoded_id_token[
        'https://purl.imsglobal.org/spec/lti-nrps/claim/namesroleservice'
      ].context_memberships_url
    )
    const options = {
      hostname: parsedUrl.host,
      path: parsedUrl.pathname,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${LTItokenSet.access_token}`,
      },
    }
    httpRequest(options).then((namesAndRoles) => {
      if (namesAndRoles) {
        request.session.canvasData.namesAndRoles = namesAndRoles.members.map(
          (m) => {
            return {
              name: m.name || 'unknown',
              ltiID: m.user_id || 'unknown',
              email: m.email || 'unknown',
              roles: m.roles,
            }
          }
        )
      }
      const user = namesAndRoles.members.find(
        (u) => u.name === profile.fullName
      )
      profile.ltiID = user.user_id
      createOrUpdateUser({ id_token: idToken }, profile).then((u) => {
        return completeCallback(request, response, u)
      })
    })
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

  verifyTokenByRemoteJWK()
    .then((verified_decoded_id_token) => {
      requestLTIServicesAccessToken(verified_decoded_id_token)
    })
    .catch((error) => {
      console.log(`Token not valid with remote jwks.json: ${error}`)
      response.status(401).end()
    })
})

// OPTIONAL
// Authenticate a specific user by "authentication_flow" and retrieve a JWT API access_token
// Use this procedure in addition to /login/initiate for specific user access to the Canvas API
router.get('/canvas/login/user', function (request, response) {
  const { organization, remember, client } = request.query
  request.session.organization = organization
  request.session.client = client
  request.session.remember = remember
  request.session.state = generators.state()

  let redirectUrl = CanvasAPIClient.authorizationUrl({
    state: request.session.state,
    // prompt: 'none'
  })
  response.redirect(redirectUrl)
})

// OPTIONAL
// Callback for "authentication_flow" specific-user authorisation
// GET Callback contains 'code' to exchange for a specific user's access_token
router.get('/canvas/callback', function (request, response, next) {
  const { code } = request.query
  const { organization, client } = request.session
  const params = CanvasAPIClient.callbackParams(request)

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
      userDetails(tokenSet.access_token, tokenSet.user.id)
        .then((data) => {
          const profile = {
            provider: 'canvas',
            provider_id: data.id,
            login_id: data.login_id, // <-- THIS is intended to match Dataporten user ID and Canvas API token user ID
            email: data.primary_email || '',
            fullName: data.name || '',
            organization: organization,
            client,
          }
          createOrUpdateUser(tokenSet, profile).then((user) =>
            completeCallback(request, response, user)
          )
        })
        .catch((error) => next(error))
    })
  }
})

module.exports = router
