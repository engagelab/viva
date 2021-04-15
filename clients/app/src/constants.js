/*
 Copyright 2018 Richard Nesnass and Sharanya Manivasagam
*/
const useCordova = process.env.VUE_APP_USE_CORDOVA == 'true'
let appVersion = document.documentElement.getAttribute('data-appversion')

const theHost = process.env.VUE_APP_SERVER_HOST
const thePort = process.env.VUE_APP_SERVER_PORT
let baseUrl = `${theHost}`
if (process.env.NODE_ENV === 'development') {
  baseUrl = `${theHost}:${thePort}`
}

// The web-based app will always be the latest version, set the version directly from .env
// If not built with Cordova, 'data-appversion' will === '%%VERSION%%'
if (appVersion === '%%VERSION%%') appVersion = process.env.VUE_APP_VERSION

export const strings = {
  vivaServer: 'viva.uio.no',
  engagelabServer: 'engagelab.uio.no',
  idleTimeout: 3600, // seconds
  recordingDataInterval: 5, // seconds
  recordingMaxDuration: 2700, // seconds (2700 = 45 mins)
  recordingMaxDurationWeb: 600, // seconds (600 = 10 mins)
  videoExpiryTime: 1209600000, // milliseconds (1209600000 = 2 weeks)
  cryptoAlgorithm: 'AES-GCM',
  videoProgressCheckInterval: 20, // seconds
  dbVersion: 1,
  device: useCordova ? 'mobile' : 'web',
  videoStorageTypes: ['none', 'google', 'onedrive', 'lagringshotell'],
  utvalger: ['Feltsted', 'Klasse', 'Fag', 'Lærer'],
  samtykke: {
    samtykke: 'samtykke',
    manuel: 'manuel',
    article6: 'article6'
  },
  appVersion
}

export const stores = {
  metadataStore: {
    name: 'metadataStore',
    keyPath: ['settingId', 'fileId'],
    type: 'text', // 'text' is not needed, as we save this data as ArrayBuffer
    // We use a custom stringify process to stringify video metadata.
    // See VideoMetadata.js:getAsBuffer()
    indexes: {
      setting: {
        name: 'setting',
        keys: ['settingId']
      },
      settingAndFile: {
        name: 'settingAndFile',
        keys: ['settingId', 'fileId']
      }
    }
  },
  videoStore: {
    name: 'videoStore',
    keyPath: 'fileId',
    type: 'binary',
    indexes: {
      fileId: {
        name: 'fileId',
        keys: ['fileId']
      }
    }
  }
}

const datasettAttributes = [' Datasett navn', 'Når', 'Elementer', 'Hvem']
const opptakAttributes = ['Opptak', 'Når', 'Hvem', 'Datasett']

export default {
  strings,
  baseUrl,
  stores,
  datasettAttributes,
  opptakAttributes
}
