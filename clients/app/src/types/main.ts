import {
  USER_ROLE,
  CONSENT_TYPES,
  VIDEO_STATUS_TYPES,
  VIDEO_STORAGE_TYPES,
} from '../constants'
import { ui8arr2str, str2ab } from '../utilities'

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
  lastActive: number // ms from epoch
}

//------------------------- Video and Dataset models -----------------
interface EditDecriptionList {
  trim: number[][]
  blur: number[][]
}
interface VideoDetails {
  id?: string // Used instead of video._id front end, and for QR Code.
  name?: string // A human-readable string for naming this video
  category?: string // green, yellow, red
  created?: Date
  description?: string
  duration?: number // Seconds  created: { type: Date },
  edl?: EditDecriptionList
  encryptionKey?: string
  encryptionIV?: Uint8Array // Mixed type. Mongoose has no type for UInt8Array..
}
interface VideoStatus {
  main?: VIDEO_STATUS_TYPES
  error?: {
    errorInfo: string
  }
  inPipeline?: boolean // true if a pipeline is currently working on this file
  isEncrypted?: boolean // true if this video is encrypted
  isEdited?: boolean // true if this video has edits to perform
  isConsented?: boolean

  // Front end only (not saved at server)
  recordingExists?: boolean // true if a recording data file has been assigned to this video
  encryptionInProgress?: boolean
  decryptionInProgress?: boolean
  uploadInProgress?: boolean
  isUploaded?: boolean
  uploadProgress?: number
  hasUnsavedChanges?: boolean
  hasNewDataAvailable?: boolean
}
interface VideoSharing {
  users?: string[]
  access?: boolean
  description?: string
  edl?: EditDecriptionList
}
interface VideoUsers {
  owner?: string
  sharedWith?: string[] // Users who can see this video. Used for easier searching
  sharing?: VideoSharing[] // Each entry is a share for a particular set of users, and particular EDL of this video
}
interface VideoDataset {
  id?: string
  name?: string
  selection?: string[] // 'utvalg' setting
}

export interface VideoSpec {
  dataset: Dataset
  selection: string[] // 'selection' as string array from PresetDataset
  user: User
  deviceStatus: DeviceStatus
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

  constructor(data: Video | VideoSpec) {
    this.details = {
      id: utilities.uuid(),
      name: id.substring(0, 7),
      category: '',
      created: new Date(),
      description: '',
      duration: 0,
      edl: {
        trim: [],
        blur: [],
      },
      encryptionKey: '', // This key is used to encrypt the video data
      encryptionIV: [], // This initial value is required for AES-GCM. The IV should never be reused
    }
    this.status = {
      main: VIDEO_STATUS_TYPES.draft,
      error: {
        errorInfo: '',
      },
      inPipeline: false,
      isEncrypted: false,
      isEdited: false,
      isConsented: false,

      // Front end only (not saved at server)
      recordingExists: false,
      encryptionInProgress: false,
      decryptionInProgress: false,
      uploadInProgress: false,
      isUploaded: VIDEO_STATUS_TYPES.premeta,
      uploadProgress: 0,
      hasUnsavedChanges: false,
      hasNewDataAvailable: false,
    }
    this.users = {
      owner: '',
      sharedWith: [],
      sharing: [],
    }
    this.dataset = {
      id: '',
      name: '',
      selection: [],
    }
    this.consents = []
    this.storages = []
    this.file.mimeType = 'video/mp4'

    // Create a Video using the current App state
    if (data instanceof VideoSpec) {
      data = data as VideoSpec
      this.updateDataset({
        id: data.dataset._id,
        name: data.dataset.name,
        selection: data.selection,
      })
      this.updateUsers({ owner: data.user._id })
      this.storages = data.dataset.storages.map((storage) => storage.name)
      this.file.mimeType =
        data.deviceStatus.browser === 'Chrome' ? 'video/webm' : 'video/mp4'
    } else {
      // Create a video based on a given Video
      this.updateAll(data as Video)
    }
  }

  updateDetails(details: VideoDetails): void {
    Object.keys(details).forEach((key) => (this.details[key] = details[key]))
  }
  updateStatus(status: VideoStatus): void {
    Object.keys(status).forEach((key) => (this.status[key] = status[key]))
  }
  updateUsers(users: VideoUsers): void {
    Object.keys(users).forEach((key) => (this.users[key] = users[key]))
  }
  updateDataset(dataset: VideoDataset): void {
    Object.keys(dataset).forEach((key) => (this.dataset[key] = dataset[key]))
  }

  updateAll(data: Video): void {
    this.updateDetails(data.details)
    this.updateStatus(data.status)
    this.updateUsers(data.users)
    this.updateDataset(data.dataset)
    this.consents = data.consents
    this.storages = data.storages
    this.file.mimeType = data.file.mimeType
  }

  // Convert this class to string representation
  // Note: the encryptionIV does not convert directly using JSON.stringify
  getAsString(): string {
    const v = { ...this }
    v.encryptionIV = ui8arr2str(this.encryptionIV)
    return JSON.stringify(v)
  }

  getFileUploadInfo(): string {
    const v = {
      fileId: this.fileId,
      userId: this.users.owner,
    }
    return JSON.stringify(v)
  }

  // Convert this class to a buffer suitable for encryption
  getAsBuffer(): ArrayBuffer {
    return str2ab(this.getAsString())
  }

  // Set this video's data from a buffer value, used for decryption
  // Ensure that the encryptionIV is correctly converted
  setFromBuffer(buffer: ArrayBuffer): void {
    const videoString = ab2str(buffer)
    const videoObject: VideoData = JSON.parse(videoString)
    if (videoObject.details.encryptionIV.length > 0) {
      videoObject.details.encryptionIV = str2ui8arr(
        videoObject.details.encryptionIV
      )
    }
    this.update(videoObject)
    this.details.created = new Date(this.created)
  }
  // Create a copy of this video metadata
  /* clone() {
    const newVideo = new VideoMetadata({ video: this });
    return newVideo;
  } */
  // Set all local monitor booleans to false; Should be set after initial load from indexedDB
  falsifyAllMonitors(): void {
    this.encryptionInProgress = false
    this.decryptionInProgress = false
    this.uploadInProgress = false
    this.hasUnsavedChanges = false
  }

  // Compare a given EDL to ours to check for changes
  edlEquals(anotherEdl: EditDecriptionList): boolean {
    let i = this.edl.length
    const j = anotherEdl.length
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
  [key: string]: DatasetSelection
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
    name: string[]
  }
  category: string[]
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
  selection: { [key: string]: DatasetSelection }
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
  selection: { [key: string]: DatasetSelection }
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
    this.selection = (data?.selection as DatasetSelection) || {}
    this.selectionPriority = data?.selectionPriority || []
    this.storages = data?.storages.map((s: DatasetStorage) => {
      return {
        name: s.name || '',
        groupId: s.groupId || '',
        file: { name: s.file.name || [] },
        category: s.category || [],
      }
    })
  }

  get selection(): string[] {
    return this.selection.map((s) => `${s.keyName}:${s.title}`)
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
interface UserLock {
  // { [datasetID]: { date: Date.now(), keyName: String }
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
  removedDraftIDs: string[]
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
  body?: unknown | string | User | FormData
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
