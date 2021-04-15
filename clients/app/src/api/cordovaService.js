/*
 *  This interface adapts video.js storage requests (indended for IndexedDB items) to Cordova files
 */

import CordovaRoutines from './cordovaRoutines'
import { stores } from '../constants'
import cordovaRoutines from './cordovaRoutines'

let dbReadyCallbacks = []

// Ensure the basic storage stucture exists for Cordova to read/write files
const createStorage = async () => {
  if (!('cordova' in window)) {
    throw new Error('Browser does not support Cordova')
  }
  CordovaRoutines.getStorageRoot().then(rootDirectory => {
    const storeNames = Object.keys(stores)
    const allPromises = []

    // Create major directory structure from stores key names
    storeNames.forEach(storeName =>
      allPromises.push(CordovaRoutines.getDirectory(rootDirectory, storeName))
    )
    Promise.all(allPromises).then(() => {
      // Execute any registered callbacks
      // For example after transferring a video and reloading the app via server redirect
      if (dbReadyCallbacks.length > 0) dbReadyCallbacks.forEach(dbc => dbc())
      dbReadyCallbacks = []
    })
  })
}

// Utility function to get a major store
const getStoreDirectory = storeName =>
  CordovaRoutines.getStorageRoot().then(rootDir =>
    CordovaRoutines.getDirectory(rootDir, storeName)
  )

// Fetch a single item
const getOneFromStorage = (deviceStatus, { store, cordovaData }) => {
  const isText = store.type == 'text'
  return getStoreDirectory(store.name).then(storeDirectory =>
    CordovaRoutines.getFileByName(
      storeDirectory,
      cordovaData.fileName,
      false
    ).then(fileEntry => {
      if (cordovaData.readFile) {
        return CordovaRoutines.readFile(fileEntry, isText)
      } else {
        return fileEntry
      }
    })
  )
}

// Fetch all items in a directory
const getAllFromStorage = (deviceStatus, { store, cordovaData }) => {
  return new Promise((resolve, reject) => {
    return getStoreDirectory(store.name).then(storeDirectory => {
      const dirReader = storeDirectory.createReader()
      dirReader.readEntries(
        results => {
          if (results.length) {
            const files = results.filter(r => r.isFile)
            resolve(files)
          }
        },
        error => reject(error)
      )
    })
  })
}

// Save an item file system
const saveToStorage = ({ store, cordovaData }) => {
  const isText = store.type == 'text'
  return getStoreDirectory(store.name).then(storeDirectory =>
    CordovaRoutines.getFileByName(
      storeDirectory,
      cordovaData.fileName,
      true
    ).then(fileEntry =>
      CordovaRoutines.writeFile(fileEntry, cordovaData.data, isText)
    )
  )
}

// Save an item file system
const readFile = ({ store, cordovaData }) => {
  const isText = store.type == 'text'
  return CordovaRoutines.readFile(cordovaData.fileEntry, isText)
}

const moveMediaFile = ({ store, cordovaData }) => {
  return new Promise((resolve, reject) => {
    window.resolveLocalFileSystemURL(
      cordovaData.fileToMove.localURL,
      fileEntry => {
        getStoreDirectory(store.name).then(storeDirEntry =>
          CordovaRoutines.transferFile(
            fileEntry,
            storeDirEntry,
            false,
            cordovaData.fileName
          )
            .then(movedFile => resolve(movedFile))
            .catch(error => {
              console.log(error)
              reject(error)
            })
        )
      },
      error => {
        console.log(error)
        reject(error)
      }
    )
  })
}

// Make a copy of the file in the application /tmp directory
const copyFileToTemp = ({ cordovaData }) => {
  return new Promise((resolve, reject) => {
    window.resolveLocalFileSystemURL(
      window.cordova.file.tempDirectory,
      tempDir => {
        CordovaRoutines.transferFile(cordovaData.fileEntry, tempDir, true)
          .then(movedFile => resolve(movedFile))
          .catch(error => reject(error))
      },
      error => reject(error)
    )
  })
}

// Remove an item
const removeFromStorage = ({ store, cordovaData }) => {
  return getStoreDirectory(store.name).then(storeDirectory =>
    CordovaRoutines.getFileByName(
      storeDirectory,
      cordovaData.fileName,
      false
    ).then(fileEntry => CordovaRoutines.deleteFile(fileEntry))
  )
}

const clearTempFolder = () => {
  return new Promise((resolve, reject) => {
    window.resolveLocalFileSystemURL(
      window.cordova.file.tempDirectory,
      dirEntry => {
        const dirReader = dirEntry.createReader()
        dirReader.readEntries(
          async results => {
            if (results.length) {
              const filesToRemove = results.filter(r => r.isFile)
              while (filesToRemove.length > 0) {
                await CordovaRoutines.deleteFile(filesToRemove.pop())
              }
            }
            resolve()
          },
          error => reject(error)
        )
      },
      error => reject(error)
    )
  })
}

const getStorageEstimate = callbackFn => {
  navigator.storage.estimate().then(estimate => {
    callbackFn(estimate)
  })
}

const registerOnetimeDBReadyCallback = callbackFn => {
  dbReadyCallbacks.push(callbackFn)
}

const dbExists = () => false

const copyToClipboard = (text, success, fail) =>
  cordovaRoutines.copyToClipboard(text, success, fail)

// -----------------  Video Services ----------------

const captureVideo = CordovaRoutines.captureVideo

export default {
  createStorage,
  getAllFromStorage,
  getOneFromStorage,
  readFile,
  saveToStorage,
  removeFromStorage,
  getStorageEstimate,
  registerOnetimeDBReadyCallback,
  dbExists,

  captureVideo,
  moveMediaFile,
  copyFileToTemp,
  clearTempFolder,

  copyToClipboard
}
