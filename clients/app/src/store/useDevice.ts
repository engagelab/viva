import { ref, Ref, computed, ComputedRef } from 'vue'
import cordovaService from '../api/cordovaService'
import { emitError, uuid } from '../utilities'
import { cordovaConstants } from '../constants'

export enum CordovaPathName {
  root = '.',
  users = 'users',
  videos = 'videos',
}

export interface CordovaDataType {
  readFile?: boolean // Returns the content if true, returns a FileEntry if false  (read)
  asText?: boolean // false   Set to true if reading a text or JSON file, otherwise binary will be used  (read/write)
  asJSON?: boolean // true   Set to false to read/write a file without parsing or stringifying JSON  (read/write)
  overwrite?: boolean // false   Set to true to overwrite an existing file (open file)
  append?: boolean // false   Set to true to append data to the end of the file (write)
  path?: string[] // Path to the file below the root as an array of directory names (read/write)
  fileName?: string // name of the file on disk (read/write)
  data?: unknown | Blob | string // the content to be written  (write)
  file?: FileEntry // the FileEntry object in memory
  fileToMove?: FileEntry | MediaFile // the file entry object in momory for the file to be moved
}
export class CordovaData {
  readFile = false
  asText = false
  asJSON = true
  overwrite = false
  append = false
  path: string[]
  fileName = ''
  data?: unknown | string | Blob
  file?: FileEntry
  fileToMove?: /* data */ FileEntry | MediaFile /* video */

  constructor(data: CordovaDataType) {
    this.path = []
    if (data) {
      this.readFile = data.readFile ? data.readFile : false
      this.asText = data.asText ? data.asText : false
      this.asJSON = data.asJSON ? data.asJSON : true
      this.overwrite = data.overwrite ? data.overwrite : false
      this.append = data.append ? data.append : false
      this.path = data.path ? data.path : []
      this.fileName = data.fileName ? data.fileName : ''
      this.data = data.data
      this.file = data.file
      this.fileToMove = data.fileToMove
    }
  }
}

// ------------  State (internal) --------------
export interface CordovaState {
  deviceReady: boolean
  deviceOnline: boolean
  recordingNow: boolean
  cordovaPath: string[]
  currentVideo: FileEntry | undefined
  currentAudio: FileEntry | undefined
  currentAudioFilename: string
  currentVideoFilename: string
}

let mediaStartTime = 0 // Used to know how long the recording has been running (media.getDuration is sometimes innacurate)
let mediaTimeout: NodeJS.Timeout // Use this to stop the media if it has run too long

const _cordovaState: Ref<CordovaState> = ref({
  deviceReady: false,
  deviceOnline: window.navigator.onLine,
  recordingNow: false,
  cordovaPath: [],
  currentVideo: undefined,
  currentAudio: undefined,
  currentAudioFilename: '',
  currentVideoFilename: '',
})

// ------------ Internal fucntions --------------
// Handle the device losing internet connection
function onOffline() {
  _cordovaState.value.deviceOnline = false
}
function onOnline() {
  _cordovaState.value.deviceOnline = true
}
function moveFile(filename: string, mediaFile: MediaFile): Promise<void> {
  // The returned file is in the temp directory
  if (mediaFile) {
    const fileId = filename || uuid()
    const cordovaData: CordovaData = new CordovaData({
      fileName: fileId,
      fileToMove: mediaFile,
      path: _cordovaState.value.cordovaPath,
    })
    // This will move a file from a temp directory to our app storage
    cordovaService
      .moveMediaFromTemp(cordovaData)
      .then((fileEntry: FileEntry | void) => {
        if (fileEntry) {
          // What was a MediaFile will now be a FileEntry
          _cordovaState.value.currentVideoFilename =
            cordovaData.fileName || 'videoFilenameNotFound'
          _cordovaState.value.currentVideo = fileEntry
          _cordovaState.value.recordingNow = false
        }
      })
  } else {
    // 'cancel' was pressed in the iOS video recorder..
    _cordovaState.value.recordingNow = false
  }
}

// ------------  Getters (Read only) --------------
interface Getters {
  directoryPath: ComputedRef<string[]>
  deviceOnline: ComputedRef<boolean>
  deviceReady: ComputedRef<boolean>
  video: ComputedRef<FileEntry | undefined>
  audio: ComputedRef<FileEntry | undefined>
  audioFilename: ComputedRef<string>
  videoFilename: ComputedRef<string>
}
// Node: these are 'getters' which should be called as a variable, not a function
const getters = {
  get directoryPath(): ComputedRef<string[]> {
    return computed(() => _cordovaState.value.cordovaPath)
  },
  get deviceOnline(): ComputedRef<boolean> {
    return computed(() => _cordovaState.value.deviceOnline)
  },
  get deviceReady(): ComputedRef<boolean> {
    return computed(() => _cordovaState.value.deviceReady)
  },
  get video(): ComputedRef<FileEntry | undefined> {
    return computed(() => _cordovaState.value.currentVideo)
  },
  get audio(): ComputedRef<FileEntry | undefined> {
    return computed(() => _cordovaState.value.currentAudio)
  },
  get audioFilename(): ComputedRef<string> {
    return computed(() => _cordovaState.value.currentAudioFilename)
  },
  get videoFilename(): ComputedRef<string> {
    return computed(() => _cordovaState.value.currentVideoFilename)
  },
}
// ------------  Actions --------------
interface Actions {
  setup: () => void
  recordVideo: (
    filename?: string,
    recordingCompleted?: () => void
  ) => Promise<void>
  loadVideo: (filename: string) => Promise<void | FileEntry>
  createAudio: () => Promise<void>
  startRecordingAudio: () => Promise<void>
  stopRecordingAudio: () => Promise<void>

