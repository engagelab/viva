'use strict'

let writeInProgress = false

// ------------------------- File operations --------------------------

// Refer to:
// https://github.com/apache/cordova-plugin-file

// Note: This function overwrites existing contents unless 'isAppend' is true
// asText tells to write data in text-'Blob' format, otherwise a regular Blob
// If asJSON == true, supplied data must be stringifiable using JSON.stringify()
const writeFile = (
  fileEntry: FileEntry,
  data: unknown | Blob | string | undefined,
  asText: boolean, // data should be type 'string'
  asJSON: boolean, // data should be an object (unknown in typescript)
  isAppend: boolean // Write at the end of file, rather than overwrite
): Promise<void> => {
  let writeAttempts = 0

  return new Promise((resolve, reject) => {
    function write() {
      writeInProgress = true
      let o: Blob | string
      if (asJSON && typeof data === 'object') {
        o = JSON.stringify(data)
      } else if (asText && typeof data === 'string') {
        const os: string = data + '\n'
        o = new Blob([os], { type: 'text/plain' })
      } else if (typeof data !== 'undefined') {
        o = data as Blob
      }

      fileEntry.createWriter((fileWriter) => {
        fileWriter.onwriteend = () => {
          writeInProgress = false
          resolve()
        }
        fileWriter.onerror = (error) => {
          writeInProgress = false
          reject(new Error(`Error writing file: ${error.toString()}`))
        }

        if (isAppend) {
          fileWriter.seek(fileWriter.length)
        } else {
          fileWriter.seek(0)
        }
        fileWriter.write(o)
      })
    }

    function delayWrite() {
      window.setTimeout(() => {
        writeAttempts++
        if (writeAttempts < 2) {
          if (writeInProgress) {
            delayWrite()
          } else {
            write()
          }
        } else {
          reject('Attempted write 2 times without success')
        }
      }, 1000)
    }

    if (!data) return reject(new Error('No data supplied to writeFile'))
    else {
      if (writeInProgress) {
        delayWrite()
      } else {
        write()
      }
    }
  })
}

// Read a given file accounting for its type
const readFile = (
  fileEntry: FileEntry,
  asText: boolean,
  asJSON: boolean
): Promise<string | Record<string, unknown> | ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    fileEntry.file(
      (file) => {
        const reader = new FileReader()
        reader.onloadend = (event) => {
          let rawResult = event.target ? event.target.result : null
          let result: string | Record<string, unknown> = ''
          if (typeof rawResult !== 'undefined') {
            if (asText && typeof rawResult === 'string') {
              result = rawResult
              if (asJSON) {
                if (rawResult === '') rawResult = '""'
                result = JSON.parse(rawResult) as Record<string, unknown>
              }
              resolve(result)
            } else if (rawResult !== null) {
              resolve(rawResult)
            }
          } else {
            reject(new Error(`Undefined result on load end ${fileEntry.name}`))
          }
        }
        if (asText) {
          reader.readAsText(file)
        } else {
          reader.readAsArrayBuffer(file)
        }
      },
      (error) => {
        reject(
          new Error(
            `Error reading file ${fileEntry.name} ${
              asText ? 'as text' : ''
            }: ${error}`
          )
        )
      }
    )
  })
}

// Begin here. Get the app's sandbox storage.
const getStorageRoot = (): Promise<DirectoryEntry> => {
  return new Promise((resolve, reject) => {
    window.resolveLocalFileSystemURL(
      window.cordova.file.dataDirectory,
      (dir) => {
        if (dir) resolve(dir as DirectoryEntry)
        else reject(new Error(`Error reading storage ROOT directory`))
      },
      (error) =>
        reject(new Error(`Error reading storage ROOT directory: ${error}`))
    )
  })
}

// Get a directory entry inside parentDirEntry, or create it otherwise
const getDirectory = (
  parentDirEntry: DirectoryEntry,
  dirName: string
): Promise<DirectoryEntry> => {
  return new Promise((resolve, reject) => {
    const attemptCreateDirectory = () => {
      parentDirEntry.getDirectory(
        dirName,
        {
          create: true,
          exclusive: true,
        },
        (dirEntry: DirectoryEntry | undefined) => {
          if (dirEntry) resolve(dirEntry)
          else reject(new Error(`Error creating dir ${dirName}`))
        },
        () => {
          // Can't read or create, report the error
          reject(new Error(`Error reading created dir ${dirName}`))
        }
      )
    }
    // Attempt to read an existing directory
    parentDirEntry.getDirectory(
      dirName,
      {
        create: false,
        exclusive: true,
      },
      (dirEntry: DirectoryEntry | undefined) => {
        if (dirEntry) resolve(dirEntry)
        else attemptCreateDirectory()
      },
      () => {
        // Attempt to create as likely the folder does not exist
        console.log(
          `Error reading existing directory ${dirName}, attempting to create`
        )
        attemptCreateDirectory()
      }
    )
  })
}

