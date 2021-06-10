/*
 *  This interface adapts video.js storage requests (indended for IndexedDB items) to Cordova files
 *  Error reporting depends on 'emitError' utility function
 */

import cordovaRoutines from './cordovaRoutines'
import { cordovaConstants } from '../constants'
// CordovaRoutines produces Error in reject calls
// CordovaService should call emitError with these Error objects, and then resolve(<void>) to continue operation
// Callers should assume
import { emitError, wait, uuid } from '../utilities'
import { CordovaData } from '@/store/useDevice'

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    WkWebView: any
  }
}

let media: Media | undefined
let mediaSuccessCallback: (() => void) | null // Holder for a callback desired when the current Media operation is completed
const mediaIsRecording = false // True if recording is active

// Dictionary to hold media cache references
let mediaCache: Record<string, string> = {}

// From storage get the deepest directory in given 'path' (array), starting with the first element
// This will create directory if not found
// resolves:
//    a directory
//    the root directory if no path given
//    or <void> + emit error if dir doesn't exist or there was an unexpected result
const getPath = (path: string[]): Promise<DirectoryEntry> => {
  return new Promise((resolve) => {
    const thePath = [...path]
    cordovaRoutines
      .getStorageRoot()
      .then(async (root: DirectoryEntry) => {
        let currentDir = root
        while (thePath && thePath.length > 0) {
          const subDir: string | undefined = thePath.shift()
          if (subDir && currentDir) {
            await cordovaRoutines
              .getDirectory(currentDir, subDir)
              .then((dir: DirectoryEntry) => {
                currentDir = dir
              })
              .catch((error: Error) => emitError(error))
          } else {
            break
          }
        }
        resolve(currentDir)
      })
      .catch((error: Error) => {
        emitError(error)
        resolve()
      })
  })
}

// Fetch a single item
// resolves:
//    file contents as type <T>
//    or return void and emit an error, resolving gracefully if there was an unexpected result
const loadFromStorage = <T>(cordovaData: CordovaData): Promise<T | void> => {
  return new Promise((resolve) => {
    const filename = cordovaData.fileName || ''
    getPath(cordovaData.path).then((storeDirectory) => {
      return cordovaRoutines
        .getFileByName(storeDirectory, filename, false)
        .then((fileEntry) => {
          if (cordovaData.readFile) {
            cordovaRoutines
              .readFile(fileEntry, cordovaData.asText, cordovaData.asJSON)
              .then((filecontents) => resolve(filecontents as T))
              .catch((readFileError) => {
                emitError(readFileError)
                resolve()
              })
          } else {
            console.log('Got FileEntry. Not asked to read file.')
            resolve(fileEntry as unknown as T)
          }
        })
        .catch((getFileByNameError) => {
          emitError(getFileByNameError)
          resolve()
        })
    })
  })
}

// Fetch all file items in a directory
// Returns FileEntry
const getFileListFromStorage = (cordovaData: CordovaData): Promise<Entry[]> => {
  return getPath(cordovaData.path).then((storeDirectory) => {
    const dirReader = storeDirectory.createReader()
    dirReader.readEntries(
      (results) => {
        if (results.length) {
          const files = results.filter((r) => r.isFile)
          resolve(files)
        }
      },
      (error) => reject(error)
    )
  })
}

// Save an item to file system
// Returns a promise
// resolves:
//     <void>
//     or <void> + emit an error if there was an unexpected result
const saveToStorage = (cordovaData: CordovaData): Promise<void> => {
  // getPath() will create directory if not found
  return getPath(cordovaData.path).then((storeDirectory) =>
    cordovaRoutines
      // getFileByName() will create file if not found
      .getFileByName(
        storeDirectory,
        cordovaData.fileName,
        cordovaData.overwrite
      )
      .then((fileEntry) => {
        return cordovaRoutines
          .writeFile(
            fileEntry,
            cordovaData.data,
            cordovaData.asText,
            cordovaData.asJSON,
            cordovaData.append
          )
          .catch((error) => {
            emitError(error)
            return Promise.resolve()
          })
      })
      .catch((error) => {
        emitError(error)
        return Promise.resolve()
      })
  )
}

/**
 * Move a media file recorded in tmp to a specified folder
 * Returns a promise with the FileEntry is becames after moving
 * @param cordovaData  CordovaData class that includes a 'fileToMove' MediaFile type object
 * @param isAudio The new name of the entry. Defaults to the Entry's current name if unspecified.
 * @param successCallback A callback that is called with the Entry for the new location.
 * @param errorCallback   A callback that is called when errors happen.
 */
