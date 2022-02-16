

## Cordova setup

`yarn global add cordova@10.0.0`
`cd client/src-cordova`
`cordova platform add ios@`

Then, back at the project root:
`yarn run prepare:app`  this installs plugins including custom plugin variables
`yarn run build:ios`  this build can be opened with XCode in `/client/src-cordova/platforms/ios`

You may need to install ios-deploy: `brew install ios-deploy`


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