  // In this store, the path is set to locate resources e.g. video / audio recordings
  setCordovaPath: (path: string[]) => void

  // Another Store should call these to have its data saved or loaded
  loadFromStorage: <T>(cordovaData: CordovaData) => Promise<T | void>
  saveToStorage: (cordovaData: CordovaData) => Promise<void>
  copyFileToTemp: (cordovaData: CordovaData) => Promise<FileEntry | void>
  getCachedMedia: (fileURL: string) => Promise<ArrayBuffer | string>
  loadMediaCache: () => Promise<void>
  saveMediaCache: () => Promise<void>

  // Called from an event listener to log errors to drive
  logErrorMessage: (errorText: string) => void
}
const actions: Actions = {
  setup: function (): void {
    _cordovaState.value.deviceReady = true
    document.addEventListener('offline', onOffline, false)
    document.addEventListener('online', onOnline, false)
    cordovaService.checkPermissionList()
  },
  logErrorMessage: function (errorText: string): void {
    if (_cordovaState.value.deviceReady) cordovaService.saveLog(errorText)
  },
  // Set the location for device data (e.g. recordings)
  setCordovaPath: function (path: string[]): void {
    _cordovaState.value.cordovaPath = path
  },
  // This will look in the Participant's folder for a file and load it to the state.currentVideo.
  loadVideo: function (fileName: string): Promise<FileEntry | void> {
    const cd: CordovaData = new CordovaData({
      fileName,
      readFile: false,
      path: _cordovaState.value.cordovaPath,
    })
    return this.loadFromStorage<FileEntry>(cd).then(
      (fileEntry: FileEntry | void) => {
        if (fileEntry) {
          _cordovaState.value.currentVideoFilename =
            cd.fileName || 'videoFilenameNotFound'
          _cordovaState.value.currentVideo = fileEntry
          _cordovaState.value.recordingNow = false
        }
      }
    )
  },
  // Begin a video recording session - this will call the OS Camera module and resolve when that module returns with a finished video
  // Then the video is moved from the temp folder to a more suitable location
  recordVideo: function (
    filename?: string,
    recordingCompleted?: () => void
  ): Promise<void> {
    if (!_cordovaState.value.deviceReady) {
      const e = new Error('Cordova not ready calling recordVideo')
      e.name = 'Warning'
      emitError(e)
      return Promise.resolve()
    }
    if (_cordovaState.value.recordingNow) {
      const e = new Error('Called recordVideo when already recording')
      e.name = 'Warning'
      emitError(e)
      return Promise.resolve()
    }
    _cordovaState.value.recordingNow = true
    return cordovaService
      .captureVideo()
      .then((mediaFile: MediaFile | void) =>
        moveFile(filename, mediaFile, recordingCompleted)
      )
      .catch((error: Error) => console.log(error))
  },

  // Create a new audio Media and set it the the currentn audio
  // Reference: https://cordova.apache.org/docs/en/10.x/reference/cordova-plugin-media/
  createAudio: function (): Promise<void> {
    if (!_cordovaState.value.deviceReady) {
      const e = new Error('Cordova not ready calling recordAudio')
      e.name = 'Warning'
      emitError(e)
      return Promise.resolve()
    }
    if (_cordovaState.value.recordingNow) {
      const e = new Error('Called recordAudio when already recording')
      e.name = 'Warning'
      emitError(e)
      return Promise.resolve()
    }
    _cordovaState.value.recordingNow = true
    const cordovaData: CordovaData = new CordovaData({
      fileName: uuid() + '.m4a', // iOS only records to files of type .wav and .m4a
      // path: [], // the recording will be placed in the application's documents/tmp directory
    })
    return cordovaService
      .createAudio(cordovaData)
      .then((fileEntry?: FileEntry) => {
        if (fileEntry) {
          _cordovaState.value.currentAudioFilename =
            cordovaData.fileName || 'audioFilenameNotFound'
          _cordovaState.value.currentAudio = fileEntry
        }
      })
      .catch((error: Error) => {
        _cordovaState.value.recordingNow = false
        console.log(error)
      })
  },
  // Start recording with the current audio object
  startRecordingAudio: function (): Promise<void> {
    return cordovaService.startRecordingAudio().then(() => {
      _cordovaState.value.recordingNow = true
      mediaStartTime = Date.now()
      // Create a timer to stop the recording if it exceeds the maximum duration
      mediaTimeout = setTimeout(() => {
        if (_cordovaState.value.recordingNow) {
          this.stopRecordingAudio()
        }
      }, cordovaConstants.audioRecordingMaxDuration)
    })
  },
  stopRecordingAudio: function (): Promise<void> {
    return cordovaService.stopRecordingAudio().then(() => {
      clearTimeout(mediaTimeout)
      _cordovaState.value.recordingNow = false
      const mediaLength = Date.now() - mediaStartTime
      mediaStartTime = 0
      // The returned file is in the temp directory
      // Don't use it if it was too short..
      // Audio recording should be 3 seconds minimum
      if (mediaLength < 3000) {
        _cordovaState.value.currentAudioFilename = 'audioFilenameNotFound'
        _cordovaState.value.currentAudio = undefined
      } else {
        const cordovaData: CordovaData = new CordovaData({
          fileName: _cordovaState.value.currentAudioFilename,
          fileToMove: _cordovaState.value.currentAudio,
          path: _cordovaState.value.cordovaPath, // This path should have been set to the current Participant's directory
        })
        // This will move the audio file from temp directory to our desired storage
        cordovaService
          .moveMediaFromTemp(cordovaData)
          .then((movedFile: FileEntry | void) => {
            if (movedFile) {
              console.log(
                `Audio file moved from: ${(
                  cordovaData.fileToMove as FileEntry
                ).toInternalURL()} to: ${movedFile.toInternalURL()}`
              )
              // What was a MediaFile will now be a FileEntry
              _cordovaState.value.currentAudioFilename =
                cordovaData.fileName || 'audioFilenameNotFound'
              _cordovaState.value.currentAudio = movedFile
            }
          })
          .catch((error: Error) => console.log(error))
      }
    })
  },
  /**
   * Load a file given a CordovaData config object
   *
   * e.g.
   * CordovaData {
   *    filename: string
   *    path: string[]
   *    readFile: true  <== Returns the content if true, returns a FileEntry if false
   *    type: 'text' if read as text, otherwise read as binary
   *    asJSON: true <== Use false to read a text file as raw text
   * }
   * Returns a promise
   */
  loadFromStorage: function <T>(cordovaData: CordovaData): Promise<T | void> {
    if (!_cordovaState.value.deviceReady) {
      const e = new Error('Cordova not ready calling loadFromStorage')
      e.name = 'Warning'
      emitError(e)
      return Promise.resolve()
    }
    return cordovaService.loadFromStorage<T>(cordovaData)
  },
  /* saveToStorage
   * Save data to device. Include a 'data' object inside CordovaData, this will be serialised
   *
   * e.g.
   * CordovaData {
   *    data: Participant dict. || Tracking dict.
   *    filename: string
   *    path: string[]
   * }
   * Returns a promise
   */
  saveToStorage: function (cordovaData: CordovaData): Promise<void> {
    if (!_cordovaState.value.deviceReady) {
      const e = new Error('Cordova not ready calling saveToStorage')
      e.name = 'Warning'
      emitError(e)
      return Promise.resolve()
    }
    return cordovaService.saveToStorage(cordovaData)
  },
  /* copyFileToTemp
   * Make a copy of the file in the application /tmp directory
   *
   * Resolves:
   *  copied File object
   *  or <void> + emit an error if there was an unexpected result
   */
  copyFileToTemp: function (
    cordovaData: CordovaData
  ): Promise<FileEntry | void> {
    if (!_cordovaState.value.deviceReady) {
      emitError(new Error('Cordova not ready calling copyFileToTemp'))
      return Promise.resolve()
    }
    return cordovaService.copyFileToTemp(cordovaData)
  },
  /* getCachedMedia
   * Cache a local copy of the file in the application cache directory
   *
   * Resolves:
   *  blob containing local file OR URl to remote image if not found
   */
  getCachedMedia: async function (fileURL): Promise<ArrayBuffer | string> {
    if (!_cordovaState.value.deviceReady) return Promise.resolve(fileURL)
    const media = await cordovaService.getFileFromCache(fileURL)
    // If we didn't find a cahced file, attempt to add this URL to the cache
    if (typeof media === 'string') {
      cordovaService.downloadFileToCache(fileURL)
    }
    return media
  },
  loadMediaCache: function (): Promise<void> {
    if (!_cordovaState.value.deviceReady) return Promise.resolve()
    return cordovaService.loadMediaCache()
  },
  saveMediaCache: function (): Promise<void> {
    if (!_cordovaState.value.deviceReady) return Promise.resolve()
    return cordovaService.saveMediaCache()
  },
}

// This defines the interface used externally
interface ServiceInterface {
  actions: Actions
  getters: Getters
}
export function useDeviceService(): ServiceInterface {
  return {
    actions,
    getters,
  }
}

export type DeviceServiceType = ReturnType<typeof useDeviceService>
