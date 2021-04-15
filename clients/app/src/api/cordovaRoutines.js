'use strict'
import { strings } from '../constants'

const LocalFileSystem = {
  PERSISTENT: 1,
  TEMPORARY: 0
}

const getDevice = () => {
  if (window.cordova !== undefined) {
    return window.device
  } else {
    return undefined
  }
}

if (window.JSON && !window.JSON.dateParser) {
  var reISO = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*))(?:Z|(\+|-)([\d|:]*))?$/;
  var reMsAjax = /^\/Date\((d|-|.*)\)[\/|\\]$/;

  JSON.dateParser = function (key, value) {
      if (typeof value === 'string') {
          var a = reISO.exec(value);
          if (a)
              return new Date(value);
          a = reMsAjax.exec(value);
          if (a) {
              var b = a[1].split(/[-+,.]/);
              return new Date(b[0] ? +b[0] : 0 - +b[1]);
          }
      }
      return value;
  };
}

let writeInProgress = false

// ------------------------- File operations --------------------------

// Refer to:
// https://github.com/apache/cordova-plugin-file

// Note: This function overwrites an existing file
// asText tells to write data in text format, if not then Blob
// If asText == true, supplied dataObject must be stringifiable using JSON.stringify()
const writeFile = (fileEntry, dataObject, asText) => {
  let writeAttempts = 0

  return new Promise((resolve, reject) => {

    function write() {
      writeInProgress = true
      let o = dataObject
      if (asText) {
        o = JSON.stringify(o)
      }
      fileEntry.createWriter(fileWriter => {
        fileWriter.seek(0);
        fileWriter.onwriteend = () => {
          writeInProgress = false
          resolve()
        }
        fileWriter.onerror = error => {
          writeInProgress = false
          reject(error)
        }
        fileWriter.write(o)
      })
    }

    function delayWrite() {
      window.setTimeout(() => {
        writeAttempts++
        if (writeAttempts < 5) {
          if (writeInProgress) {
            delayWrite()
          } else {
            write()
          }
        } else {
          reject('Attempted write 5 times without success')
        }
      }, 500)
    }

    if (writeInProgress) {
      delayWrite()
    } else {
      write()
    }

  })
}

// Read a given file accounting for its type
const readFile = (fileEntry, asText) => {
  return new Promise((resolve, reject) => {
    fileEntry.file(
      file => {
        let reader = new FileReader()
        reader.onloadend = event => {
          let result = event.target.result
          if (asText && result) {
            result = JSON.parse(result, JSON.dateParser)
          }
          resolve(result)
        }
        if (asText) {
          reader.readAsText(file)
        } else {
          reader.readAsArrayBuffer(file)
        }
      },
      error =>
        reject(
          new Error(
            `Error reading file ${fileEntry.name} ${
              asText ? 'as text' : ''
            }: ${error}`
          )
        )
    )
  })
}

// Begin here. Get the app's sandbox storage.
const getStorageRoot = () => {
  return new Promise((resolve, reject) => {
    window.resolveLocalFileSystemURL(
      window.cordova.file.dataDirectory,
      dir => resolve(dir),
      error => reject(new Error(`Error reading storage directory: ${error}`))
    )
  })
}

// Get a directory entry for an existing directory below parentDirEntry, or create one otherwise
const getDirectory = (parentDirEntry, dirName) => {
  const getDir = (dirName, options, successCB, errorCB) =>
    parentDirEntry.getDirectory(dirName, options, successCB, errorCB)

  return new Promise((resolve, reject) => {
    // Attempt to read an existing directory
    getDir(
      dirName,
      {
        create: false,
        exclusive: true
      },
      dirEntry => resolve(dirEntry),
      error => {
        // Attempt to create as likely the folder does not exist
        console.log(
          `Error reading existing directory ${dirName}, attempting to create`
        )
        getDir(
          dirName,
          {
            create: true,
            exclusive: true
          },
          dirEntry => resolve(dirEntry),
          error => {
            // Can't read or create, report the error
            reject(new Error(`Error creating dir ${dirName}`))
          }
        )
      }
    )
  })
}