const moveMediaFromTemp = (
  cordovaData: CordovaData
): Promise<FileEntry | void> => {
  return new Promise((resolve) => {
    let mediaPath = ''
    if (cordovaData.fileToMove) {
      if (
        Object.prototype.hasOwnProperty.call(cordovaData.fileToMove, 'localURL')
      ) {
        mediaPath = (cordovaData.fileToMove as MediaFile).localURL
      } else {
        mediaPath = (cordovaData.fileToMove as FileEntry).toInternalURL()
      }
    } else mediaPath = cordova.file.tempDirectory + cordovaData.fileName
    window.resolveLocalFileSystemURL(
      mediaPath,
      (fileEntry) => {
        getPath(cordovaData.path).then((storeDirEntry) =>
          cordovaRoutines
            .transferFile(fileEntry, storeDirEntry, false, cordovaData.fileName)
            .then((movedFile) => resolve(movedFile))
            .catch((error) => {
              emitError(error)
              resolve()
            })
        )
      },
      (error) => {
        emitError(
          new Error(`moveMediaFromTemp: Error resolving file URL ${error}`)
        )
        resolve()
      }
    )
  })
}

// Make a copy of the file in the application /tmp directory
// Returns a promise
// Resolves:
//     moved File object
//     or <void> + emit an error if there was an unexpected result
const copyFileToTemp = (
  cordovaData: CordovaData
): Promise<FileEntry | void> => {
  return new Promise((resolve) => {
    window.resolveLocalFileSystemURL(
      window.cordova.file.tempDirectory,
      (tempDir) => {
        cordovaRoutines
          .transferFile(
            cordovaData.file as Entry,
            tempDir as DirectoryEntry,
            true,
            ''
          )
          .then((copiedFile: FileEntry) => resolve(copiedFile))
          .catch((error) => {
            emitError(error)
            resolve()
          })
      },
      (error) => {
        emitError(
          new Error(
            `copyFileToTemp: Error resolving file URL (copyFileToTemp) ${error}`
          )
        )
        resolve()
      }
    )
  })
}

// Remove an item from storage
// Returns a promise
// Resolves:
//     <void>
//     or <void> + emit an error if there was an unexpected result
const removeFromStorage = (cordovaData: CordovaData): Promise<void> => {
  return getPath(cordovaData.path).then((storeDirectory) =>
    cordovaRoutines
      .getFileByName(storeDirectory, cordovaData.fileName, false)
      .then((fileEntry) => cordovaRoutines.deleteFile(fileEntry))
      .catch((error) => {
        emitError(error)
        return Promise.resolve()
      })
  )
}

// Remove all files from temp folder
// Returns a promise
// Resolves:
//     <void>
//     or <void> + emit an error if there was an unexpected result
const clearTempFolder = (): Promise<void> => {
  return new Promise((resolve) => {
    window.resolveLocalFileSystemURL(
      window.cordova.file.tempDirectory,
      (dirEntry: Entry) => {
        const dirReader = (dirEntry as DirectoryEntry).createReader()
        dirReader.readEntries(
          async (results: Entry[]) => {
            if (results.length) {
              const filesToRemove = results.filter((r) => r.isFile)
              while (filesToRemove.length > 0) {
                await cordovaRoutines.deleteFile(
                  filesToRemove.pop() as FileEntry
                )
              }
            }
            resolve()
          },
          (error) => {
            emitError(
              new Error(`clearTempFolder: Error reading file entries ${error}`)
            )
            resolve()
          }
        )
      },
      (error) => {
        emitError(
          new Error(
            `copyFileToTemp: Error resolving file URL (clearTempFolder) ${error}`
          )
        )
        resolve()
      }
    )
  })
}

// Estimate available storage remaining
const getStorageEstimate = (
  callbackFn: (estimate: StorageEstimate) => void
): void => {
  navigator.storage.estimate().then((estimate: StorageEstimate) => {
    callbackFn(estimate)
  })
}

// -----------------  Media Services ----------------

