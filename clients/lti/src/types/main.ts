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
  datasetId: string
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

export interface SetData {
  id: string
  index: number
  displayMode: DISPLAY_MODE
  name: string
  description: string
  parent: Sett | undefined
  thumbnail: string
  consolidation: boolean
}

// Sett class should be extended to represent a Project's actual Sett shape
export class Sett {
  _id: string
  index: number
  displayMode: DISPLAY_MODE
  name: string
  description: string
  sets: Sett[] = []
  questions: Question[]
  consolidation?: boolean

  // Frontend only
  disabled = false
  parent?: Sett
  thumbnail = ''

  constructor(spec?: SetData, parent?: Sett) {
    this._id = spec ? spec.id : ''
    this.index = spec ? spec.index : 0
    this.name = spec ? spec.name : ''
    this.thumbnail = spec ? spec.thumbnail : ''
    this.description = spec ? spec.description : ''
    this.displayMode = spec ? spec.displayMode : DISPLAY_MODE.linear
    this.consolidation = spec ? spec.consolidation : false
    this.parent = parent ? parent : undefined
    this.questions = []
  }

  get root(): Sett {
    return this.parent ? this.parent : this
  }

  addQuestion(q: Question): void {
    this.questions.push(q)
  }
  clearQuestions(): void {
    this.questions.length = 0
  }
}

export interface QuestionData {
  id: string
  __typename: unknown
  type?: QUESTION_TYPES
  name: string
  thumbnail?: string
  recordAudio?: boolean
  flatData?: unknown
}

// When TypeScript can extend enums, this can be made generic..
export enum QUESTION_TYPES {
  question = 'question',
  mastery = 'mastery',
  picturebook = 'picturebook',
}

// Question class should be extended to represent a Project's actual Sett shape
export class Question {
  _id: string
  __typename: unknown // This string is used to generate components. The component name must match it
  type: QUESTION_TYPES // Frontend only - subclass type of this Question instance
  disabled = false
  parent?: Sett
  name: string
  thumbnail: string
  recordAudio: boolean

  constructor(spec: QuestionData, parent?: Sett) {
    this._id = spec.id
    this.__typename = spec.__typename
    this.type = spec.type ? spec.type : QUESTION_TYPES.question
    this.parent = parent ? parent : undefined
    this.name = spec.name
    this.recordAudio = !!spec.recordAudio
    this.thumbnail = spec.thumbnail || ''
  }
}

// ----------  Squidex response shapes --------------

// Data level of a Squidex GraphQL response. Can be supplied as single or array
// Extend this interface to represent different responses for various Sett and Question types
export interface CmsGQLData {
  __typename: string
  id?: string
  flatData?: Record<string, unknown>
  data?: Record<string, unknown>
}
// Shape of the Sett -> Question response
export interface CmsQuestionData extends CmsGQLData {
  flatData: {
    questions: CmsGQLData[]
  }
}

// Top level of a Squidex GrapghQL response
export interface CmsGQLQuery {
  data?: {
    results: CmsGQLData[] | CmsGQLData | CmsQuestionData
    M400?: CmsGQLData[]
    M401?: CmsGQLData[]
    M402?: CmsGQLData[]
    items?: CmsGQLData[]
  }
  errors?: []
  access_token?: string
}

// ---------------  User & Participant -----------------

interface ProgressData {
  itemId: string
  parentId: string
  completed?: boolean
  completions?: string[] | Date[]
  attempts?: string[] | Date[]
}
// Progress follows the flattened shape of CMS Sett and Question data
// meaning: Progress tracks the Participant's completion status on a particular Sett or Question
export class Progress {
  itemId: string // CMS ID of the tracked item
  parentId: string // CMS ID of the current parent of this item
  completed = false
  completions: Date[] = [] // Completions marked only if item was not previously completed
  attempts: Date[] = [] // Attempts on this item (increments if already completed, may be larger than completions[])

  constructor(data: ProgressData) {
    this.itemId = data.itemId
    this.parentId = data.parentId
    this.completed = !!data.completed
    if (data.parentId) this.parentId = data.parentId
    if (data.completions && data.completions.length > 0) {
      data.completions.forEach((cp: string | Date) => {
        this.completions.push(new Date(cp))
      })
    }
    if (data.attempts && data.attempts.length > 0) {
      data.attempts.forEach((cp: string | Date) => {
        this.attempts.push(new Date(cp))
      })
    }
  }