// Given a directory entry, get the file inside or create if it doesn't exist
// overwrite: boolean
// fileName: string
// dirEntry: DirectoryEntry
const getFileByName = (
  dirEntry: DirectoryEntry,
  fileName: string,
  overwrite: boolean
): Promise<FileEntry> => {
  return new Promise((resolve, reject) => {
    dirEntry.getFile(
      fileName,
      {
        create: !!overwrite, // If overwrite is set, overwrite regardless
        exclusive: false,
      },
      (fileEntry) => resolve(fileEntry),
      () => {
        // File does not exist, create it
        dirEntry.getFile(
          fileName,
          {
            create: true,
            exclusive: false,
          },
          (fileEntry) => resolve(fileEntry),
          () => reject(new Error(`Error creating file ${fileName}`))
        )
      }
    )
  })
}

// Given a file and folder entry, move or copy the file to the folder
const transferFile = (
  fileEntry: Entry,
  toFolderEntry: DirectoryEntry,
  makeACopy: boolean,
  newFilename: string
): Promise<FileEntry> => {
  return new Promise((resolve, reject) => {
    const fileName = newFilename || fileEntry.name
    const command = makeACopy ? 'copyTo' : 'moveTo'
    fileEntry[command](
      toFolderEntry,
      fileName,
      (movedOrCopiedFile: Entry) => resolve(movedOrCopiedFile as FileEntry),
      (error: FileError) => {
        reject(
          new Error(
            `Transfer file error: ${command}: ${fileName}: ${error.toString()}`
          )
        )
      }
    )
  })
}

// Given a directory entry, remove the named file inside it
const deleteFile = (file: FileEntry): Promise<void> => {
  return new Promise((resolve, reject) => {
    file.remove(resolve, (error) => {
      reject(new Error(`Error deleting file ${error.toString()}`))
    })
  })
}

const getFreeSpace = (): Promise<unknown> => {
  return new Promise((resolve, reject) => {
    window.cordova.exec(
      (result) => resolve(result),
      (error) =>
        reject(new Error(`Error determining free disk space: ${error}`)),
      'File',
      'getFreeDiskSpace',
      []
    )
  })
}

// ------------------------- Audio / Video Permissions --------------------------

/* const mediaFileToFile = mediaFile =>
  new File(
    mediaFile.name,
    mediaFile.localURL,
    mediaFile.type,
    mediaFile.lastModifiedDate,
    mediaFile.size
  ) */

const isMicrophoneAuthorized = (): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    if (window.cordova.plugins.diagnostic.getMicrophoneAuthorizationStatus) {
      window.cordova.plugins.diagnostic.getMicrophoneAuthorizationStatus(
        (status) => {
          const pStatus = window.cordova.plugins.diagnostic.permissionStatus
          if (status === pStatus.GRANTED) {
            return resolve(true)
          } else if (status === pStatus.NOT_REQUESTED) {
            if (
              window.cordova.plugins.diagnostic.requestMicrophoneAuthorization
            ) {
              window.cordova.plugins.diagnostic.requestMicrophoneAuthorization(
                (status2) => {
                  if (status2 === pStatus.GRANTED) {
                    return resolve(true)
                  }
                  resolve(false)
                },
                (error) =>
                  reject(
                    new Error(
                      `Error requesting microphone: ${error.toString()}`
                    )
                  )
              )
            }
          } else {
            resolve(false)
          }
        },
        (error) =>
          reject(
            new Error(
              `Error Error getting microphone status: ${error.toString()}`
            )
          )
      )
    }
  })
}

const isCameraAuthorized = (): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    if (window.cordova.plugins.diagnostic.getCameraAuthorizationStatus) {
      window.cordova.plugins.diagnostic.getCameraAuthorizationStatus(
        (status) => {
          const pStatus = window.cordova.plugins.diagnostic.permissionStatus
          if (status === pStatus.GRANTED) {
            return resolve(true)
          } else if (status === pStatus.NOT_REQUESTED) {
            if (window.cordova.plugins.diagnostic.requestCameraAuthorization) {
              window.cordova.plugins.diagnostic.requestCameraAuthorization(
                (status2) => {
                  if (status2 === pStatus.GRANTED) {
                    return resolve(true)
                  }
                  resolve(false)
                },
                (error) =>
                  reject(
                    new Error(
                      'Request camera error occurred: ' + error.toString()
                    )
                  )
              )
            }
          } else {
            resolve(false)
          }
        },
        (error) =>
          reject(
            new Error('Activate camera error occurred: ' + error.toString())
          )
      )
    }
  })
}

export default {
  writeFile,
  readFile,
  getFileByName,
  transferFile,
  deleteFile,
  getDirectory,
  getStorageRoot,
  getFreeSpace,
  isMicrophoneAuthorized,
  isCameraAuthorized,
}
