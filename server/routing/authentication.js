/*
 Designed and developed by Richard Nesnass & Sharanya Manivasagam
*/

const router = require('express').Router();
const fs = require('fs')
const { generators } = require('openid-client');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa')
const utilities = require('./utilities');
const User = require('../models/User');
const openidClient = require('../services/openid')

// Activate the Dataporten Client
let DPClient, CanvasLTIClient, CanvasLTIIssuer, CanvasAPIClient
openidClient.createClient('dataporten').then((struct) => (DPClient = struct.client))
openidClient
  .createClient('canvasLTI')
  .then((struct) => { CanvasLTIClient = struct.client; CanvasLTIIssuer = struct.issuer})
openidClient
  .createClient('canvasAPI')
  .then((struct) => (CanvasAPIClient = struct.client))

/* ---------------- Authentication ---------------- */

function createReference(data) {
  return crypto
    .createHash('sha1')
    .update(data)
    .digest('base64');
}

function checkAdmin(user) {
  return new Promise(function(resolve, reject) {
    utilities.dataportenGroupListForUser(user).then(
      groups => {
        const isAdmin = groups.some(
          g => g.id == process.env.VUE_ADMIN_GROUP_ID
        );
        resolve(isAdmin);
      }
    ).catch(error => reject(error))
  });
}

function createOrUpdateUser(tokenSet, userIdentifier, profile) {
  return new Promise(function (resolve, reject) {
    const query = {}
    if (userIdentifier.sub) query.oauthId = userIdentifier.sub
    else if (userIdentifier.id) query._id = userIdentifier.id
    const userProfile = profile.data ? profile.data : profile
    User.findOne(query, async (err, usr) => {
      let user

      if (err) {
        console.log(`Error checking user ${err}`);
        reject(err);
      } else if (!err && usr !== null) {
        user = usr;
      } else {
        user = new User();
      }

      if (!user.username) {
        if (userProfile.email) {
          user.username = userProfile.email.substring(
            0,
            userProfile.email.lastIndexOf('@')
          );
        } else {
          if (!user.fullName) {
            user.fullName = userProfile.name;
          }
          user.username = user.fullName.replace(/[^\d\s\wæøå&@]/gi, '');
        }
      }
      if (!user.oauthId) {
        user.oauthId = userIdentifier.sub || userIdentifier.id
      }
      if (!user.reference) {
        user.reference = createReference(user.oauthId);
      }
      if (!user.fullName) {
        user.fullName = userProfile.name;
      } else if (user && !userProfile.name) {
        const randomName = Math.floor(Math.random() * 100000);
        user.fullName = `User${randomName}`;
      }
      if (
        !user.lastLogin ||
        (user.lastLogin &&
          new Date().getTime() - new Date(user.lastLogin).getTime() >
            1000 * 60 * 60)
      ) {
        user.lastLogin = new Date();
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



      user.provider = 'Dataporten';
      user.isAdmin = await checkAdmin(user);

      user
        .save()
        .then((savedUser) => {
          resolve(savedUser)
        })
        .catch((error) => {
          return reject(error)
        })
    });
  });
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
    s = `${new Date().toLocaleString()}: Mobile App Login: ${user.username}`
  } else {
    // Web app receives a Session immediately, does not need to pass a token
    request.session.ref = user.id
    s = `${new Date().toLocaleString()}: Web App Login: ${user.username}`
    // Engagelab server Vue App uses the 'hash' based history system, as it must proxy to a subdirectory
    redirectUrl =
      process.env.NODE_ENV === 'testing'
        ? `${utilities.baseUrl}/#/login`
        : `${utilities.baseUrl}/login`
  }
  console.log(s)
  return response.redirect(redirectUrl)
}

