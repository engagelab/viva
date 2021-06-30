##### Setup

The OAuth plugin has been modified to work for VIVA needs
Original source code: https://github.com/AyogoHealth/cordova-plugin-oauth
New source code stored locally in `/clients/app/src-cordova/cordova-plugin-oauth-engagelab/`

Much of the code supporting iOS older than 13 has been removed

Add the OAuth Plugin like this:
`cd ./clients/app/src-cordova`
`cordova plugin add ./cordova-plugin-oauth-engagelab --variable URL_SCHEME=viva`
