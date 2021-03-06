/*
 Copyright 2020, 2021 Richard Nesnass, Sharanya Manivasagam, and Ole Smørdal

 This file is part of VIVA.

 VIVA is free software: you can redistribute it and/or modify
 it under the terms of the GNU Affero General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 GPL-3.0-only or GPL-3.0-or-later

 VIVA is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU Affero General Public License for more details.

 You should have received a copy of the GNU Affero General Public License
 along with VIVA.  If not, see <http://www.gnu.org/licenses/>.
 */

const theHost = process.env.VUE_APP_SERVER_HOST
const thePort = process.env.VUE_APP_SERVER_PORT
let baseUrl = `${theHost}`
if (
  process.env.NODE_ENV === 'development' &&
  theHost &&
  // !theHost.includes('engagelab') &&
  !theHost.includes('viva')
) {
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
if (appVersion === '%%VERSION%%' && process.env.VUE_APP_VERSION)
  appVersion = process.env.VUE_APP_VERSION

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
  manual = 'manual',
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
  manual = 'manual',
  article6 = 'article6',
}

enum UTVALG_SELECTION {
  skole = 'skole',
  trinn = 'trinn',
  klasse = 'klasse',
  klassebokstav = 'klassebokstav',
  fag = 'fag',
  feltsted = 'feltsted',
  lærer = 'lærer',
  gruppe = 'gruppe',
  barnehage = 'barnehage',
  bedrift = 'bedrift',
}

const STORAGE_KEYS = {
  name: ['fileName', 'timeStamp'],
  path: ['datasettName', 'fileName', 'owner', 'userID', 'timeStamp'],
  groups: ['uv-ils-viva-diva1', 'uv-ils-viva-proto1'],
}

interface Behandling {
  name: string
  description: string
}

const behandlings: Record<CONSENT_TYPES, Behandling> = {
  [CONSENT_TYPES.samtykke]: {
    name: 'Digitalt samtykke',
    description:
      'Opptak er basert på samtykker som er gitt digitalt i UiOs samtykkeportal.',
  },
  [CONSENT_TYPES.manual]: {
    name: 'Manuelt samtykke',
    description: 'Opptak er basert på samtykker som er håndtert manuelt.',
  },
  [CONSENT_TYPES.article6]: {
    name: 'Ikke samtykke',
    description:
      'Opptak er basert på GDPR §6 (behandling som er nødvendig for å utføre en oppgave i allmennhetens interesse).',
  },
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
  CONSENT_SELECTION,
  UTVALG_SELECTION,
  behandlings,
  STORAGE_KEYS,
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
  stores,
  datasettAttributes,
  opptakAttributes,
}