router.get('/dataporten/login', (req, res) => {
  const { device, intent, testing } = req.query;
  req.session.device = device;
  req.session.intent = intent;
  req.session.testing = testing;

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
  const params = DPClient.callbackParams(request);
  const { device, intent, code_verifier, testing, remember } = request.session;
  const mobileApp = typeof device === 'string' && device == 'mobileApp';
  const intendsAdmin = typeof intent === 'string' && intent == 'admin';

  // FOR AUTOMATED TESTS ONLY
  if (process.env.NODE_ENV !== 'production' && testing) {
    const tokenSet = {
      access_token: '',
      id_token: '',
    }
    const tokenInfo = {
      sub: 'testuser',
    }
    const profile = {
      name: 'Test User',
      email: 'testuser@engagelab.uio.no',
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
    .then(tokenSet => {
      const tokenInfo = tokenSet.claims();
      if (
        tokenInfo.iss != 'https://auth.dataporten.no' ||
        tokenInfo.aud != process.env.FEIDE_CLIENT_ID
      ) {
        const e = 'Invalid token at login';
        const error = new Error(e);
        console.log(`Invalid token at login. Tokeninfo: `);
        console.dir(tokenInfo);
        return response.status(403).send(error);
      }

      // Now use the access_token to retrieve user profile information
      DPClient.userinfo(tokenSet.access_token) // => Promise
        .then(profile => {
          // Configure the user profile in our DB, and finally respond to the client
          createOrUpdateUser(tokenSet, { sub: tokenInfo.sub }, profile).then(user => {
            console.log(
              `${new Date().toUTCString()} Dataporten user found & logged in ${profile.name} device: ${device} intent: ${intent}`
            );
            // Mobile app receives a VIVA token immediately via Apple's ASWebAuthenticationSession
            // which must then be passed back to obtain a Session
            if (mobileApp) {
              const bundleId = process.env.APP_BUNDLE_ID;
              return response.redirect(
                `${bundleId}://oauth_callback?mode=login&code=${user.tokens.viva_token}`
              );
            }

            // Web app receives a Session immediately, does not need to pass a token
            else if (intendsAdmin) {
              request.session.ref = user.id;
              request.session.save();
              let url = utilities.baseUrl;
              url = url.replace('8090', '8091'); // For development, change the port to correct admin pages hot reload port
              url = url.replace('8080', '8091');
              return response.redirect(`${url}/admin/#/admin`);
            } else {
              console.log('Login from Web browser');
              request.session.ref = user.id;
              request.session.save();
              return response.redirect(
                `${utilities.baseUrl}/#/settings`
              );
            }
          });
        });
    })
    .catch(err => {
      console.log('Error caught at DPClient callback:' + err);
    });
});

// For mobile app only - exchange a JWT token for Session after a successful Dataporten login
router.get('/token', function(request, response) {
  const jwtToken = request.headers.authorization
    ? request.headers.authorization.substring(4)
    : '';
  try {
    const token = jwt.verify(
      jwtToken,
      new Buffer.from(process.env.JWT_SECRET, 'base64')
    );
    if (token) {
      User.findById(token.ref, (err, user) => {
        if (!err && user) {
          request.session.ref = user.id;
          request.session.save();
          console.log(
            `${new Date().toLocaleString()} Session set given valid token. User: ${
              user.username
            } userId: ${request.session.ref}`
          );
          return response.status(200).end();
        } else if (err) {
          console.error(err.message)
          return response.status(400).send(err)
        } else {
          const e = 'User not found'
          console.error(e)
          return response.status(401).send(e)
        }
      });
    } else {
      const e = 'No token found';
      console.log(e)
      return response.status(400).send(e);
    }
  } catch (e) {
    console.log('Error validating token: ' + e.message);
    return response.status(400).send(e);
  }
});

router.get('/logout', (request, response) => {
  request.session.destroy(() => {
    response.clearCookie('id');
    request.session = null;
    response.status(200).send();
  });
});


// --------------- For Canvas Login  -----------------

// STEP 1
// Authentication called from Canvas
// Uses OpenID to retrieve an id_token, and an "LTI Advantage Services" access_token
// NOTE: This does *NOT* give Canvas API access
// Use this procedure to initiate the LTI
// http://www.imsglobal.org/spec/security/v1p0/#step-1-third-party-initiated-login
router.post('/canvas/login', function (request, response) {
  const { device, remember } = request.query
  request.session.nonce = generators.nonce()
  request.session.state = generators.state()
  request.session.device = device
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
router.post('/canvas/callback', function(request, response) {
  const { device, remember } = request.session
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
    const parsedUrl =
      require('url')
        .parse(verified_decoded_id_token['https://purl.imsglobal.org/spec/lti-nrps/claim/namesroleservice']
          .context_memberships_url)
    const options = {
      hostname: parsedUrl.host,
      path: parsedUrl.path,
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
          ).then((user) => completeCallback(request, response, user, device, remember))
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
      aud: 'canvasdev.engagelab.uiocloud.no:3000',
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
  const { device, remember } = request.query
  const body = response.req.body
  request.session.device = device
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
  const { device, remember, userProfile } = request.session
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
        completeCallback(request, response, user, device, remember)
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


module.exports = router;
