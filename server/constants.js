const videoStatusTypes = {
  premeta: 'premeta', // Pre-stage when awaiting linking of file upload to complete uploaded metadata in DB
  uploaded: 'uploaded', // First pipeline state after file was uploaded
  decrypted: 'decrypted', // (Currently unused)
  edited: 'edited', // Video was converted by FFMPEG, ready to be sent to storage(s)
  stored: 'stored', // If Google storage exists, video is ready to be transferred there. If not, video changes to 'complete'
  complete: 'complete', // Video has now been uploaded, decrypted, trimmed/watermarked, saved and transferred to another location.
  //This state means there is no more work to do, so the video should finally be removed here
  error: 'error', // Something went wrong. Videos in this state will not move further in the pipeline until attended to
}

// Used to ensure correct folders exist for moving videos through the pipeline
const videoFolderNames = {
  uploaded: 'uploaded',
  decrypted: 'decrypted',
  edited: 'edited',
  stored: 'stored',
  complete: 'complete',
  error: 'error',
  thumbnails: 'thumbnails'
}

const userRolesAsArray = process.env.VUE_APP_USER_ROLES.split(',')
const userRoles = {
  user: 'user',
  monitor: 'monitor',
  admin: 'admin',
}
// Constants used both front and back end should be checked for consistency like this:
userRolesAsArray.forEach((ur) => {
  if (!userRoles[ur])
    console.error('constants.js > userRoles mismatch with env file')
})

// The pipeline does work on a video when the video has the following status:
// These should be listed in correct order of operation, as the next status is based on list order
// 'uploaded': video is about to be decrypted if necessary
//   -- on begin, video is found in 'uploaded' folder
//   -- on success, video is moved to 'decrypted' folder
// 'decrypted': video is about to be edited and watermarked
//   -- on begin, video is found in 'decrypted' folder
//   -- on sucess, new video is saved to 'edited' and removed from 'decrypted' folder
// 'converted': video is about to be copied automatically to specified storages, excluding Google Drive (final user storage)
//   -- on begin, video is found in 'edited' folder
//   -- on success, video is copied to specified storages and remains stored in 'edited' folder
// ** The final transfer to Google Drive is initiated by the user, not the pipeline **
//   -- on success, video is moved to 'complete' folder
const pipelineStates = ['uploaded', 'decrypted', 'edited', 'stored'] // Subset of videoStatusTypes

const pipelineErrorMessages = {
  uploaded: 'Error decrypting video',
  decrypted: 'Error editing video',
  edited: 'Error storing video',
  stored: 'Error cleaning up video',
}

const videoStorageTypes = {
  none: 'none',
  google: 'google',
  onedrive: 'onedrive',
  educloud: 'educloud',
  lagringshotell: 'lagringshotell',
}

const videoSharingStatusTypes = {

}

const consentTypes = {
  samtykke: 'samtykke',
  manual: 'manual',
  article6: 'article6',
}

const executables = {
  ffmpeg: 'ffmpeg',
  rm: 'rm',
}

const adminUsers = [
  'richarne',
  'eva_student',
  'tkthores',
  'sharanym',
  'Jan ElevVGS Olsen',
  'olesm',
]

const platforms = {
  canvas: 'canvas',
  dataporten: 'dataporten',
}
const organizations = {
  uio: {
    name: 'uio',
    dc: ['uio'], // Explicit list of names to match against   https://innsyn.feide.no/aboutme
    ou: [], // List of sub-org names to match against
    platform: platforms.canvas,
  },
  usn: {
    name: 'usn',
    dc: ['uio'], // Explicit list of names to match against   https://innsyn.feide.no/aboutme
    ou: [], // List of sub-org names to match against
    platform: platforms.canvas,
  },
  ntnu: {
    name: 'ntnu',
    dc: ['uio'], // Explicit list of names to match against   https://innsyn.feide.no/aboutme
    ou: [], // List of sub-org names to match against
    platform: platforms.canvas,
  },
  other: {
    name: 'other',
    dc: ['uio'], // Explicit list of names to match against   https://innsyn.feide.no/aboutme
    ou: [], // List of sub-org names to match against
    platform: platforms.dataporten,
  },
}

const pilotDataset = []

const pilotUsers = [
  { id: '592075', username: 'smalgeno', email: 'smalgeno@student.uv.uio.no' },
  { id: '593274', username: 'madeleoa', email: 'madeleoa@student.uv.uio.no' },
  { id: '592822', username: 'rlbarren', email: 'rlbarren@student.uv.uio.no' },
  { id: '592832', username: 'ivar.bjorland', email: 'ivar.bjorland@uv.uio.no' },
  {
    id: '560091',
    username: 's.j.blokkhus',
    email: 's.j.blokkhus@admin.uio.no',
  },
  { id: '1', username: 'eva_student', email: 'eva_student@.uio.no' },
  { id: '2', username: 'richarne', email: 'richarne@uio.no' },
  { id: '3', username: 'sharanym', email: 'sharanym@uio.no' },
  { id: '4', username: 'hoangbn', email: 'hoangbn@uio.no' },
  { id: '5', username: 'asbjorn_elevg', email: 'asbjorn_elevg@uio.no' },
  { id: '52', username: 'noreply', email: 'noreply@feide.uio.no' },
  { id: '6', username: 'bjorg_laererg', email: 'bjorg_laererg@uio.no' },
  { id: '7', username: 'cecilie_elevvgs', email: 'cecilie_elevvgs@uio.no' },
  { id: '8', username: 'david_laerervgs', email: 'david_laerervgs@uio.no' },
  { id: '9', username: 'frank_foreleser', email: 'frank_foreleser@uio.no' },
  { id: '10', username: 'ann_elevg', email: 'ann_elevg@test.feide.no' },
  { id: '10', username: 'alf_elevg', email: 'alf_elevg@test.feide.no' },
  { id: '10', username: 'jan_elevvgs', email: 'jan_elevvgs@test.feide.no' },
  {
    id: '10',
    username: 'anne_laerervgs',
    email: 'anne_laerervgs@test.feide.no',
  },
  {
    id: '10',
    username: 'daniel_laerervgs',
    email: 'daniel_laerervgs@test.feide.no',
  },
  { id: '11', username: 'tkthores', email: 'tkthores@uio.no' },
  { id: '12', username: 'janad', email: 'janad@uio.no' },
  { id: '13', username: 'olesm', email: 'olesm@uio.no' },
  { id: '14', username: 'torunna', email: 'torunna@uio.no' },
  { id: '15', username: 'simenjb', email: 'simenjb@uio.no' },
  { id: '16', username: 'mariesth', email: 'mariesth@uio.no' },
]

module.exports = {
  videoStatusTypes,
  videoSharingStatusTypes,
  videoStorageTypes,
  pipelineStates,
  pipelineErrorMessages,
  videoFolderNames,
  executables,
  adminUsers,
  pilotDataset,
  pilotUsers,
  consentTypes,
  userRoles,
  platforms,
  organizations,
}
