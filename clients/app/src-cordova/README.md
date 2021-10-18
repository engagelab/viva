## Cordova setup


Install the local OAuth plugin:
`cordova plugin add cordova-plugin-oauth-engagelab --variable URL_SCHEME="viva"`

## Android issues

* API 30 and `cordova-android` 10 uses WebViewAssetLoader which removes `file:///` in preference of `https://` for local assets
* This works for static assets defiend at build time, bu breaks access to local assets from URLs e.g. loading loading video URL into <video> tag
* Currently cordova SystemWebViewClient is missing an InternalStoragePathHandler needed to expose an app's internal storage
   https://github.com/apache/cordova-android/issues/1329
* More discussion here https://github.com/apache/cordova-plugin-file/issues/426
