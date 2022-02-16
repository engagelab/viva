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
const { Issuer } = require('openid-client')
const host = process.env.VUE_APP_SERVER_HOST
const port = process.env.VUE_APP_SERVER_PORT
let dataportenIssuer

// Async call for Dataporten information
function discoverServices() {
  return Issuer.discover(
    'https://auth.dataporten.no/.well-known/openid-configuration'
  ).catch((error) => {
    console.error(`Dataporten Issuer did not respond. Closing..: ${error}`)
    process.exit()
  }).then((issuer) => dataportenIssuer = issuer)
}

function createClient(mode) {
  if (mode == 'dataporten') {
    let authCallback = `${host}:${port}/auth/dataporten/callback`
    if (process.env.NODE_ENV !== 'development' || host.includes('engagelab')) {
      authCallback = `${host}/auth/dataporten/callback`
    }
    console.log(`Server host: ${host} Auth callback: ${authCallback} Issuer exists: ${!!dataportenIssuer}`)
    if (dataportenIssuer) {
      const theClient = new dataportenIssuer.Client({
        client_id: process.env.FEIDE_CLIENT_ID,
        client_secret: process.env.FEIDE_CLIENT_SECRET,
        redirect_uris: [authCallback],
        response_types: ['code'],
      })
      return { client: theClient, issuer: dataportenIssuer }
    } else {
      return { client: {}, issuer: {} }
    }
  } else if (mode == 'canvasLTI') {
    const canvasIssuer = new Issuer({
      issuer: `https://${process.env.CANVAS_ISSUER_DOMAIN}`,
      authorization_endpoint: `https://${process.env.CANVAS_ENDPOINT_DOMAIN}/api/lti/authorize_redirect`,
      token_endpoint: `https://${process.env.CANVAS_ENDPOINT_DOMAIN}/login/oauth2/token`,
      jwks_uri: `https://${process.env.CANVAS_ENDPOINT_DOMAIN}/api/lti/security/jwks`,
    })
    let authCallback = `${host}:${port}/auth/canvas/callback`
    if (process.env.NODE_ENV !== 'development' || host.includes('engagelab')) {
      authCallback = `${host}/auth/canvas/callback`
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
      issuer: `https://${process.env.CANVAS_ISSUER_DOMAIN}`,
      authorization_endpoint: `https://${process.env.CANVAS_ENDPOINT_DOMAIN}/login/oauth2/auth`,
      token_endpoint: `https://${process.env.CANVAS_ENDPOINT_DOMAIN}/login/oauth2/token`,
      userinfo_endpoint: `https://${process.env.CANVAS_ENDPOINT_DOMAIN}/api/v1/users/`
    })
    let authCallback = `${host}:${port}/auth/canvas/callback`
    if (process.env.NODE_ENV !== 'development' || host.includes('engagelab')) {
      authCallback = `${host}/auth/canvas/callback`
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

module.exports = { createClient, discoverServices }
