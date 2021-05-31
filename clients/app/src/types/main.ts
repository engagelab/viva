import { USER_ROLE, CONSENT_TYPES, VIDEO_STATUS_TYPES, videoStorageTypes, VIDEO_STORAGE_TYPES, utvalger } from '../constants'

// ---------------  Utility -----------------
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    WkWebView: any
  }
  interface String {
    toPascalCase(): string
    toCamelCase(): string
    padZero(length: number): string
  }
  interface MediaFile {
    localURL: string
  }
}

String.prototype.toPascalCase = function () {
  const text = this.valueOf().replace(/[-_\s.]+(.)?/g, (_, c) =>
    c ? c.toUpperCase() : ''
  )
  return text.substr(0, 1).toUpperCase() + text.substr(1)
}

String.prototype.toCamelCase = function () {
  const text = this.valueOf().replace(/[-_\s.]+(.)?/g, (_, c) =>
    c ? c.toUpperCase() : ''
  )
  return text.substr(0, 1).toLowerCase() + text.substr(1)
}

String.prototype.padZero = function (length: number): string {
  let s = String(this)
  while (s.length < length) {
    s = '0' + s
  }
  return s
}

interface Dictionary<T> {
  [Key: string]: T
}

type EnumDictionary<T extends string | symbol | number, U> = {
  [K in T]: U
}

/* class Time extends MyDate {
  [Symbol.toPrimitive](hint: 'default'): string
  [Symbol.toPrimitive](hint: 'string'): string
  [Symbol.toPrimitive](hint: 'number'): number
  [Symbol.toPrimitive](hint: string): string | number {
    switch (hint) {
      case 'number':
        return this.valueOf()
      case 'string':
        return this.toString()
      default:
        return this.toString()
    }
  }
} */

export { Dictionary, EnumDictionary }

export interface LottieOptions {
  loop?: boolean
  autoplay?: boolean
  // eslint-disable-next-line
  animationData?: string | object
  path?: string
  src?: string
  rendererSettings?: {
    preserveAspectRatio: boolean
    clearCanvas: boolean
    progressiveLoad: boolean
    hideOnTransparent: boolean
  }
}

// ---------------  Models -----------------

export interface Callback<T, U> {
  (arg?: T): U
}

export interface LocalUser extends Record<string, unknown> {
  _id: string
  jwt: string
  lastLogin: Date
  pin: string
  name: string
  selected: boolean
}
// General App settings that should be saved to disk
export interface PersistedAppState extends Record<string, unknown> {
  localUsers: Record<string, LocalUser>
}

export interface Consent {
  id: string
  name: string
  checked: boolean
  current: boolean
  submission_id: string
  questions: Record<string, string>
  reference: {
    subset: string
  }
}
export interface DeviceStatus {
  mobile: boolean
  browser: string
  isFullScreen: boolean
  lastActive: number, // ms from epoch
}

//------------------------- Video and Dataset models -----------------
interface EditDecriptionList {
  trim: number[][]
  blur: number[][]
}
interface VideoDetails {
  id: string // Used instead of video._id front end, and for QR Code.
  name: string // A human-readable string for naming this video
  category: string // green, yellow, red
  created: Date
  description: string
  duration: number // Seconds  created: { type: Date },
  edl: EditDecriptionList
  encryptionKey: string
  encryptionIV: Uint8Array // Mixed type. Mongoose has no type for UInt8Array..
}
interface VideoStatus {
  main: VIDEO_STATUS_TYPES
  error: {
    errorInfo: string
  },
  inPipeline: boolean // true if a pipeline is currently working on this file
  isEncrypted: boolean // true if this video is encrypted
  isEdited: boolean // true if this video has edits to perform
  isConsented: boolean

  // Front end only (not saved at server)
  recordingExists: boolean // true if a recording data file has been assigned to this video
  encryptionInProgress: boolean
  decryptionInProgress: boolean
  uploadInProgress: boolean
  isUploaded: boolean
  uploadProgress: number
  hasUnsavedChanges: boolean
  hasNewDataAvailable: boolean
}
interface VideoSharing {
  users: string[],
  access: boolean
  description: string
  edl: EditDecriptionList
}
interface VideoUsers {
  owner: string
  sharedWith: string[], // Users who can see this video. Used for easier searching
  sharing: VideoSharing[] // Each entry is a share for a particular set of users, and particular EDL of this video
}
interface VideoDataset {
  id: string
  name: string
  selection: string[] // 'utvalg' setting
}
export interface VideoData {
  file: {
    mimeType: string
  }
  details: VideoDetails
  status: VideoStatus
  users: VideoUsers
  dataset: VideoDataset
  consents: string[]
  storages: string[]
}
export interface VideoSpec {
  video?: Video
  dataset?: Dataset
  utvalg?: string[]
  user?: User
  deviceStatus?: DeviceStatus
}

