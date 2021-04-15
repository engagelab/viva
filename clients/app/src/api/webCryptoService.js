import constants from '../constants'
import utilities from './utilities'

let subtle = null
let webkitSubtle = true

const setupAPI = () => {
  if ('webkitSubtle' in window.crypto) {
    subtle = window.crypto.webkitSubtle
  }
  if ('subtle' in window.crypto) {
    subtle = self.crypto.subtle
    webkitSubtle = false
  }
  return true
}

const { strings } = constants
const generateKey = () =>
  subtle
    .generateKey(
    {
      name: strings.cryptoAlgorithm,
      length: 128
    },
      true,
      ['encrypt', 'decrypt']
    )
    .catch(error => Promise.reject(error))

const getRandomValues = () => window.crypto.getRandomValues(new Uint8Array(12))

// Returns a promise
const encrypt = (key, iv, data) =>
  subtle
    .encrypt(
    {
      name: strings.cryptoAlgorithm,
      iv
    },
      key,
      data
    )
    .catch(error => Promise.reject(error))

// Returns a promise
const decrypt = (key, iv, data) =>
  subtle
    .decrypt(
    {
      name: strings.cryptoAlgorithm,
      iv
    },
      key,
      data
    )
    .catch(error => Promise.reject(error))

const keyFromString = keyString => {
  const s = subtle
  let key
  if (webkitSubtle) {
    key = utilities.str2ui8arr(keyString)
  } else {
    key = utilities.str2ab(keyString) // Converts String to ArrayBuffer
  }
  return s
    .importKey('raw', key, strings.cryptoAlgorithm, true, [
      'encrypt',
      'decrypt'
    ])
    .catch(error => Promise.reject(error))
}

const keyToString = key =>
  subtle
    .exportKey('raw', key) // Produces an ArrayBuffer
    .then(exportedKey => {
      let str
      if (webkitSubtle) {
        str = utilities.ui8arr2str(exportedKey)
      } else {
        str = utilities.ab2str(exportedKey) // Converts String to ArrayBuffer
      }
      return str
    })
    .catch(error => Promise.reject(error)) // Converts ArrayBuffer to String

export default {
  setupAPI,
  generateKey,
  getRandomValues,
  encrypt,
  decrypt,
  keyToString,
  keyFromString
}
