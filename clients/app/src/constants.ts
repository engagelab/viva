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

const vivaServer = 'viva.uio.no'
const engagelabServer = 'engagelab.uio.no'
const idleTimeout = 3600 // seconds
const recordingDataInterval = 5 // seconds
const recordingMaxDuration = 2700 // seconds (2700 = 45 mins)
const recordingMaxDurationWeb = 600 // seconds (600 = 10 mins)
const videoExpiryTime = 1209600000 // milliseconds (1209600000 = 2 weeks)
const cryptoAlgorithm = 'AES-GCM'
const videoProgressCheckInterval = 20 // seconds
const dbVersion = 1
const device = 'mobile'
const videoStorageTypes = ['none', 'google', 'onedrive', 'lagringshotell']
const utvalger = ['Feltsted', 'Klasse', 'Fag', 'Lærer']

const behandlings = {
  samtykke: {
    name: 'Digital Samtykke',
    description:
      'Opptak er basert på samtykker som er gitt digitalt i UiOs samtykkeportal.',
  },
  manuel: {
    name: 'Manuelt samtykke',
    description: 'Opptak er basert på samtykker som er håndtert manuelt.',
  },
  article6: {
    name: 'Ikke Samtykke',
    description:
      'Opptak er basert på GDPR §6(behandling som er nødvendig for å utføre en oppgave i allmennhetens interesse).',
  },
}

const stores = {
  metadataStore: {
    name: 'metadataStore',
    keyPath: ['settingId', 'fileId'],
    type: 'text', // 'text' is not needed, as we save this data as ArrayBuffer
    // We use a custom stringify process to stringify video metadata.
    // See VideoMetadata.js:getAsBuffer()
    indexes: {
      setting: {
        name: 'setting',
        keys: ['settingId'],
      },
      settingAndFile: {
        name: 'settingAndFile',
        keys: ['settingId', 'fileId'],
      },
    },
  },
  videoStore: {
    name: 'videoStore',
    keyPath: 'fileId',
    type: 'binary',
    indexes: {
      fileId: {
        name: 'fileId',
        keys: ['fileId'],
      },
    },
  },
}

const datasettAttributes = [' Datasett navn', 'Når', 'Elementer', 'Hvem']
const opptakAttributes = ['Opptak', 'Når', 'Hvem', 'Datasett']

// The web-based app will always be the latest version, set the version directly from .env
// If not built with Cordova, 'data-appversion' will === '%%VERSION%%'
if (appVersion === '%%VERSION%%') appVersion = process.env.VUE_APP_VERSION || ''

const deviceType: string =
  window.location.protocol == 'file:' ? 'mobile' : 'web'

const cordovaConstants = {
  videoRecordingMaxDuration: 300000, // 5 minutes
  audioRecordingMaxDuration: 300000, // 5 minutes
}

const taskColours = ['#A861A6', '#F84016', '#009F4B', '#A9BD50', '#FFDE01']

// User roles determine what is displayed on screen UI
// *** Edit this enum to match the content of the env file ***
enum USER_ROLE {
  user = 'user',
  monitor = 'monitor',
  admin = 'admin',
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

export {
  deviceType,
  baseUrl,
  assetRoot,
  userRoles,
  USER_ROLE,
  consentTypes,
  CONSENT_TYPES,
  VIDEO_STORAGE_TYPES,
  VIDEO_STATUS_TYPES,
  appVersion,
  taskColours,
  vivaServer,
  engagelabServer,
  idleTimeout,
  recordingDataInterval,
  recordingMaxDuration,
  recordingMaxDurationWeb,
  videoExpiryTime,
  cryptoAlgorithm,
  cordovaConstants,
  videoProgressCheckInterval,
  dbVersion,
  device,
  videoStorageTypes,
  utvalger,
  behandlings,
  stores,
  datasettAttributes,
  opptakAttributes,
}
