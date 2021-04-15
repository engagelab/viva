/*
 Copyright 2018 Richard Nesnass
*/

const theHost = process.env.VUE_APP_SERVER_HOST
const thePort = process.env.VUE_APP_SERVER_PORT
let baseUrl = `${theHost}`
if (process.env.NODE_ENV === 'development') {
  baseUrl = `${theHost}:${thePort}`
}

const cmsUrl: string = process.env.VUE_APP_CMS_HOST || ''
const assetRoot: string = process.env.VUE_APP_CMS_HOST + '/api/assets' || ''
const cmsTokenUrl = process.env.VUE_APP_SQUIDEX_TOKEN_URL || ''
const cmsClientId = process.env.VUE_APP_SQUIDEX_CLIENT_ID || ''
const cmsClientSecret = process.env.VUE_APP_SQUIDEX_CLIENT_SECRET || ''
const userRolesString = process.env.VUE_APP_USER_ROLES || ''
const userRoles = userRolesString.split(',')
const consentStatesString = process.env.VUE_APP_CONSENT_STATES || ''
const consentStates = consentStatesString.split(',')
const projectNamesString = process.env.VUE_APP_PROJECT_NAMES || ''
const projectNames = projectNamesString.split(',') || ''
const projectTypesString = process.env.VUE_APP_PROJECT_TYPES || ''
const projectTypes = projectTypesString.split(',') || ''
const masteryBaselineID = 'mastery-baseline'
let appVersion: string =
  document.documentElement.getAttribute('data-appversion') || ''

// The web-based app will always be the latest version, set the version directly from .env
// If not built with Cordova, 'data-appversion' will === '%%VERSION%%'
if (appVersion === '%%VERSION%%') appVersion = process.env.VUE_APP_VERSION || ''

projectTypes.push('none')
projectNames.push('none')

const deviceType: string =
  window.location.protocol == 'file:' ? 'mobile' : 'web'

const cordovaConstants = {
  videoRecordingMaxDuration: 300000, // 5 minutes
  audioRecordingMaxDuration: 300000, // 5 minutes
}

const taskColours = ['#A861A6', '#F84016', '#009F4B', '#A9BD50', '#FFDE01']

// User roles determine what is displayed on screen UI
// FIXME: Edit this enum to match the content of the env file
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

// Actual names of projects created in Squidex
// FIXME: Edit this enum to match the content of the env file
enum PROJECT_NAME {
  dslplus = 'dslplus',
  testand = 'testand',
  slpilot = 'slpilot',
  v4v = 'v4v',
  none = 'none',
}
// Ensure enums match those defined in env file
const pn = Object.keys(PROJECT_NAME)
if (
  !projectNames.every((e: string) => pn.indexOf(e as PROJECT_NAME) > -1) ||
  projectNames.length !== pn.length
) {
  console.error('PROJECT_NAME enum mismatch', { enums: pn, env: projectNames })
}

// Determines the templates used to display this project
// FIXME: Edit this enum to match the content of the env file
enum PROJECT_TYPE {
  slplus = 'slplus',
  kapteinmorf = 'kapteinmorf',
  v4v = 'v4v',
  none = 'none',
}
// Ensure enums match those defined in env file
const p = Object.keys(PROJECT_TYPE)
if (
  !projectTypes.every((e: string) => p.indexOf(e as PROJECT_TYPE) > -1) ||
  projectTypes.length !== p.length
) {
  console.error('PROJECT_TYPE enum mismatch', { enums: p, env: projectTypes })
}

export {
  deviceType,
  baseUrl,
  cmsUrl,
  assetRoot,
  userRoles,
  USER_ROLE,
  PROJECT_NAME,
  PROJECT_TYPE,
  consentStates,
  cmsTokenUrl,
  cmsClientId,
  cmsClientSecret,
  cordovaConstants,
  appVersion,
  masteryBaselineID,
  taskColours,
}
