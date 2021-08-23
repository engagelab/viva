import {
  USER_ROLE,
  CONSENT_TYPES,
  VIDEO_STATUS_TYPES,
  VIDEO_STORAGE_TYPES,
  VIDEO_SHARING_MODE,
  VIDEO_SHARING_STATUS,
} from '../constants'
import { uuid } from '../utilities'

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

export interface Callback {
  (...args: unknown[]): unknown
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
  id: string // LOCAL VARIABLE
  name: string // LOCAL VARIABLE
  checked: boolean // LOCAL VARIABLE

  current?: boolean
  delivered_on?: string // 'Tue, 25 Feb 2020 13:29:00 GMT'
  form_id?: string // '140649'
  source?: string // '140649'
  submission_id: string // '6256984'
  questions: Record<string, string> // { consent_question_1: 'True', consent_question_2: 'True' }
  reference: {
    subset?: string // 'skole-Hauk.'
    user_identifier?: string
    user_fullname?: string
    child_fullname?: string
    dataset?: string // '5e5512f17ec2ce3bd9025d22'
    user_mail?: string // 'abc@uio.no',
    username?: string // 'abc@uio.no'
  }
}
export interface DeviceStatus {
  mobile: boolean
  browser: string
  isFullScreen: boolean
  lastActive: number // ms from epoch
}

//------------------------- Video Auxiliary Interfaces for LTI -----------------

// StatusListItem is always associated with a ListItem
export interface StatusListItem {
  readonly mode: VIDEO_SHARING_STATUS
  readonly user?: NameAndRole // User who is subject of the status update
  readonly created?: Date // Creation date of the status update
  readonly item: ListItem
}
export interface ListItem {
  readonly mode: VIDEO_SHARING_MODE
  readonly video: Video
  readonly videoOwner: NameAndRole // Owner of the video
  readonly share?: VideoSharing // Pointer to video.users.shares[index]
}

