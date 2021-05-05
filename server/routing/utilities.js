/*
 Designed and developed by Richard Nesnass & Sharanya Manivasagam
*/

const https = require('https');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

let TEST_MODE = false;
const host = process.env.VUE_APP_SERVER_HOST
const port = process.env.VUE_APP_SERVER_PORT
const hotHost = process.env.VUE_APP_HOTRELOAD_SERVER_HOST;
const hotPortAPP = process.env.VUE_APP_HOTRELOAD_SERVER_PORT_APP;
const hotPortLTI = process.env.VUE_APP_HOTRELOAD_SERVER_PORT_LTI;

const tempUserStore = {};
//TODO: Base url needs to be updated based on affliatiaon 
let baseUrl = `${host}`
if (process.env.NODE_ENV === 'development') {
  switch(process.env.VUE_APP_DEV_SERVER) {
    case 'lti':
      baseUrl = `https://${hotHost}:${hotPortLTI}`
      break
    case 'app':
      baseUrl = `https://${hotHost}:${hotPortAPP}`
      break
    default:
      baseUrl = `${host}:${port}`
      break
  }
}

const errorResponse = (error, response, status) => {
  console.log(`Error: ${error.message}`);
  let statusNumber = status || error.status || 400;
  response.status(statusNumber).send({
    message: error.message,
  });
};

const successResponse = (object, response) => {
  response.status(200).send(object);
};

const shuffleArray = array => {
  const a = array.slice();
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const setTestMode = mode => {
  TEST_MODE = mode;
};

const getTestMode = () => TEST_MODE;

const authoriseUser = (req, res, next) => {
  const device = req.query.device
  const mobileApp = typeof device === 'string' && device == 'mobileApp'
  const googleMobileAppTransfer = mobileApp && req.route.path == '/google_transfer'
  if (req.method == 'OPTIONS') {
    next();
  } else if (req.session && req.session.id && req.session.ref) {
    next();
  } else if (req.headers.authorization || googleMobileAppTransfer) {
    // This is needed to compensate for an Android issue where session cookie is not being set in the webview.
    // So we attempt to use the token for verification instead..
    const jwtToken = req.headers.authorization
      ? req.headers.authorization.substring(4)
      : req.query.jwt;
    try {
      const token = jwt.verify(
        jwtToken,
        new Buffer.from(process.env.JWT_SECRET, 'base64')
      );
      if (token) {
        // Avoid a DB lookup if possible
        if (tempUserStore[token.ref]) {
          req.session.ref = tempUserStore[token.ref];
          req.session.save();
          console.log(`${new Date().toUTCString()} Authorisation by token (temp store) for userid: ${req.session.ref} ${googleMobileAppTransfer ? 'for Google Transfer' : ''}`);
          return next();
        } else {
          User.findOne({ reference: token.ref }, (err2, user) => {
            if (!err2 && user) {
              req.session.ref = user.id;
              tempUserStore[token.ref] = user.id;
              req.session.save();
              console.log(`${new Date().toUTCString()} Authorisation by token for userid: ${user.id} username: ${user.username} ${googleMobileAppTransfer ? 'for Google Transfer' : ''}`);
              return next();
            } else {
              return errorResponse(err2, res, err.status);
            }
          });
        }
      }
    } catch (err3) {
      return errorResponse(err3, res, err.status);
    }
  } else {
    var err = new Error('Invalid login');
    err.status = 401;
    return errorResponse(err, res, err.status);
  }
};

// Get DP group IDs
const dataportenGroupListForUser = user => {
  const options = {
    host: 'groups-api.dataporten.no',
    port: 443,
    path: '/groups/me/groups',
    method: 'GET',
    headers: {
      Authorization: `Bearer ${user.tokens.access_token}`,
    },
  };
  return httpRequest(options, "");
};

/**  https Request to TSD/ outside portal from  VIVA server */
function httpRequest(params, postData) {
  return new Promise(function(resolve, reject) {
    const req = https.request(params, function(res) {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        reject(
          new Error(
            `Rejected HTTP Response. statusCode: ${
              res.statusCode
            } calling: ${params.hostname + params.path} `
          )
        );
      }
      let body = [];
      res.on('data', function(chunk) {
        body.push(chunk);
      });
      res.on('end', function() {
        try {
          body = JSON.parse(Buffer.concat(body).toString());
        } catch (error) {
          return reject(error);
        }
        resolve(body);
      });
    });
    req.on('error', function(error) {
      console.log(`HTTP Request error: ${error}`);
      reject(error);
    });
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

module.exports = {
  successResponse,
  errorResponse,
  authoriseUser,
  shuffleArray,
  setTestMode,
  getTestMode,
  baseUrl,
  dataportenGroupListForUser,
  httpRequest,
};