const captureVideo = (): Promise<void | MediaFile> => {
  return new Promise((resolve) => {
    const options = {
      duration: cordovaConstants.videoRecordingMaxDuration,
    }
    const captureSuccess = (mediaFiles: MediaFile[]) => {
      if (mediaFiles.length > 0) {
        const video = mediaFiles.pop()
        resolve(video)
      }
    }

    const captureError = (error: CaptureError) => {
      emitError(new Error(`Video capture error: ${error.code}`))
      resolve()
    }

    navigator.device.capture.captureVideo(captureSuccess, captureError, options)
  })
}

// Reference: https://cordova.apache.org/docs/en/10.x/reference/cordova-plugin-media/
const createAudio = (
  cordovaData: CordovaData
): Promise<FileEntry | undefined> => {
  return new Promise((resolve) => {
    if (mediaIsRecording) {
      emitError(new Error('createAudio: called when recording is active'))
      resolve()
    }
    window.resolveLocalFileSystemURL(
      window.cordova.file.tempDirectory,
      function (d) {
        const tmpDirEntry = d as DirectoryEntry
        // Ensure a temp file exists to write audio into
        cordovaRoutines
          .getFileByName(tmpDirEntry, cordovaData.fileName, false)
          .then((fileEntry) => {
            const mediaSuccess = () => {
              const cb = mediaSuccessCallback
              if (cb) {
                mediaSuccessCallback = null
                cb()
              }
            }

            const mediaError = (error: MediaError) => {
              let statusInfo = ''
              switch (error.code) {
                case MediaError.MEDIA_ERR_ABORTED:
                  statusInfo = 'Aborted'
                  break
                case MediaError.MEDIA_ERR_NETWORK:
                  statusInfo = 'Network'
                  break
                case MediaError.MEDIA_ERR_DECODE:
                  statusInfo = 'Decode'
                  break
                case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
                  statusInfo = 'Source not supported'
                  break
                default:
                  break
              }
              emitError(
                new Error(
                  `Audio capture error: ${statusInfo}: ${error.message}`
                )
              )
              resolve()
            }

            const mediaStatus = (statusCode: number) => {
              let statusInfo = ''
              switch (statusCode) {
                case Media.MEDIA_STARTING:
                  statusInfo = 'Starting media'
                  break
                case Media.MEDIA_PAUSED:
                  statusInfo = 'Pausing media'
                  break
                case Media.MEDIA_RUNNING:
                  statusInfo = 'Running media'
                  break
                case Media.MEDIA_STOPPED:
                  statusInfo = 'Stopped media'
                  break
                default:
                  break
              }
              console.log(`Media status change: ${statusInfo}`)
            }
            //  const localURL = storeDirectory.toInternalURL() + cordovaData.fileName
            // new Media() cannot accept FileEntry, but can accept a cdvfile: URI
            const nativePath = fileEntry.toInternalURL() // Create a cdvfile URI
            media = new Media(nativePath, mediaSuccess, mediaError, mediaStatus)
            resolve(fileEntry)
          })
      },
      function (error: FileError) {
        emitError(new Error(`Resolve local URI error: ${error.code}`))
        resolve()
      }
    )
  })
}

const stopRecordingAudio = (): Promise<number> => {
  return new Promise((resolve) => {
    if (media) {
      media.stopRecord()
      media.release()
      media = undefined
    }
    resolve()
  })
}

// A media must be created using createAudio() before attempting to record to it
const startRecordingAudio = (): Promise<void> => {
  return new Promise((resolve) => {
    if (media) {
      media.startRecord()
    } else {
      emitError(new Error('Start recording called without meida file'))
    }
    resolve()
  })
}

// ----------------  Media Cache services ----------------------

const downloadFileToCache = (fileurl: string): Promise<void> => {
  let blob = null
  const cordovaFileSystem = cordova.file.cacheDirectory
  const xhr = new XMLHttpRequest()
  xhr.open('GET', fileurl)
  xhr.responseType = 'blob' // force the HTTP response, response-type header to be blob
  return new Promise<void>((resolve) => {
    xhr.onload = function () {
      const cacheID: string = uuid()
      blob = xhr.response // xhr.response is now a blob object
      const DataBlob = blob
      window.resolveLocalFileSystemURL(cordovaFileSystem, function (d) {
        const dir = d as DirectoryEntry
        dir.getFile(cacheID, { create: true }, function (file) {
          file.createWriter(
            function (fileWriter) {
              fileWriter.onerror = (error) => {
                emitError(
                  new Error(`Error writing cache file: ${error.toString()}`)
                )
                resolve()
              }
              fileWriter.onwriteend = () => {
                mediaCache[fileurl] = cacheID
                resolve()
              }
              fileWriter.write(DataBlob)
            },
            function () {
              emitError(new Error(`Cache file: unable to create writer`))
            }
          )
        })
      })
    }
    xhr.send()
  })
}