// --------------------------   Video data --------------------------
export interface EditDecriptionList {
  trim: number[]
  blur: number[][]
}
interface VideoDetailsData {
  id?: string // Used instead of video._id front end, and for QR Code.
  name?: string // A human-readable string for naming this video
  category?: string // green, yellow, red
  created?: string
  description?: string
  duration?: number // Seconds  created: { type: Date },
  edl?: EditDecriptionList
  encryptionKey?: string
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
}
interface VideoStatusData {
  main?: VIDEO_STATUS_TYPES
  error?: { errorInfo?: string }
  inPipeline?: boolean // true if a pipeline is currently working on this file
  isEncrypted?: boolean // true if this video is encrypted
  isEdited?: boolean // true if this video has edits to perform
  isConsented?: boolean
  isClassified?: boolean // true if a sensitivity colour has been assigned

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
interface VideoStatus {
  main: VIDEO_STATUS_TYPES
  error: {
    errorInfo: string
  }
  inPipeline: boolean // true if a pipeline is currently working on this file
  isEncrypted: boolean // true if this video is encrypted
  isEdited: boolean // true if this video has edits to perform
  isConsented: boolean
  isClassified: boolean // true if a sensitivity colour has been assigned

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
export interface SharingComment {
  created: Date
  creator: string // LTI ID
  comment: string
}
export interface VideoSharing {
  _id: string // DB ID of the share (not the video!)
  creator: string // LTI ID
  users: string[]
  access: boolean
  title: string
  description: string
  comments: SharingComment[]
  edl: EditDecriptionList
}
interface VideoUsersData {
  owner?: string
  sharedWith?: string[]
  sharing?: VideoSharing[]
}
interface VideoUsers {
  owner: string
  ltiID: string
  sharedWith: string[] // Users who can see this video. Used for easier searching
  sharing: VideoSharing[] // Each entry is a share for a particular set of users, and particular EDL of this video
}
interface VideoDatasetData {
  id?: string
  name?: string
  selection?: Selection[] // 'utvalg' setting
}
interface VideoDataset {
  id: string
  name: string
  selection: Selection[] // 'utvalg' setting
}
interface VideoStorages {
  kind: string
  path: string
}

export interface VideoSpec {
  dataset: Dataset
  selection: Selection[] // 'selection' as string array from PresetDataset
  user: User
  deviceStatus: DeviceStatus
}

export interface NameAndRole {
  name: string
  ltiUserID: string
  email: string
  roles: string[]
}
export interface VideoData {
  file: {
    mimeType: string
  }
  details: VideoDetailsData
  status: VideoStatusData
  users: VideoUsersData
  dataset: VideoDatasetData
  consents: string[]
  storages: VideoStorages[]
}

// Only Video class has 'status' in object
// eslint-disable-next-line
const instanceOfVideo = (object: any): object is Video => {
  return 'status' in object
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
  storages: VideoStorages[]

  constructor(data?: VideoData) {
    const id = uuid()
    this.details = {
      id,
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
      // encryptionIV: [], // This initial value is required for AES-GCM. The IV should never be reused
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
      isClassified: false,

      // Front end only (not saved at server)
      recordingExists: false,
      encryptionInProgress: false,
      decryptionInProgress: false,
      uploadInProgress: false,
      isUploaded: false,
      uploadProgress: 0,
      hasUnsavedChanges: false,
      hasNewDataAvailable: false,
    }
    this.users = {
      owner: '',
      ltiID: '',
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
    this.file = { mimeType: 'video/mp4' }

    if (data) {
      this.updateDetails(data.details)
      this.updateStatus(data.status)
      this.updateUsers(data.users)
      this.updateDataset(data.dataset)
      this.storages = data.storages
      this.consents = data.consents
      this.file = data.file
    }
  }

  // Create a Video using the current App state
  updateFromVideoSpec(data: VideoSpec): Video {
    this.updateDataset({
      id: data.dataset._id || '',
      name: data.dataset.name,
      selection: data.selection,
    })
    this.updateUsers({ owner: data.user._id, sharedWith: [], sharing: [] })
    this.storages = data.dataset.storages.map((storage) => ({
      kind: storage.kind,
      path: '',
    }))
    this.file = {
      mimeType:
        data.deviceStatus.browser === 'Chrome' ? 'video/webm' : 'video/mp4',
    }
    return this
  }

  // Upate from another Video class
  updateFromVideo(data?: Video): Video {
    if (data) {
      this.details = data.details
      this.status = data.status
      this.users = data.users
      this.dataset = data.dataset
      this.consents = data.consents
      this.storages = data.storages
      this.file.mimeType = data.file.mimeType
    }
    return this
  }

  // Update sections by given keys only
  updateDetails(details: VideoDetailsData): void {
    if (details.category) this.details.category = details.category
    if (details.created) this.details.created = new Date(details.created)
    if (details.description) this.details.description = details.description
    if (details.duration) this.details.duration = details.duration
    if (details.edl) this.details.edl = details.edl
    if (details.encryptionKey)
      this.details.encryptionKey = details.encryptionKey
    if (details.id) this.details.id = details.id
    if (details.name) this.details.name = details.name
  }
  updateStatus(status: VideoStatusData): void {
    if (status.decryptionInProgress)
      this.status.decryptionInProgress = status.decryptionInProgress
    if (status.error && status.error.errorInfo)
      this.status.error.errorInfo = status.error.errorInfo
    if (status.encryptionInProgress)
      this.status.encryptionInProgress = status.encryptionInProgress
    if (status.hasNewDataAvailable)
      this.status.hasNewDataAvailable = status.hasNewDataAvailable
    if (status.hasUnsavedChanges)
      this.status.hasUnsavedChanges = status.hasUnsavedChanges
    if (status.recordingExists)
      this.status.recordingExists = status.recordingExists
    if (status.inPipeline) this.status.inPipeline = status.inPipeline
    if (status.isClassified) this.status.isClassified = status.isClassified
    if (status.isConsented) this.status.isConsented = status.isConsented
    if (status.isEdited) this.status.isEdited = status.isEdited
    if (status.isEncrypted) this.status.isEncrypted = status.isEncrypted
    if (status.isUploaded) this.status.isUploaded = status.isUploaded
    if (status.main) this.status.main = status.main
  }
  updateUsers(users: VideoUsersData): void {
    if (users.owner) this.users.owner = users.owner
    if (users.sharedWith) this.users.sharedWith = users.sharedWith
    if (users.sharing) this.updateSharing(users.sharing)
  }
  updateSharing(sharing: VideoSharing[]): void {
    sharing.forEach((s) => {
      const share = this.users.sharing.find((us) => us._id === s._id)
      if (share) {
        share.access = s.access
        share.creator = s.creator
        share.title = s.title
        share.description = s.description
        share.comments = s.comments
        share.edl = s.edl
        share.users = s.users
      } else {
        console.log(`Share ${s._id} not found in user ID ${this.details.id}`)
      }
    })
  }
  updateDataset(dataset: VideoDatasetData): void {
    if (dataset.id) this.dataset.id = dataset.id
    if (dataset.name) this.dataset.name = dataset.name
    if (dataset.selection) this.dataset.selection = dataset.selection
  }

  // Convert this class to string representation
  // Note: the encryptionIV does not convert directly using JSON.stringify
  /* getAsString(): string {
    const v = { ...this }
    v.details.encryptionIV = ui8arr2str(this.details.encryptionIV)
    return JSON.stringify(v)
  } */

  // Convert this to a Plain Old Javascript Object
  get asPOJO(): unknown {
    return { ...this }
  }

  getFileUploadInfo(): string {
    const v = {
      details: { id: this.details.id },
      users: { owner: this.users.owner },
    }
    return JSON.stringify(v)
  }

  // Convert this class to a buffer suitable for encryption
  /* getAsBuffer(): ArrayBuffer {
    return str2ab(this.getAsString())
  } */

  // Set this video's data from a buffer value, used for decryption
  // Ensure that the encryptionIV is correctly converted
  /*   setFromBuffer(buffer: ArrayBuffer): void {
    const videoString = ab2str(buffer)
    const videoObject: VideoData = JSON.parse(videoString)
    if (videoObject.details.encryptionIV.length > 0) {
      videoObject.details.encryptionIV = str2ui8arr(
        videoObject.details.encryptionIV
      )
    }
    this.update(videoObject)
    this.details.created = new Date(this.created)
  } */
  // Create a copy of this video metadata
  /* clone() {
    const newVideo = new VideoMetadata({ video: this });
    return newVideo;
  } */
  // Set all local monitor booleans to false; Should be set after initial load from indexedDB
  falsifyAllMonitors(): void {
    this.status.encryptionInProgress = false
    this.status.decryptionInProgress = false
    this.status.uploadInProgress = false
    this.status.hasUnsavedChanges = false
  }
}
export interface DatasetSelection {
  title: string
  selection?: { [key: string]: DatasetSelection[] }
}
interface DatasetStatus {
  lastUpdated: Date
  lockedBy: string
}
interface DatasetConsent {
  kind: CONSENT_TYPES
}
interface DatasetUsers {
  owner: string
}
interface DatasetStorage {
  kind: VIDEO_STORAGE_TYPES
  groupId: string
  file: {
    name: string[]
  }
  category: string[]
}
export interface Selection {
  title: string
  keyName: string
}
export interface DatasetLock {
  date: Date
  selection: Selection
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
  selection: { [key: string]: DatasetSelection[] }
  selectionPriority: string[]
  storages: DatasetStorage[]

  constructor(data?: Dataset) {
    this._id = '' // undefined if a new dataset
    this.name = ''
    this.description = ''
    this.created = new Date()
    this.formId = ''
    this.status = {
      lastUpdated: new Date(),
      lockedBy: '',
    }
    this.consent = {
      kind: CONSENT_TYPES.manuel,
    }
    this.users = { owner: '' }
    this.selection = {}
    this.selectionPriority = []
    this.storages = []

    if (data) {
      this._id = data._id // undefined if a new dataset
      this.name = data.name
      this.description = data.description
      this.created = new Date(data.created)
      this.formId = data.formId
      this.status = {
        lastUpdated: new Date(data.status.lastUpdated),
        lockedBy: data.status.lockedBy,
      }
      this.consent = {
        kind: data.consent.kind || CONSENT_TYPES.manuel,
      }
      this.users = {
        owner: data.users.owner,
      }
      this.selection = data.selection
      this.selectionPriority = data.selectionPriority
      this.storages =
        data.storages.map((s: DatasetStorage) => {
          return {
            kind: s.kind || '',
            groupId: s.groupId || '',
            file: { name: s.file.name || [] },
            category: s.category || [],
          }
        }) || []
    }
  }

  /* get selection(): string[] {
    return this.selection.map((s) => `${s.keyName}:${s.title}`)
  } */
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
  prerequisiteCompleted: boolean
}
interface UserProfileGroup {
  id: string
  name: string
  role: string
}
interface UserProfile {
  username: string
  password: string
  fullName: string
  email: string
  oauthId: string
  reference: string // This should be sent to the client rather than _id
  groups: UserProfileGroup[] // Groups this user is a member of
  ltiUserId: string
}
export interface UserDatasetSelection {
  title: string
  keyName: string
}
export interface UserDatasetConfig {
  id: string
  currentSelection: Selection[]
  locks: Record<string, DatasetLock>
}
interface UserVideos {
  draftIDs: string[]
  removedDraftIDs: string[]
}
export class User {
  _id: string
  status: UserStatus
  profile: UserProfile
  datasetConfig: UserDatasetConfig
  videos: UserVideos

  constructor(data?: User) {
    this._id = ''
    this.status = {
      role: USER_ROLE.user,
      created: new Date(),
      provider: 'canvas', // Dataporten or Canvas ?
      lastLogin: new Date(),
      totalDrafts: 0,
      totalUploads: 0,
      totalTransfers: 0,
      prerequisiteCompleted: false,
    }
    this.profile = {
      username: 'initial user',
      password: '',
      fullName: 'initial user',
      email: '',
      oauthId: '',
      reference: '', // This should be sent to the client rather than _id
      groups: [],
      ltiUserId: '',
    }
    this.datasetConfig = {
      id: '',
      locks: {},
      currentSelection: [],
    }
    this.videos = {
      draftIDs: [],
      removedDraftIDs: [],
    }
    if (data) {
      this._id = data._id
      this.status = data.status
      this.profile = data.profile
      this.datasetConfig = {
        id: data.datasetConfig.id || '',
        currentSelection: data.datasetConfig.currentSelection || [],
        locks: data.datasetConfig.locks || {},
      }
      this.videos = {
        draftIDs: data.videos.draftIDs,
        removedDraftIDs: data.videos.removedDraftIDs || [],
      }
    }
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
  query?: Record<string, string | string[] | number>
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
