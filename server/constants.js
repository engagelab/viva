const videoStatusTypes = {
  premeta: 'premeta', // Pre-stage when awaiting linking of file upload to complete uploaded metadata in DB
  uploaded: 'uploaded', // First pipeline state after file was uploaded
  decrypted: 'decrypted', // (Currently unused)
  converted: 'converted', // Video was converted by FFMPEG, ready to be sent to storage(s)
  edited: 'edited', // Video was saved to Lagringshotell. Video is ready to be transferred to another location.
  complete: 'complete', // Video has now been uploaded, decrypted, trimmed/watermarked, saved and transferred to another location. This is the LAST pipeline stage
  error: 'error' // Something went wrong. Videos in this state will not move further in the pipeline until attended to
}

// Used to ensure correct folders exist for moving videos through the pipeline
const videoFolderNames = {
  uploaded: 'uploaded',
  decrypted: 'decrypted',
  edited: 'edited',
  complete: 'complete',
  error: 'error'
}

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
const pipelineStates = ['uploaded', 'decrypted', 'converted'] // Subset of videoStatusTypes

const pipelineErrorMessages = {
  'uploaded': 'Error decrypting video',
  'decrypted': 'Error editing video',
  'converted': 'Error copying video'
}

const videoStorageTypes = {
  none: 'none',
  google: 'google',
  onedrive: 'onedrive',
  lagringshotell: 'lagringshotell'
}

const samtykke = {
  samtykke: 'samtykke',
  manuel: 'manuel',
  article6: 'article6',

}

const executables = {
  ffmpeg: 'ffmpeg',
  rm: 'rm'
}

const adminUsers = [
  'richarne',
  'eva_student',
  'tkthores',
  'sharanym',
  'Jan ElevVGS Olsen',
  'olesm'
]

const pilotDatasett = []

const pilotUsers = [
  { id: '592075', username: 'smalgeno', email: 'smalgeno@student.uv.uio.no' },
  { id: '593274', username: 'madeleoa', email: 'madeleoa@student.uv.uio.no' },
  { id: '592822', username: 'rlbarren', email: 'rlbarren@student.uv.uio.no' },
  { id: '592832', username: 'ivar.bjorland', email: 'ivar.bjorland@uv.uio.no' },
  {
    id: '560091',
    username: 's.j.blokkhus',
    email: 's.j.blokkhus@admin.uio.no'
  },
  { id: '593251', username: 'marticar', email: 'marticar@student.uv.uio.no' },
  { id: '593229', username: 'annkch', email: 'annkch@student.uv.uio.no' },
  { id: '571419', username: 'diname', email: 'diname@student.uv.uio.no' },
  { id: '592863', username: 'marteeel', email: 'marteeel@student.uv.uio.no' },
  { id: '592856', username: 'marihafs', email: 'marihafs@student.uv.uio.no' },
  { id: '592072', username: 'ellenham', email: 'ellenham@student.uv.uio.no' },
  { id: '593265', username: 'suzanemh', email: 'suzanemh@student.uv.uio.no' },
  { id: '593226', username: 'veronhem', email: 'veronhem@student.uv.uio.no' },
  { id: '593273', username: 'einarliv', email: 'einarliv@student.uv.uio.no' },
  { id: '592057', username: 'amaliemk', email: 'amaliemk@student.uv.uio.no' },
  { id: '592353', username: 'valentk', email: 'valentk@student.uv.uio.no' },
  { id: '574359', username: 'kathakr', email: 'kathakr@student.uv.uio.no' },
  { id: '592826', username: 'ranveik', email: 'ranveik@student.uv.uio.no' },
  { id: '593219', username: 'emilieak', email: 'emilieak@student.uv.uio.no' },
  { id: '593301', username: 'olgaoli', email: 'olgaoli@student.uv.uio.no' },
  { id: '592845', username: 'alexalok', email: 'alexalok@student.uv.uio.no' },
  { id: '593247', username: 'bredema', email: 'bredema@student.uv.uio.no' },
  { id: '581075', username: 'agonm', email: 'agonm@student.uv.uio.no' },
  { id: '580182', username: 'hannmael', email: 'hannmael@student.uv.uio.no' },
  { id: '593304', username: 'malenemp', email: 'malenemp@student.uv.uio.no' },
  { id: '555978', username: 'larstr', email: 'larstr@student.uv.uio.no' },
  { id: '593216', username: 'eliselr', email: 'eliselr@student.uv.uio.no' },
  { id: '578837', username: 'sarapri', email: 'sarapri@student.uv.uio.no' },
  { id: '593306', username: 'gurorul', email: 'gurorul@student.uv.uio.no' },
  { id: '568114', username: 'timmse', email: 'timmse@student.uv.uio.no' },
  { id: '593267', username: 'elinslet', email: 'elinslet@student.uv.uio.no' },
  { id: '583026', username: 'svenow', email: 'svenow@student.uv.uio.no' },
  { id: '593223', username: 'inekw', email: 'inekw@student.uv.uio.no' },
  { id: '542726', username: 'theaoi', email: 'theaoi@student.uv.uio.no' },
  { id: '542727', username: 'gretag', email: 'g.b.gudmundsdottir@ils.uio.no' },
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
    email: 'anne_laerervgs@test.feide.no'
  },
  {
    id: '10',
    username: 'daniel_laerervgs',
    email: 'daniel_laerervgs@test.feide.no'
  },
  { id: '11', username: 'tkthores', email: 'tkthores@uio.no' },
  { id: '12', username: 'janad', email: 'janad@uio.no' },
  { id: '13', username: 'olesm', email: 'olesm@uio.no' },
  { id: '14', username: 'torunna', email: 'torunna@uio.no' },
  { id: '15', username: 'simenjb', email: 'simenjb@uio.no' },
  { id: '16', username: 'mariesth', email: 'mariesth@uio.no' }
]

module.exports = {
  videoStatusTypes,
  videoStorageTypes,
  pipelineStates,
  pipelineErrorMessages,
  videoFolderNames,
  executables,
  adminUsers,
  pilotDatasett,
  pilotUsers,
  samtykke
}
