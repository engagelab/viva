import utilities from '../../api/utilities'
// This class created to control instantiation, correct conversion of crypto vars, and cloning
export default class VideoMetadata {
  constructor (spec) {
    if (spec) {
      const v = spec.video || {}
      const s = spec.setting || {}
      const u = spec.user || {}
      const d = spec.deviceStatus || {}
      const subState = v.subState || {}
      const serverState = v.serverState || {}

      this.aId = utilities.uuid()

      this.fileId = v.fileId || utilities.uuid()
      this.settingId = v.settingId || s.id
      this.status = v.status || 'draft'
      this.storages =
        v.storages || (s && s.storages ? s.storages.map(st => st.name) : [])
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
