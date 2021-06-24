/*
 * Designed and developed by Richard Nesnass & Sharanya Manivasagam
 * Here we are managing transfer of a video file to Google Drive
 * Transfer must be initiated by the user
 */
const { google } = require('googleapis');
const router = require('express').Router();

const googleOperations = require('../../services/google');
const videoStatusTypes = require('../../constants').videoStatusTypes;
const utilities = require('../../utilities');
const Dataset = require('../../models/Dataset');
const Video = require('../../models/Video');
const User = require('../../models/User');

/* --------------    UiO Google Suite ----------------- */

// API Documentation: https://github.com/googleapis/google-api-nodejs-client#google-apis-nodejs-client

function getOauthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URL
  );
}

const scopes = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
];

// Authenticate for use of Google Drive with this user's account
router.get('/google_transfer', utilities.authoriseUser, (request, response, next) => {
  const user = response.locals.user
  const csrf_token = require('crypto')
    .randomBytes(20)
    .toString('hex');

  // This token will be checked at Google callback prevent falsification of the request
  user.tokens.csrf_token = csrf_token;
  user.save(error => {
    if (error) {
      return next(error)
    } else {
      // Create the request to Google
      const device = request.query.device;
      const mobileApp = typeof device === 'string' && device == 'mobileApp';
      const authData = {
        scope: scopes,
        // Define values that should be passed through to the callback as a query string
        state: JSON.stringify({
          videoReference: request.query.videoReference,
          settingId: request.query.settingId,
          mode: request.query.mode,
          userId: request.session.ref,
          csrf_token,
          device,
        }),
      };
      authData.hd = 'uio.no'; // Influence Google to use this domain for login
      const oauth2Client = getOauthClient()
      oauth2Client.credentials = {
        access_token: user.tokens.access_token,
        token_type: 'Bearer',
      };
      if (mobileApp) {
        response.cookie('id_token', user.tokens.id_token);
        response.cookie('access_token', user.tokens.access_token);
      }
      const authorizeUrl = oauth2Client.generateAuthUrl(authData);
      if (mobileApp) {
        return response.redirect(authorizeUrl);
      } else {
        return response
          .send({ data: encodeURI(authorizeUrl) })
          .status(200)
          .end();
      }
    }
  })
});
// Authentication callback
router.get('/authenticated_google_transfer', (request, response) => {
  const code = request.query.code || ''; // Google's code to exchange for a token
  const hd = request.query.hd || ''; // The domain of our Google Cloud Portal
  const state = JSON.parse(request.query.state); // State variables passed from the initial call
  const fileId = state.videoReference || '';
  const settingId = state.settingId || '';
  const mode = state.mode || '';
  const csrf_token = state.csrf_token || '';
  const userId = state.userId;

  const status = videoStatusTypes.edited;
  const mobileApp =
    typeof state.device === 'string' && state.device == 'mobileApp';

  const completedTransfer = errorString => {
    const error = errorString || '';
    if (mobileApp) {
      const bundleId = process.env.APP_BUNDLE_ID;
      return response.redirect(
        `${bundleId}://oauth_callback?mode=transfer&videoReference=${fileId}&settingId=${settingId}&error=${error}`
      );
    } else {
      return response.redirect(
        `${utilities.baseUrl}/#/transferred?videoReference=${fileId}&settingId=${settingId}&error=${error}`
      );
    }
  };

  User.findById(userId, (error1, user) => {
    if (error1) {
      console.error('Error retrieving user in Google callback', error1);
      return response.status(403).end();
    }
    if (!user) {
      console.log(`User not found id: ${userId}`);
      return response.status(403).end();
    }
    // Check csrf token. This is required to prevent forgery attacks
    if (csrf_token != user.tokens.csrf_token) {
      console.log('csrf error');
      return response.status(403).end();
    }
    // Also check that token came from a user managed by our own Google Cloud Platform system
    if (hd != 'uio.no') {
      console.log('hd error');
      return completedTransfer('accountdomain');
    }
    // In this case we can allow the client to validate their GSuite connection
    if (mode == 'validate') {
      return completedTransfer('accountvalid');
    }
    // Now exchange the code for a token
    const oauth2Client = getOauthClient()
    oauth2Client.credentials = {
      access_token: user.tokens.access_token,
      token_type: 'Bearer',
    };
    oauth2Client.getToken(code, (error2, tokens) => {
      if (error2) return console.error(`${new Date().toUTCString()} Error retrieving access token ${error2} foro userid: ${user.id} username: ${user.username} videoFileId: ${fileId}`);
      oauth2Client.setCredentials(tokens);
      // Check that the supplied settingID is indeed configured to transfer to this location
      Dataset.findById(settingId, (error3, setting) => {
        if (error3) {
          return console.error(error3);
        } else if (setting) {
          // const store = setting.storages.find(s => s.name == videoStorageTypes.google)
          // Now retrieve the video that matches this request
          // Only retrieve a video matching the reference, user and complete status
          Video.findOne(
            { userId, settingId, fileId, status },
            (error4, video) => {
              if (error4) {
                return console.error(error4);
              } else if (video && !video.status.inPipeline) {
                video.status.inPipeline = true;
                video.save();
                console.log(
                  `${new Date().toUTCString()} Attained a token and initiated video transfer for userid: ${
                    user.id
                  } username: ${user.username} Video filename: ${
                    video.filename
                  }`
                );
                googleOperations
                  .createVideoAtGoogle(video, setting, oauth2Client)
                  .then(() => {
                    if (!user.stats.totalTransfers) user.stats.totalTransfers = 0
                    user.stats.totalTransfers += 1
                    user.save()
                    completedTransfer()
                  })
                  .catch(error5 => {
                    console.log(error5);
                    video.status.inPipeline = false;
                    video.status = 'error';
                    video.errorDebug = error5.toString();
                    video.save();
                    completedTransfer(error5.message);
                  });
              } else {
                if (video && video.status.inPipeline) {
                  const message =
                    'Attempted to transfer a video already in transfer';
                  console.log(message);
                  completedTransfer(message);
                } else {
                  const message = 'No video found to process';
                  console.log(message);
                  completedTransfer(message);
                }
              }
            }
          );
        }
      });
    });
  });
});

module.exports = router;
