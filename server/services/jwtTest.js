require('dotenv').config({ silent: process.env.NODE_ENV !== 'development' })
const fs = require('fs')
const jwt = require('jsonwebtoken')
const jwksClient = require('jwks-rsa');

const kid = 'dMLbITGh-UR6hgUbL0zW6-Vv9V86um6Pzd4vyjyD4BI'

const privateKey = fs.readFileSync(process.env.JWK_PRIVATE_KEY_FILE);
const CANVAS_TOKEN_VALIDITY_PERIOD = 1000 * 60; // 1 minute
const issuedAtDate = Math.floor(Date.now().valueOf() / 1000);
const expiryDate = new Date(Date.now() + CANVAS_TOKEN_VALIDITY_PERIOD);
const expiryInSeconds = Math.floor(expiryDate.valueOf() / 1000);

const jwtContent = {
  sub: process.env.CANVAS_LTI_CLIENT_ID,
  iss: "https://canvas.instructure.com",
  jti: "1234567890987654321", // Do we really need this?
  exp: expiryInSeconds,
  iat: issuedAtDate,
  aud: "https://uio.instructure.com/login/oauth2/token",
};
const signedToken = jwt.sign(jwtContent, privateKey, { algorithm: "RS256", header: { kid } });

// -------------  Construct the payload for Canvas -------------

let body = {
  grant_type: 'client_credentials',
  client_assertion_type:
    'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
  client_assertion: signedToken,
  scope: 'https://purl.imsglobal.org/spec/lti-nrps/scope/contextmembership.readonly',
}
const curlRequestString = `curl -X POST -H "Content-Type: application/json" -d '${JSON.stringify(body)}' https://uio.instructure.com/login/oauth2/token`
console.log(curlRequestString)

// -------------  Verify the token -------------

// From the JWK URL
var theJwksClient = jwksClient({
  jwksUri: 'https://engagelab.uio.no/classroom-simulator/canvas/.well-known/jwks.json' // 'https://viva.uio.no/jwks.json'
});

async function verifyRemoteKey() {
  const remoteKeyObject = await theJwksClient.getSigningKey(kid);
  const signingKey = remoteKeyObject.getPublicKey();
  jwt.verify(signedToken, signingKey, { algorithms: ['RS256'] }, function(err, decoded) {
    console.log('Token validated with remote jwks.json')
    console.log(decoded) // bar
  });
}
verifyRemoteKey()

// From the public key file
var cert = fs.readFileSync('server/public/canvas/.well-known/cert.pem'); // get public key
jwt.verify(signedToken, cert, { algorithms: ['RS256'] }, function (err) {
  console.log(err ? `Error: ${err}` : 'Token validated with local cert.pem')
});


// canvasClient.grant(body).then((tokenSet) => console.log(tokenSet));
