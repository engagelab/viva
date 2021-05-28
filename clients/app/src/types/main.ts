import { USER_ROLE, CONSENT_TYPES, VIDEO_STATUS_TYPES, videoStorageTypes } from '../constants'

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

//------------------------- Video and Dataset models -----------------
interface EditDecriptionList {
  trim: number[][]
  blur: number[][]
}
interface VideoDetails {
  id: string // Used instead of video._id front end, and for QR Code.
  name: string // A human-readable string for naming this video
  category: string // green, yellow, red
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
  details: VideoDetails
  status: VideoStatus
  users: VideoUsers
  dataset: VideoDataset
  consents: string[]
  storages: string[]
}
export interface VideoSpec {
  video: Video
  dataset: Dataset
  presetDataset: Dataset
  user: User
}

export class Video {
  details: VideoDetails
  status: VideoStatus
  users: VideoUsers
  dataset: VideoDataset
  consents: string[]
  storages: string[]

  // Front-end attributes
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
      this.details = data.details
      this.status = data.status
      this.users = data.users
      this.dataset = data.dataset
      this.consents = data.consents
    }
    else if (data instanceof VideoSpec) {
      const v: Video = data.video || {}
      const d: Dataset = data.dataset || {}
      const p: Dataset = data.presetDataset || {}
      const u: User = data.user || {}
      const subState = v.subState || {}
      const serverState = v.serverState || {}

      this.aId = utilities.uuid()

      this.details.id = v.details.id || utilities.uuid()
      this.dataset.id = v.data || s.id
      this.status.main = v.status.main || VIDEO_STATUS_TYPES.draft
      this.
      this.storages =
        v.storages || (d && d.storages ? d.storages.map(store => store.name) : [])
      this.userRef = v.userRef || u.reference

      // This set of attributes are only used front-end
      this.encryptionInProgress = v.encryptionInProgress || false
      this.decryptionInProgress = v.decryptionInProgress || false
      this.uploadInProgress = v.uploadInProgress || false
      this.isUploaded = this.status != 'draft'
      this.uploadProgress = v.uploadProgress || this.isUploaded ? 100 : 0
      this.hasUnsavedChanges = false
      this.hasNewDataAvailable = false
      this.recordingExists = v.recordingExists
      this.subState = {
        consented: subState.consented || false,
        classified: subState.classified || false,
        edited: subState.edited || false
      }
      this.serverState = {
        encryptionInProgress: serverState.encryptionInProgress || false,
        decryptionInProgress: serverState.decryptionInProgress || false,
        uploadInProgress: serverState.uploadInProgress || false
      }

      this.pipelineInProgress = !!v.pipelineInProgress
      this.isEncrypted = !!v.isEncrypted

      this.encryptionKey = v.encryptionKey || '' // This key is used to encrypt the video data
      this.encryptionIV = v.encryptionIV || [] // This initial value is required for AES-GCM. The IV should never be reused
      this.username = v.username || ''
      this.consents = [] // These are the consents confirmed by the teacher in this recording
      this.edl = v.edl
        ? { ...v.edl }
        : {
          trim: [],
          blur: []
        }

      // this.edlArray = JSON.stringify(v.edl) || '';
      this.mimeType =
        v.mimeType ||
        (d
          ? d.browser == 'Chrome'
            ? 'video/webm'
            : 'video/mp4'
          : 'video/mp4')

      this.datasetInfo = v.datasetInfo || spec.datasetInfo
      if (!this.datasetInfo.id) {
        this.datasetInfo.id = this.settingId
      }

      this.name = v.name || this.fileId.substring(0, 7)
      this.description = v.description || ''
      this.errorInfo = v.errorInfo || ''
      this.category = v.category || ''
      this.trinn = v.trinn || ''
      this.fag = v.fag || ''
      this.duration = v.duration || 0
      this.created = v.created
        ? typeof v.created === 'string'
          ? new Date(v.created)
          : v.created
        : new Date()
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
      userRef: this.userRef,
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
interface DatasetUsers {
  dataManager: {
    name: string
  }
}
export interface DatasetData {
  _id: string
  name: string
  description: string
  created: Date
  formId: string
  selectionPriority: string[]
  selection: [key: string]: DatasetSelection
  status: DatasetStatus
  consent: CONSENT_TYPES
  users: DatasetUsers
  storages: this.storages,

  datasetId: string
  name: string
  description: string
  created: string
  lastUpdated: string
  elements: string
  dataManager: DataManagerData
  active: boolean // active datasetts who will be fetch in app
  accessGroupId: string // super admin group who  has access to all the datasets and videos
  lock: Record<string, unknown> // lock the datasett if someone else is editing
  selectionPriority: string[]
  selection: Record<string, unknown>
  dataportenGroups: string[]
  canvasCourses: string[] // Admin LMS uses canvas courses
  storages: StorageData[]
  consentHandling: Record<string, unknown>
  consent: CONSENT_SELECTION
  formId: string
}
export class Dataset {
  id: string
  name: string
  description: string
  created: string
  lastUpdated: string
  elements: string
  dataManager: DataManagerData | undefined
  active: boolean // active datasetts who will be fetch in app
  accessGroupId: string // super admin group who  has access to all the datasets and videos
  lock: Record<string, unknown> | undefined // lock the datasett if someone else is editing
  selectionPriority: string[]
  selection: Record<string, unknown> | undefined
  dataportenGroups: string[]
  canvasCourses: string[] // Admin LMS uses canvas courses
  storages: StorageData[]
  consentHandling: Record<string, unknown> | undefined
  consent: CONSENT_SELECTION
  formId: string

  constructor(data?: DatasetData) {
    this.id = data?.id // undefined if a new dataset
    this.name = data?.name ? data.name : ''
    this.description = data?.description ? data.description : ''
    this.created = data?.created ? data.created : ''
    this.lastUpdated = data?.lastUpdated ? data.lastUpdated : ''
    this.elements = data?.elements ? data.elements : ''
    this.dataManager = data?.dataManager ? data?.dataManager : undefined
    this.active = data?.active ? data.active : false // active datasetts who will be fetch in app
    this.accessGroupId = data?.accessGroupId ? data.accessGroupId : ''
    this.lock = data?.lock ? data?.lock : undefined
    this.selectionPriority = data?.selectionPriority
      ? data?.selectionPriority
      : []
    this.selection = data?.selection ? data.selection : undefined
    this.dataportenGroups = data?.dataportenGroups ? data.dataportenGroups : []
    this.canvasCourses = data?.canvasCourses ? data.canvasCourses : [] // Admin LMS uses canvas courses
    this.storages = data?.storages ? data?.storages : []
    this.consentHandling = data?.consentHandling
      ? data.consentHandling
      : undefined
    this.consent = data?.consent
      ? (data.consent as CONSENT_SELECTION)
      : CONSENT_SELECTION.manuel
    this.formId = data?.formId ? data.formId : ''
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
