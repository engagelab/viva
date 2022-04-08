

## Cordova setup

`yarn global add cordova@10.0.0`
`cd client/src-cordova`
`cordova platform add ios@`

Then, back at the project root:
`yarn run prepare:app`  this installs plugins including custom plugin variables
`yarn run build:ios`  this build can be opened with XCode in `/client/src-cordova/platforms/ios`

You may need to install ios-deploy: `brew install ios-deploy`

The build will fail the first time. Open it anyway with XCode (clients/app/src-cordova/platforms/ios) and assign the UiO signing certificate (automatically manage signing)
The private key for UiO should be installed in keychain.

Ensure that the APP_BUNDLE_ID matches Cordova's schema name, and is entered in XCode Project > Info > URL Types in both 'identifier' and 'URL Schemes'
Callback to the app from OAuth will not work otherwise

Running the server will create a sample Datasett called 'test'. This includes a groupID called 'appleAppReview'.
This will allow Apple to see a dataset when logging in using FEIDE's 'eva_student' test user during App Review.

##### OAuth manual Setup

(This is only needed if you make changes to a plugin)

The OAuth plugin has been modified to work for VIVA needs
Original source code: https://github.com/AyogoHealth/cordova-plugin-oauth
New source code stored locally in `/clients/app/src-cordova/cordova-plugin-oauth-engagelab/`

Much of the code supporting iOS older than 13 has been removed

If changes are made to the plugin, add the OAuth Plugin like this:
`cd ./clients/app/src-cordova`
`cordova plugin remove cordova-plugin-oauth-engagelab`
`cordova plugin add ./cordova-plugin-oauth-engagelab --variable URL_SCHEME=viva`