  // Return the most recent completion
  get latestCompletion(): Date {
    return this.completions[this.completions.length - 1]
  }

  // Return the most recent attempt
  get latestAttempt(): Date {
    return this.attempts[this.attempts.length - 1]
  }

  // Set this Progress to be 'completed'
  // Add a new timestamp for this completion
  // Returns the total current number of completions
  complete(): number {
    const newDate = new Date()
    if (!this.completed) {
      this.completed = true
      this.completions.push(newDate)
    }
    this.attempts.push(newDate)
    return this.completions.length
  }

  // Convert this to a Plain Old Javascript Object
  asPOJO(): ProgressData {
    const pojo = { ...this }
    return pojo
  }
}
export enum TRACKING_TYPE {
  interaction = 'interaction',
  question = 'question',
  set = 'set',
  mastery = 'mastery',
  picturebook = 'picturebook',
  all = 'all',
}
// TrackingData will store information about a 'usage' of a Question, Picture Book etc
export interface TrackingData {
  itemID: string // ID of the associated question or picturebook etc. (from Squidex CMS)
  participantID: string // ID of the associated Participant
  projectID: string // ID of the associated Project
  type: string

  // All other items are optional
  oid?: string // Unique key used to map this item
  created?: Date | string // should mark the start of the tracking
  duration?: number // should mark the end of the tracking in seconds, starting from 'created'
  audioFile?: string
  videoFile?: string
  details?: Record<string, unknown> // Holds any kind of extra data needed for the Tracking

  localSynced?: boolean // saved to disk locally
  serverSynced?: boolean // saved to our server
  storageSynced?: boolean // saved to TSD
}

export class Tracking {
  itemID: string // ID of the associated question, set or picturebook etc. (from Squidex CMS)
  participantID: string // ID of the associated Participant
  projectID: string // ID of the associated Project
  type: TRACKING_TYPE

  oid: string // Unique key used to map this item
  created: Date // the start of the tracking
  duration: number // should mark the end of the tracking in seconds, starting from 'created'
  audioFile?: string
  videoFile?: string
  details?: Record<string, unknown> // Holds any kind of data specific to the question type

  // Status
  localSynced: boolean // saved to disk locally
  serverSynced: boolean // saved to our server successfully
  storageSynced: boolean // sent to TSD successfully

  constructor(trackingdata: TrackingData) {
    this.itemID = trackingdata.itemID
    this.participantID = trackingdata.participantID
    this.projectID = trackingdata.projectID
    this.type = trackingdata.type as TRACKING_TYPE
    this.oid = trackingdata.oid ? trackingdata.oid : uuid()
    this.created = trackingdata.created
      ? new Date(trackingdata.created)
      : new Date()
    this.duration = trackingdata.duration ? trackingdata.duration : 0

    // Optional
    this.audioFile = trackingdata.audioFile
    this.videoFile = trackingdata.videoFile

    this.oid = trackingdata.oid ? trackingdata.oid : uuid()
    this.created = trackingdata.created
      ? new Date(trackingdata.created)
      : new Date()

    this.localSynced = !!trackingdata.localSynced
    this.serverSynced = !!trackingdata.serverSynced
    this.storageSynced = !!trackingdata.storageSynced
  }

  // Complete this Tracking by setting its duration and possibly 'data'
  complete(): void {
    const startDate = moment(this.created)
    const endDate = moment()
    this.duration = endDate.diff(startDate, 'seconds')
  }

  // Convert this to a Plain Old Javascript Object
  asPOJO(): unknown {
    const pojo = { ...this }
    return pojo
  }
}
export interface ParticipantData {
  _id?: string
  consent?: {
    id?: string
    state?: string
  }
  location?: {
    name: string
  }
  mastery?: {
    active: boolean
    showSets: boolean
    redoTasks: boolean
    allowedSets: string[] | undefined
  }
  profile?: {
    ref?: string
    name?: string
    thumbnail?: string
    colour?: string
    avatar?: AvatarLayout
  }
  progress?: {
    lastAdjustedByAdmin?: Date | string
    records?: Record<string, ProgressData>
  }
  project?: {
    id: string
    lastSync?: Date
    shuffleTopLevel: boolean
    topLevelOrder: string[] // Order of top level item IDs (excluding mastery), as they may be shuffled before first use
  }
}
export interface SpecialRequestData {
  participant: ParticipantData
  data: Record<string, Record<number, { total: number; correct: number }>>
}