export class Video {
  file: {
    mimeType: string
  }
  details: VideoDetails
  status: VideoStatus
  users: VideoUsers
  dataset: VideoDataset
  consents: string[]
  storages: string[]

  // Front-end only attributes
  aId: string

  constructor(data?: VideoData | Video) {
    details: this.details,
    status: this.status,
    users: this.users,
    dataset: this.dataset,
    consents: this.consents
  }

  constructor (data: VideoData | VideoSpec) {
    if (data instanceof VideoData) {
      data = data as VideoData
      this.details = data.details
      this.status = data.status
      this.users = data.users
      this.dataset = data.dataset
      this.consents = data.consents
    }
    else if (data instanceof VideoSpec) {
      data = data as VideoSpec
      const v: Video = data.video || {}
      const d: Dataset = data.dataset || {}
      const ds: DeviceStatus = data.deviceStatus || {}
      const u: User = data.user || {}

      this.aId = utilities.uuid()

      this.details = {
        id: v.details.id || utilities.uuid()
        name: v.details.name || this.details.id.substring(0, 7)
        category: v.details.category || ''
        created: v.details.created || new Date()
        description: v.details.description || ''
        duration: v.details.duration || 0
        edl: edl: v.details.edl ? { ...v.details.edl } : {
          trim: [],
          blur: []
        }
        encryptionKey: v.details.encryptionKey || '' // This key is used to encrypt the video data
        encryptionIV: v.details.encryptionIV || [] // This initial value is required for AES-GCM. The IV should never be reused
      }
      this.dataset = {
        id: v.dataset.id || s.id
        name: v.dataset.name || s.name
        selection: v.dataset.selection || data.utvalg || []
      }
      this.status = {
        main: v.status.main || VIDEO_STATUS_TYPES.draft
        error: {
          errorInfo: v.status.error.errorInfo || ''
        },
        inPipeline: !!v.status.inPipeline
        isEncrypted: !!v.status.isEncrypted
        isEdited: !!v.status.isEdited
        isConsented: !!v.status.isConsented

        // Front end only (not saved at server)
        recordingExists: !!v.status.recordingExists
        encryptionInProgress: !!v.status.encryptionInProgress
        decryptionInProgress: !!v.status.decryptionInProgress
        uploadInProgress: !!v.status.uploadInProgress
        isUploaded: this.status.main != VIDEO_STATUS_TYPES.draft
        uploadProgress: v.uploadProgress || this.isUploaded ? 100 : 0
        hasUnsavedChanges: false
        hasNewDataAvailable: false
      }
      this.users = {
        owner: v.users.owner || u._id
        sharedWith: v.users.sharedWith || []
        sharing: v.users.sharing.map((s: VideoSharing) => {
          return {
            users: s.users,
            access: s.access,
            description: s.description,
            edl: s.edl ? { ...s.edl } : {
              trim: [],
              blur: []
            }
          }
        })
      }
      this.consents = v.consents || []
      this.storages =
        v.storages || (d && d.storages ? d.storages.map(store => store.name) : [])
      this.file.mimeType =
        v.file.mimeType ||
        (ds
          ? ds.browser == 'Chrome'
            ? 'video/webm'
            : 'video/mp4'
          : 'video/mp4')
    }
  }

  // Convert this class to string representation
  // Note: the encryptionIV does not convert directly using JSON.stringify
  getAsString () {
    const v = { ...this }
    v.encryptionIV = utilities.ui8arr2str(this.encryptionIV)
    return JSON.stringify(v)
  }

  getFileUploadInfo () {
    const v = {
      fileId: this.fileId,
      userId: this.users.owner,
    }
    return JSON.stringify(v)
  }

  // Convert this class to a buffer suitable for encryption
  getAsBuffer () {
    return utilities.str2ab(this.getAsString())
  }

  // Set this video's data from a buffer value, used for decryption
  // Ensure that the encryptionIV is correctly converted
  setFromBuffer (buffer) {
    const videoString = utilities.ab2str(buffer)
    const videoObject = JSON.parse(videoString)
    if (videoObject.encryptionIV.length > 0) {
      videoObject.encryptionIV = utilities.str2ui8arr(videoObject.encryptionIV)
    }
    Object.keys(videoObject).map(key => (this[key] = videoObject[key]))
    this.created = new Date(this.created)
  }
  // Create a copy of this video metadata
  /* clone() {
    const newVideo = new VideoMetadata({ video: this });
    return newVideo;
  } */
  // Set all local monitor booleans to false; Should be set after initial load from indexedDB
  falsifyAllMonitors () {
    this.encryptionInProgress = false
    this.decryptionInProgress = false
    this.uploadInProgress = false
    this.hasUnsavedChanges = false
  }

