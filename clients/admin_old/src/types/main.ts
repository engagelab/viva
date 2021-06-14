import moment from 'moment'
import { uuid } from '@/utilities'
import { USER_ROLE, taskColours } from '@/constants'

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

// This defined the additional functions available on a Question Type component
// This allows Question.vue to control the question type child
// The child should implement appropriate code that runs when these functions are called
/* export interface AugmentedQuestionType extends Vue {
  forwardInternal: () => void // Called when the user clicks the white 'forward' arrow
  onIntroductionStart: () => void // Called when introduction begins
  onIntroductionEnd: () => void // Called when introduction ends
} */

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

interface ProjectData {
  _id?: string
  interventionName?: string
  tsdGroupName: string
  tsdGroupID: string
  // Front-end use only
  selected?: boolean
}
export class Project implements ProjectData {
  _id: string
  interventionName: string
  tsdGroupName: string
  tsdGroupID: string

  // Front-end use only
  selected: boolean

  constructor(data?: ProjectData) {
    this._id = data && data._id ? data._id : ''
    this.interventionName =
      data && data.interventionName ? data.interventionName : ''
    this.tsdGroupName = data && data.tsdGroupName ? data.tsdGroupName : ''
    this.tsdGroupID = data && data.tsdGroupID ? data.tsdGroupID : ''
    // Front end variables
    this.selected = data && data.selected ? data.selected : false
  }

  update(project: Project): void {
    this._id = project._id
    this.interventionName = project.interventionName

    // Front end variables
    this.selected = project.selected
  }

  // Convert this to a Plain Old Javascript Object
  asPOJO(): unknown {
    const pojo = { ...this }
    delete pojo.selected
    return pojo
  }
}

///-------------------------Viva vide and dataset model -----------------/

// We need only file Id ,metadata  and sharing info for viva in canvas
export interface DatasetInfoData {
  name: string
  utvalg: []
}

export interface SharingData {
  users: []
  access: boolean
  // edl: {
  //   start: string
  //   end: string
  // }
  description: string
}
export interface VideoData {
  fileId: string
  description: string
  category: string
  name: string
  datasetInfo: DatasetInfoData
  duration: number
  consents: string[] // Array of consenters
  sharing: SharingData
}

export class Video {
  fileId: string
  description: string
  category: string
  name: string
  datasetInfo: DatasetInfoData
  duration: number
  consents: string[] // Array of consenters
  sharing: SharingData

  constructor(data?: VideoData) {
    this.fileId = data?.fileId ? data.fileId : ''
    this.description = data?.description ? data.description : ''
    this.category = data?.category ? data.category : ''
    this.name = data?.name ? data.name : ''
    this.duration = data?.duration ? data.duration : 0
    this.datasetInfo = data?.datasetInfo
      ? data.datasetInfo
      : {
          name: '',
          utvalg: [],
        }
    this.consents = data?.consents ? data.consents : []
    this.sharing = data?.sharing
      ? data.sharing
      : {
          users: [],
          access: false,
          // edl.start: data.sharing.edl.start || ''
          // edl.end: data.sharing.edl.end || ''
          //edl: data.sharing.edl
          description: '',
        }
  }
}

export interface DataManagerData {
  oAuthId: string
  name: string
}
export interface PathData {
  path: []
  filename: []
}
// When TypeScript can extend enums, this can be made generic..
export enum VIDEOSTORAGE_TYPES {
  none = 'none',
  lagringshotel = 'lagringshotel',
  cloudian = 'cloudian',
  gdrive = 'gdrive',
}
export enum CONSENT_SELECTION {
  samtykke = 'samtykke',
  manuel = 'manuel',
  article6 = 'article6',
}
export interface StorageData {
  name: VIDEOSTORAGE_TYPES
  groupId: string
  storagePath: PathData
  category: []
}
export interface DatasetData {
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
  datasetId = ''
  name = ''
  description = ''
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
    this.datasetId = data?.datasetId ? data.datasetId : ''
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
// ---------------  Base CMS model classes ------------------
// --- Extend these to represent real Squidex model types ---

export enum DISPLAY_MODE {
  linear = 'linear',
  shuffle = 'shuffle',
  mastery = 'mastery',
}

// ---------------  User & Participant -----------------
export interface UserData {
  _id: string
  username: string
  fullName: string
  email: string
  role: USER_ROLE
  participants: ParticipantData[]
  projects: ProjectData[]
  location: {
    name: string
  }
  lastLogin: Date
  currentProjectId: string
}
export class User {
  username: string
  fullName: string
  reference: string
  encryptionKey: string
  draftMetadataIDs: []
  datasett: Dataset

  _id: string
  username: string
  fullName: string
  email: string
  role: USER_ROLE
  location: {
    name: string
  }
  lastLogin: Date | undefined
  currentProjectId: string

  constructor(data?: UserData | User) {
    this._id = data ? data._id : ''
    this.username = data ? data.username : ''
    this.fullName = data ? data.fullName : ''
    this.email = data ? data.email : ''
    this.lastLogin =
      data && data.lastLogin ? new Date(data.lastLogin) : undefined
    this.role = data ? data.role : USER_ROLE.user
    this.participants = []
    if (data) {
      data.participants.forEach((pr: ParticipantData | Participant) => {
        const newParticipant = new Participant(pr)
        this.participants.push(newParticipant)
      })
    }
    this.projects = []
    this.location = { name: '' }
    this.location.name =
      data && data.location && data.location.name ? data.location.name : ''
    if (data) {
      data.projects.forEach((pr: ProjectData) => {
        const newProject = new Project(pr)
        newProject.selected = data.currentProjectId === pr._id
        this.projects.push(newProject)
      })
    }
    this.currentProjectId = data ? data.currentProjectId : ''
  }

  public update(user: UserData | User): void {
    this._id = user._id
    this.username = user.username
    this.fullName = user.fullName
    this.email = user.email
    this.lastLogin = user.lastLogin ? new Date(user.lastLogin) : undefined
    this.role = user.role
  }

  // Convert this to a Plain Old Javascript Object
  asPOJO(): unknown {
    const participants: unknown[] = []
    if (this.participants) {
      const paArray = Array.from(this.participants.values())
      paArray.forEach((p) => {
        participants.push(p.asPOJO())
      })
    }
    const projects: unknown[] = []
    if (this.projects) {
      const prArray = Array.from(this.projects.values())
      prArray.forEach((pr) => {
        projects.push(pr.asPOJO())
      })
    }
    const pojo = { ...this, participants, projects }
    return pojo
  }
}

// -------------- Other UI Types ---------------

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
  body?: unknown | string | User | Project | FormData
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