const getFileFromCache = (fileurl: string): Promise<ArrayBuffer | string> => {
  return new Promise((resolve) => {
    const cacheID = mediaCache[fileurl]
    const cordovaFileSystem = cordova.file.cacheDirectory
    const localFile = cordovaFileSystem + cacheID
    if (!cacheID) return resolve(fileurl)
    else {
      const convertedFileURI = window.WkWebView.convertFilePath(localFile)
      return resolve(convertedFileURI)
    }
  })
}

const loadMediaCache = (): Promise<void> => {
  const cd: CordovaData = new CordovaData({
    fileName: 'mediacache.json',
    readFile: true,
    asText: true,
    asJSON: true,
  })
  return new Promise((resolve) => {
    loadFromStorage<Record<string, string>>(cd).then((data) => {
      if (data) mediaCache = data
      resolve()
    })
  })
}
const saveMediaCache = (): Promise<void> => {
  const cd: CordovaData = new CordovaData({
    fileName: 'mediacache.json', // Saved to app's root folder
    data: mediaCache,
    asText: true,
    asJSON: true,
  })
  return saveToStorage(cd)
}

// ------------ Permission --------------

// Check permissions in series, asynchronously
const checkPermissionList = async (): Promise<void> => {
  if (!(window.cordova.plugins && window.cordova.plugins.permissions)) return
  // For Andoird, check device permissions
  const permissions = window.cordova.plugins.permissions
  let permissionTried = false
  let permissionToCheck: AndroidPermissions
  const permissionList: AndroidPermissions[] = [
    permissions.CAMERA,
    permissions.RECORD_AUDIO,
    permissions.READ_EXTERNAL_STORAGE,
    permissions.WRITE_EXTERNAL_STORAGE,
    permissions.INTERNET,
  ]
  const permissionError = () => {
    console.warn(`Permission ${permissionToCheck} is not turned on`)
    checkInSeries()
  }
  const permissionSuccess = (result: { hasPermission: boolean }) => {
    if (!result.hasPermission) {
      if (!permissionTried) {
        permissionTried = true
        permissions.requestPermission(
          permissionToCheck,
          permissionSuccess,
          permissionError
        )
      } else permissionError()
    } else checkInSeries()
  }

  const checkInSeries = async () => {
    permissionTried = false
    const p = permissionList.pop()
    if (p) {
      permissionToCheck = p
      await wait(2000)
      permissions.checkPermission(
        permissionToCheck,
        permissionSuccess,
        permissionError
      )
    }
  }
  checkInSeries()
}

// ------------ Logging -----------------

// Returns a promise
// Write to a log file at the top level
const saveLog = (errorText: string): Promise<void> => {
  const dateStamp = new Date().toISOString()
  return getPath([]).then((storeDirectory) =>
    cordovaRoutines
      .getFileByName(storeDirectory, 'logfile.txt', false)
      .then((fileEntry: FileEntry) =>
        cordovaRoutines.writeFile(
          fileEntry,
          `${dateStamp}: ${errorText}`,
          true,
          false,
          true
        )
      )
      .catch(() => console.log('Write to logfile.txt failed!'))
  )
}

const copyToClipboard = (
  text: string,
  success: Callback,
  error: Callback
): void => {
  window.cordova.plugins.clipboard.copy(text, success, error)
}

const getFromClipboard = (success: Callback, error: Callback): void => {
  cordova.plugins.clipboard.paste(success(text), error)
}

export default {
  // File storage
  getPath,
  getFileListFromStorage,
  loadFromStorage,
  //readFile,
  saveToStorage,
  removeFromStorage,
  getStorageEstimate,
  // Media
  captureVideo,
  createAudio,
  startRecordingAudio,
  stopRecordingAudio,
  moveMediaFromTemp,
  // Cache
  downloadFileToCache,
  getFileFromCache,
  saveMediaCache,
  loadMediaCache,
  // Temp
  copyFileToTemp,
  clearTempFolder,

  // Permission
  checkPermissionList,

  // Other
  saveLog,

  // Clipboard
  copyToClipboard,
  getFromClipboard,
}
