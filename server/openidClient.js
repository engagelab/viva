const { Issuer } = require('openid-client')
const SSL = process.env.VUE_APP_USE_SSL == 'true' ? 'https' : 'http'
const HOST = process.env.VUE_APP_SERVER_HOST
const PORT = process.env.VUE_APP_SERVER_PORT

let authCallback = `${SSL}://${HOST}:${PORT}/auth/dataporten/callback`
if (process.env.VUE_APP_SERVER_HOST == 'engagelab.uio.no') {
  authCallback = `${SSL}://${HOST}/viva/auth/dataporten/callback`
} else if (process.env.VUE_APP_SERVER_HOST == 'viva.uio.no') {
  authCallback = `${SSL}://${HOST}/auth/dataporten/callback`
}

async function client() {
  return new Promise(async function (resolve) {
    const dataportenIssuer = await Issuer.discover(
      'https://auth.dataporten.no/.well-known/openid-configuration'
    ).catch(error => {
      console.log(`Dataporten Issuer did not respond. Closing..: ${error}`)
      process.exit()
    })
    const theClient = new dataportenIssuer.Client({
      client_id: process.env.FEIDE_CLIENT_ID,
      client_secret: process.env.FEIDE_CLIENT_SECRET,
      redirect_uris: [authCallback],
      response_types: ['code']
    })
    console.log('Dataporten Client created')
    resolve(theClient)
  })
}

module.exports = { client, authCallback }