// Given a directory entry, get the file inside or create if it doesn't exist
// overwrite: boolean
// fileName: string
// dirEntry: DirectoryEntry
const getFileByName = (dirEntry, fileName, overwrite) => {
  return new Promise((resolve, reject) => {
    dirEntry.getFile(
      fileName,
      {
        create: overwrite,
        exclusive: false
      },
      fileEntry => resolve(fileEntry),
      () => {
        if (!overwrite) {
          // File does not exist, create it
          dirEntry.getFile(
            fileName,
            {
              create: true,
              exclusive: false
            },
            fileEntry => resolve(fileEntry),
            () => reject(new Error(`Error creating file ${fileName}`))
          )
        } else {
          reject(new Error(`Error creating file ${fileName}`))
        }
      }
    )
  })
}

// Given a file and folder entry, move or copy the file to the folder
const transferFile = (fileEntry, toFolderEntry, makeACopy, newFilename) => {
  return new Promise((resolve, reject) => {
    const fileName = newFilename || fileEntry.name
    const command = makeACopy ? 'copyTo' : 'moveTo'
    fileEntry[command](
      toFolderEntry,
      fileName,
      copiedFile => resolve(copiedFile),
      error => reject(error)
    )
  })
}

// Given a directory entry, remove the named file inside it
const deleteFile = fileEntry => {
  return new Promise((resolve, reject) => fileEntry.remove(resolve, reject))
}

const getFreeSpace = () => {
  return new Promise((resolve, reject) => {
    window.cordova.exec(
      result => resolve(result),
      error => reject(new Error(`Error determining free disk space: ${error}`)),
      'File',
      'getFreeDiskSpace',
      []
    )
  })
}

// ------------------------- Audio / Video operations --------------------------

const captureVideo = () => {
  return new Promise((resolve, reject) => {
    let options = {
      duration: strings.recordingMaxDuration
    }
    const captureSuccess = mediaFiles => {
      if (mediaFiles.length > 0) {
        const video = mediaFiles.pop()
        resolve(video)
      }
    }

    const captureError = error => {
      reject(new Error(`Video capture error: ${error}`))
    }

    navigator.device.capture.captureVideo(
      captureSuccess,
      captureError,
      options
    )
  })
}

const mediaFileToFile = mediaFile =>
  new File(
    mediaFile.name,
    mediaFile.localURL,
    mediaFile.type,
    mediaFile.lastModifiedDate,
    mediaFile.size
  )

const isMicrophoneAuthorized = () => {
  return new Promise((resolve, reject) => {
    window.cordova.plugins.diagnostic.getMicrophoneAuthorizationStatus(
      status => {
        const pStatus = window.cordova.plugins.diagnostic.permissionStatus
        if (status === pStatus.GRANTED) {
          return resolve(true)
        } else if (status === pStatus.NOT_REQUESTED) {
          window.cordova.plugins.diagnostic.requestMicrophoneAuthorization(
            status => {
              if (status === pStatus.GRANTED) {
                return resolve(true)
              }
              resolve(false)
            },
            error => reject(error)
          )
        } else {
          resolve(false)
        }
      },
      error => reject(error)
    )
  })
}

const isCameraAuthorized = () => {
  return new Promise((resolve, reject) => {
    window.cordova.plugins.diagnostic.getCameraAuthorizationStatus(
      status => {
        const pStatus = window.cordova.plugins.diagnostic.permissionStatus
        if (status === pStatus.GRANTED) {
          return resolve(true)
        } else if (status === pStatus.NOT_REQUESTED) {
          window.cordova.plugins.diagnostic.requestCameraAuthorization(
            status => {
              if (status === pStatus.GRANTED) {
                return resolve(true)
              }
              resolve(false)
            },
            error => reject(error)
          )
        } else {
          resolve(false)
        }
      },
      error => reject(new Error('Activate camera error occurred: ' + error))
    )
  })
}

const copyToClipboard = (text, success, error) => {
  window.cordova.plugins.clipboard.copy(text, success, error)
}

const getFromClipboard = (success, error) => {
  cordova.plugins.clipboard.paste(success(text), error)
}

export default {
  getDevice,
  writeFile,
  readFile,
  getFileByName,
  transferFile,
  deleteFile,
  getDirectory,
  getStorageRoot,
  getFreeSpace,

  captureVideo,
  isMicrophoneAuthorized,
  isCameraAuthorized,

  copyToClipboard,
  getFromClipboard
}
