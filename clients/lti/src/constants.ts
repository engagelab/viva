/*
 Copyright 2018 Richard Nesnass
*/

const theHost = process.env.VUE_APP_SERVER_HOST
const thePort = process.env.VUE_APP_SERVER_PORT
let baseUrl = `${theHost}`
if (process.env.NODE_ENV === 'development') {
  baseUrl = `${theHost}:${thePort}`
}

const assetRoot: string = process.env.VUE_APP_CMS_HOST + '/api/assets' || ''
const userRolesString = process.env.VUE_APP_USER_ROLES || ''
const userRoles = userRolesString.split(',')
const consentTypesString = process.env.VUE_APP_CONSENT_STATES || ''
const consentTypes = consentTypesString.split(',')
let appVersion: string =
  document.documentElement.getAttribute('data-appversion') || ''

// The web-based app will always be the latest version, set the version directly from .env
// If not built with Cordova, 'data-appversion' will === '%%VERSION%%'
if (appVersion === '%%VERSION%%') appVersion = process.env.VUE_APP_VERSION || ''

// projectTypes.push('none')
// projectNames.push('none')

const deviceType: string =
  window.location.protocol == 'file:' ? 'mobile' : 'web'

const cordovaConstants = {
  videoRecordingMaxDuration: 300000, // 5 minutes
  audioRecordingMaxDuration: 300000, // 5 minutes
}

// User roles determine what is displayed on screen UI
// Edit this enum to match the content of the env file
enum USER_ROLE {
  user = 'user',
  monitor = 'monitor',
  admin = 'admin',
}

export enum PROJECT_NAME {
  viva = 'viva',
}

// Ensure enums match those defined in env file
const t = Object.values(USER_ROLE)
if (
  !userRoles.every((e: string) => t.indexOf(e as USER_ROLE) > -1) ||
  userRoles.length !== t.length
) {
  console.error('USER_ROLE enum mismatch', { t, userRoles })
}

enum CONSENT_TYPES {
  samtykke = 'samtykke',
  manuel = 'manuel',
  article6 = 'article6',
}
// Ensure enums match those defined in env file
const ct = Object.values(CONSENT_TYPES)
if (
  !consentTypes.every((e: string) => ct.indexOf(e as CONSENT_TYPES) > -1) ||
  consentTypes.length !== ct.length
) {
  console.error('CONSENT_TYPES enum mismatch', { ct, consentTypes })
}

enum VIDEO_STORAGE_TYPES {
  none = 'none',
  google = 'google',
  onedrive = 'onedrive',
  educloud = 'educloud',
  lagringshotell = 'lagringshotell',
}
enum VIDEO_STATUS_TYPES {
  draft = 'draft', // Before upload has been attempted
  premeta = 'premeta', // Pre-stage when awaiting linking of file upload to complete uploaded metadata in DB
  uploaded = 'uploaded', // First pipeline state after file was uploaded
  decrypted = 'decrypted', // (Currently unused)
  converted = 'converted', // Video was converted by FFMPEG, ready to be sent to storage(s)
  edited = 'edited', // Video was saved to Lagringshotell. Video is ready to be transferred to another location.
  complete = 'complete', // Video has now been uploaded, decrypted, trimmed/watermarked, saved and transferred to another location. This is the LAST pipeline stage
  error = 'error', // Something went wrong. Videos in this state will not move further in the pipeline until attended to
}

enum CONSENT_SELECTION {
  samtykke = 'samtykke',
  manuel = 'manuel',
  article6 = 'article6',
}

enum VIDEO_SHARING_MODE {
  feed = 'feed',
  myVideos = 'myVideos',
  sharedToMe = 'sharedToMe',
}

enum VIDEO_SHARING_STATUS {
  annotated = 'annotated',
  users = 'users',
  edl = 'edl',
  comment = 'comment',
}

enum VIDEO_DETAIL_MODE {
  play = 'play',
  share = 'share',
  trim = 'trim',
  users = 'users',
}

export {
  deviceType,
  baseUrl,
  assetRoot,
  userRoles,
  USER_ROLE,
  CONSENT_TYPES,
  VIDEO_STORAGE_TYPES,
  CONSENT_SELECTION,
  VIDEO_STATUS_TYPES,
  VIDEO_SHARING_MODE,
  VIDEO_SHARING_STATUS,
  VIDEO_DETAIL_MODE,
  consentTypes,
  cordovaConstants,
  appVersion,
}