export enum SPECIAL_REQUEST_TYPE {
  successresults = 'successresults',
}
export class Participant {
  _id = ''
  consent: {
    state: string
    id: string
  }
  location: {
    name: string
  }
  mastery: {
    active: boolean // Enables control of participant's progress across Sets
    showSets: boolean // Shows additional Mastery sets, creating Baseline and Probes
    redoTasks: boolean // If the Participant can re-do already completed tasks. NOTE: This affects judgement of 'Set completion'
    // allowedSets can also be configured by Monitor to deliberately prevent progression
    allowedSets: string[] // IDs of the accessible Sets(setID)
  }
  profile: {
    ref: string
    name: string
    avatar: AvatarLayout
    colour: string
    thumbnail: string
  }
  progress: {
    lastAdjustedByAdmin: Date | undefined
    // progress is referenced by ID of the data model involved (e.g. question ID)
    records: Map<string, Progress>
  }
  project: {
    id: string
    lastSync: Date | undefined
    shuffleTopLevel: boolean
    topLevelOrder: string[] // Order of top level item IDs (excluding mastery), as they may be shuffled before first use
  }

  // Front end control
  selected = false

  // PRIVATE member to update progress class attribute
  // using 'private' keyword causes problems with TS compile..
  updateProgress(data: ParticipantData | Participant): void {
    if (data.progress) {
      this.progress.lastAdjustedByAdmin = data.progress.lastAdjustedByAdmin
        ? new Date(data.progress.lastAdjustedByAdmin)
        : undefined

      if (data.progress.records) {
        if (data instanceof Participant) {
          this.progress.records = data.progress.records
        } else {
          for (const pKey in data.progress.records) {
            if (data.progress.records[pKey]) {
              const d = data.progress.records[pKey]
              this.progress.records.set(pKey, new Progress(d))
            }
          }
        }
      }
    }
  }

  updateData(data: ParticipantData | Participant): void {
    this.location.name =
      data.location && data.location.name ? data.location.name : ''
    if (data.mastery) {
      this.mastery.active = !!data.mastery.active
      this.mastery.showSets = !!data.mastery.showSets
      this.mastery.redoTasks = !!data.mastery.redoTasks
      this.mastery.allowedSets = data.mastery.allowedSets || []
    }
    if (data.project) {
      this.project.id = data.project.id || ''
      this.project.shuffleTopLevel = !!data.project.shuffleTopLevel
      this.project.topLevelOrder = data.project.topLevelOrder || []
      this.project.lastSync = data.project.lastSync
    }
    if (data.profile) {
      this.profile.ref = data.profile.ref ? data.profile.ref : ''
      this.profile.thumbnail = data.profile.thumbnail
        ? data.profile.thumbnail
        : ''
      this.profile.colour =
        data.profile.colour ||
        taskColours[Math.floor(Math.random() * taskColours.length)]
      this.profile.name = data.profile.name
        ? data.profile.name
        : data.profile.ref
        ? data.profile.ref
        : data._id
        ? data._id.substring(0, 6) + '...'
        : 'unknown ID'
      if (data.profile.avatar) {
        this.profile.avatar = {
          eyeShape: data.profile.avatar.eyeShape || '0',
          eyeColour: data.profile.avatar.eyeColour || '#000000',
          hairShape: data.profile.avatar.hairShape || '13',
          hairColour: data.profile.avatar.hairColour || '#010300',
          skinColour: data.profile.avatar.skinColour || '#EFD5CE',
          noseShape: data.profile.avatar.noseShape || '2',
          lipColour: data.profile.avatar.lipColour || '#000000',
          accessories: data.profile.avatar.accessories || '13',
        }
      }
    }
    if (data.consent) {
      this.consent.state = data.consent.state ? data.consent.state : ''
      this.consent.id = data.consent.id ? data.consent.id : ''
    }
  }

