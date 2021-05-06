const { Issuer } = require('openid-client')

async function createClient(mode) {
  if (mode == 'dataporten') {
    const dataportenIssuer = await Issuer.discover(
      'https://auth.dataporten.no/.well-known/openid-configuration'
    ).catch((error) => {
      console.log(`Dataporten Issuer did not respond. Closing..: ${error}`)
      process.exit()
    })
    let authCallback = `${process.env.VUE_APP_SERVER_HOST}:${process.env.VUE_APP_SERVER_PORT}/auth/dataporten/callback`
    if (process.env.NODE_ENV !== 'development') {
      authCallback = `${process.env.VUE_APP_SERVER_HOST}/auth/dataporten/callback`
    }
    const theClient = new dataportenIssuer.Client({
      client_id: process.env.FEIDE_CLIENT_ID,
      client_secret: process.env.FEIDE_CLIENT_SECRET,
      redirect_uris: [authCallback],
      response_types: ['code'],
    })
    return { client: theClient, issuer: dataportenIssuer }
  } else if (mode == 'canvasLTI') {
    const canvasIssuer = new Issuer({
      issuer: 'https://canvas.instructure.com',
      authorization_endpoint: 'https://uio.instructure.com/api/lti/authorize_redirect',
      token_endpoint: 'https://uio.instructure.com/login/oauth2/token',
      jwks_uri: 'https://uio.instructure.com/api/lti/security/jwks',
    })
    let authCallback = `${process.env.VUE_APP_SERVER_HOST}:${process.env.VUE_APP_SERVER_PORT}/viva/auth/canvas/callback`
    if (process.env.NODE_ENV !== 'development') {
      authCallback = `${process.env.VUE_APP_SERVER_HOST}/viva/auth/canvas/callback`
    }
    const theClient = new canvasIssuer.Client({
      client_id: process.env.CANVAS_LTI_CLIENT_ID,
      client_secret: process.env.CANVAS_LTI_CLIENT_SECRET,
      redirect_uris: [authCallback],
      response_types: ['id_token'],
    })
    return { client: theClient, issuer: canvasIssuer }
  } else if (mode == 'canvasAPI') {
    const canvasIssuer = new Issuer({
      issuer: 'https://canvas.instructure.com',
      authorization_endpoint: 'https://uio.instructure.com/login/oauth2/auth',
      token_endpoint: 'https://uio.instructure.com/login/oauth2/token',
      userinfo_endpoint: 'https://uio.instructure.com/api/v1/users/'
    })
    let authCallback = `${process.env.VUE_APP_SERVER_HOST}:${process.env.VUE_APP_SERVER_PORT}/viva/auth/canvas/callback`
    if (process.env.NODE_ENV !== 'development') {
      authCallback = `${process.env.VUE_APP_SERVER_HOST}/viva/auth/canvas/callback`
    }
    const theClient = new canvasIssuer.Client({
      client_id: process.env.CANVAS_API_CLIENT_ID,
      client_secret: process.env.CANVAS_API_CLIENT_SECRET,
      redirect_uris: [authCallback],
      response_types: ['code'],
    })
    return { client: theClient, issuer: canvasIssuer }
  }
}

module.exports = { createClient }