  // Compare a given EDL to ours to check for changes
  edlEquals (anotherEdl) {
    let i = this.edl.length
    let j = anotherEdl.length
    // Arays are the same length
    if (i >= 0 && i === j) {
      while (i > -1) {
        if (
          this.edl[i][0] !== anotherEdl[i][0] ||
          this.edl[i][1] !== anotherEdl[i][1]
        ) {
          return false
        }
        i--
      }
      return true
    } else {
      return false
    }
  }
}

interface DatasetSelection {
  title: string
  [key: string]?: DatasetSelection
}
interface DatasetStatus {
  lastUpdated: Date
  lockedBy: string
}
interface DatasetConsent {
  type: CONSENT_TYPES
}
interface DatasetUsers {
  dataManager: {
    name: string
  }
}
interface DatasetStorage {
  name: VIDEO_STORAGE_TYPES
  groupId: string
  file: {
    name: string[],
  },
  category: string[],
}
export interface DatasetData {
  _id: string
  name: string
  description: string
  created: Date
  formId: string
  status: DatasetStatus
  consent: DatasetConsent
  users: DatasetUsers
  selection: [key: string]: DatasetSelection
  selectionPriority: string[]
  storages: DatasetStorage
}
export class Dataset {
  _id: string
  name: string
  description: string
  created: Date
  formId: string
  status: DatasetStatus
  consent: DatasetConsent
  users: DatasetUsers
  selection: [key: string]: DatasetSelection
  selectionPriority: string[]
  storages: DatasetStorage[]

  constructor(data?: DatasetData) {
    this._id = data?._id // undefined if a new dataset
    this.name = data?.name || ''
    this.description = data?.description || ''
    this.created = data?.created || new Date()
    this.formId = data?.formId || ''
    this.status.lastUpdated = data?.status.lastUpdated || new Date()
    this.status.lockedBy = data?.status.lockedBy || ''
    this.consent.type = data?.consent
      ? (data.consent.type as CONSENT_SELECTION)
      : CONSENT_TYPES.manuel
    this.users.dataManager = data?.users.dataManager || ''
    this.selection = data?.selection as DatasetSelection || {}
    this.selectionPriority = data?.selectionPriority || []
    this.storages = data?.storages.map((s: DatasetStorage) => {
      return {
        name: s.name || '',
        groupId: s.groupId || '',
        file: { name: s.file.name || [] },
        category: s.category || []
      }
    })
  }
}

// ---------------  User -----------------
interface UserStatus {
  role: USER_ROLE
  created: Date
  provider: string // Dataporten or Canvas ?
  lastLogin: Date
  totalDrafts: number
  totalUploads: number
  totalTransfers: number
}
interface UserProfile {
  username: string
  password: string
  fullName: string
  oauthId: string
  reference: string // This should be sent to the client rather than _id
  groups: string[] // Groups this user is a member of
}
interface UserLock { // { [datasetID]: { date: Date.now(), keyName: String }
  date: Date
  keyName: string
}
interface UserDataset {
  id: string
  utvalg: string[]
  locks: Record<string, UserLock>
}
interface UserVideos {
  draftIDs: string[]
}
export interface UserData {
  _id: string
  status: UserStatus
  profile: UserProfile
  datasett: UserDataset
  videos: UserVideos
}
export class User {
  _id: string
  status: UserStatus
  profile: UserProfile
  datasett: UserDataset
  videos: UserVideos

  constructor(data?: UserData | User) {
    this._id = data?._id
    this.status = data?.status
    this.profile = data?.profile
    this.datasett = data?.datasett
    this.videos = data?.videos
  }
}

// ---------------  API -----------------

enum XHR_REQUEST_TYPE {
  GET = 'GET',
  PUT = 'PUT',
  POST = 'POST',
  DELETE = 'DELETE',
}

enum XHR_CONTENT_TYPE {
  JSON = 'application/json',
  MULTIPART = 'multipart/form-data',
  URLENCODED = 'application/x-www-form-urlencoded',
}

interface APIRequestPayload {
  method: XHR_REQUEST_TYPE
  route: string
  credentials?: boolean
  body?:
    | unknown
    | string
    | User
    | FormData
  headers?: Record<string, string>
  query?: Record<string, string>
  contentType?: string
  baseURL?: string
}

interface XHRError {
  status: number
}

interface XHRPayload {
  url: string
  headers: Record<string, string>
  credentials: boolean
  body: string | FormData
  method: XHR_REQUEST_TYPE
}

export {
  XHR_REQUEST_TYPE,
  APIRequestPayload,
  XHRPayload,
  XHRError,
  XHR_CONTENT_TYPE,
}