  constructor(data?: ParticipantData | Participant) {
    this._id = data && data._id ? data._id : ''
    this.location = { name: '' }
    this.consent = {
      id: '',
      state: '',
    }
    this.profile = {
      ref: '',
      name: '',
      colour: '',
      thumbnail: '',
      avatar: {
        eyeShape: '0',
        eyeColour: '#000000',
        hairShape: '13',
        hairColour: '#010300',
        skinColour: '#EFD5CE',
        noseShape: '2',
        lipColour: '#000000',
        accessories: '13',
      },
    }
    this.mastery = {
      active: false,
      showSets: false,
      redoTasks: false,
      allowedSets: [],
    }
    this.progress = {
      records: new Map(),
      lastAdjustedByAdmin: undefined,
    }
    this.project = {
      id: '',
      shuffleTopLevel: true,
      topLevelOrder: [],
      lastSync: undefined,
    }
    if (data && data.profile) this.updateData(data)
    if (data && data.progress) this.updateProgress(data)
  }

  get restrictProgress(): boolean {
    return this.mastery.active
  }
  get allowRedoTasks(): boolean {
    return this.mastery.redoTasks
  }
  get showMasterySets(): boolean {
    return this.mastery.showSets
  }

  // Convert this to a Plain Old Javascript Object
  asPOJO(): unknown {
    const records: Record<string, ProgressData> = {}
    if (this.progress.records) {
      const progressArray = Array.from(this.progress.records.entries())
      progressArray.forEach((p) => {
        const [key, prog] = p
        records[key] = prog.asPOJO()
      })
    }
    const progress = {
      records,
      lastAdjustedByAdmin: this.progress.lastAdjustedByAdmin,
    }
    const pojo = { ...this, progress }
    return pojo
  }

  // Server response or Monitor update
  update(data: ParticipantData | Participant): void {
    this.updateProgress(data)
    this.updateData(data)
  }

  // Return the current number of completions for a given item
  // supplied IDs should be the ids of CMS objects
  itemAttempts(itemId: string, parentId: string): number {
    const id = itemId + (parentId ? ':' + parentId : '')
    if (this.progress.records.has(id)) {
      const p = this.progress.records.get(id) as Progress
      return p.attempts.length
    } else return 0
  }

  // Return the current number of completions for a given item
  // supplied IDs should be the ids of CMS objects
  itemCompletions(itemId: string, parentId: string): number {
    const id = itemId + (parentId ? ':' + parentId : '')
    if (this.progress.records.has(id)) {
      const p = this.progress.records.get(id) as Progress
      return p.completions.length
    } else return 0
  }

  // Return the 'completed' boolean status for a given item
  itemIsComplete(itemId: string, parentId: string): boolean {
    const id = itemId + (parentId ? ':' + parentId : '')
    return !!(
      this.progress.records.has(id) && this.progress.records.get(id)?.completed
    )
  }

  // Return the most recent completion date for the given ID
  // itemId & parentId should be the IDs of CMS Sett or Question objects
  latestCompletionDate(itemId: string, parentId: string): Date | undefined {
    const id = itemId + (parentId ? ':' + parentId : '')
    if (this.progress.records.has(id)) {
      const p = this.progress.records.get(id) as Progress
      return p.latestCompletion
    } else return
  }

  // Return the most recent attempt date for the given item
  // itemId & parentId should be the IDs of CMS Sett or Question objects
  latestAttemptDate(itemId: string, parentId: string): Date | undefined {
    const id = itemId + (parentId ? ':' + parentId : '')
    if (this.progress.records.has(id)) {
      const p = this.progress.records.get(id) as Progress
      return p.latestAttempt
    } else return
  }

  // Get or create a Progress, and return it
  // itemId: the CMS ID of a Sett or Question
  // returns: Current number of attempts at this item
  createProgress(itemId: string, parentId: string): Progress {
    let p: Progress
    const id = itemId + (parentId ? ':' + parentId : '')
    if (this.progress.records.has(id)) {
      p = this.progress.records.get(id) as Progress
    } else {
      p = new Progress({ itemId, parentId })
      this.progress.records.set(id, p)
    }
    return p
  }

  // Get a Progress item and mark as completed
  // itemId: the CMS ID of a Sett or Question
  // returns: Current number of attempts at this item
  completeProgress(itemId: string, parentId: string): number {
    const p = this.createProgress(itemId, parentId)
    return p.complete()
  }
}

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
  _id: string
  username: string
  fullName: string
  email: string
  role: USER_ROLE
  participants: Participant[] = [] // NOTE: Participants are worked with in their own Store
  projects: Project[] = []
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

export interface AvatarLayout {
  eyeShape: string
  eyeColour: string
  hairShape: string
  hairColour: string
  skinColour: string
  noseShape: string
  lipColour: string
  accessories: string
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
    | Participant
    | Project
    | ParticipantData
    | TrackingData
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
