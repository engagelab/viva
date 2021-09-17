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
  !theHost.includes('engagelab')
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
const usernameColourMode = 'bright'

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
  manual = 'manual',
  article6 = 'article6',
}

enum SORT_BY {
  date = 'date',
  dataset = 'dataset',
  selection = 'selection',
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
  manual = 'manual',
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
  none = 'none',
  play = 'play',
  share = 'share',
  trim = 'trim',
}

export {
  deviceType,
  baseUrl,
  assetRoot,
  userRoles,
  USER_ROLE,
  SORT_BY,
  CONSENT_TYPES,
  VIDEO_STORAGE_TYPES,
  CONSENT_SELECTION,
  VIDEO_STATUS_TYPES,
  VIDEO_SHARING_MODE,
  VIDEO_SHARING_STATUS,
  VIDEO_DETAIL_MODE,
  usernameColourMode,
  consentTypes,
  cordovaConstants,
  appVersion,
}
