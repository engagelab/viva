/*
 Designed and developed by Richard Nesnass & Sharanya Manivasagam
*/
const router = require('express').Router()
const utilities = require('../../utilities')
const Dataset = require('../../models/Dataset')
const Video = require('../../models/Video')
const User = require('../../models/User')
const { userRoles, consentTypes } = require('../../constants')

/* ---------------- Setting activities ---------------- */

// Modifies the given utvalg setup in place
const updateSelection = ({ path, newName, selectionKeys, selection }) => {
  let selectedUtvalg = selection

  // Find the correct level to insert
  let currentUtvalgKey = selectionKeys[0]
  if (!currentUtvalgKey) return
  path.forEach((title, index) => {
    selectedUtvalg = selectedUtvalg[currentUtvalgKey].find(
      (u) => u.title == title
    )
    currentUtvalgKey = selectionKeys[index + 1]
  })

  // Add an empty array for the new Utvalg if it is missing
  if (!selectedUtvalg[currentUtvalgKey]) selectedUtvalg[currentUtvalgKey] = []

  // Add an empty placeholder array for the next utvalg below, if needed
  const newItem = { title: newName }
  if (path.length + 1 < selectionKeys.length) {
    const nextKeyDown = selectionKeys[path.length + 1]
    newItem[nextKeyDown] = []
  }
  selectedUtvalg[currentUtvalgKey].push(newItem)
}

const fetchVideosForDatasets = (datasets) => {
  const datasetIds = datasets.map((d) => d._id)
  const query = { datasetId: { $in: datasetIds } }
  const populateUser = [{ path: 'userId', select: ['profile.username'] }]
  return new Promise((resolve, reject) => {
    Video.find(query, (error, videos) => {
      if (error) reject(error)
      resolve(videos)
    }).populate(populateUser)
  })
}

const fetchUsersWithDraftVideos = () => {
  return new Promise((resolve, reject) => {
    const query = {
      'videos.draftIDs': { $exists: true, $ne: [] },
    }
    User.find(query, 'profile.username videos.draftIDs', (error, users) => {
      if (error) reject(error)
      resolve(users)
    })
  })
}

// Get datasets for the current user
// If admin, also get Users with outstanding drafts, and video listing
router.get('/datasets', utilities.authoriseUser, (request, response, next) => {
  const u = response.locals.user
  const groupIds = u.profile.groups.map((g) => g.id)
  const isAdmin = utilities.hasMinimumUserRole(
    response.locals.user,
    userRoles.admin
  )
  let query = {}
  if (isAdmin) {
    query = { 'users.owner': u._id }
  } else {
    query.$and = [
      {
        $or: [
          { 'users.dataportenGroups': { $in: groupIds } },
          { 'users.canvasGroups': { $in: groupIds } },
        ],
      },
      { 'status.active': true },
    ]
  }

  Dataset.find(query, async (error, ds) => {
    if (error) return next(error)
    const datasets = ds.map((d) => d.redacted())
    if (isAdmin) {
      fetchVideosForDatasets(ds).then((vs) => {
        const videos = vs.map((v) => v.redacted())
        fetchUsersWithDraftVideos().then((dus) => {
          const draftUsers = dus.map((du) => du.redacted())
          response.send({ datasets, videos, draftUsers })
        })
      })
    } else response.send(datasets)
  })
})

// CREATE a dataset
router.post('/dataset', utilities.authoriseUser, (request, response, next) => {
  let dataset = request.body
  const u = response.locals.user
  dataset.users.owner = u.profile.username
  Dataset.create(dataset)
    .then((newDataset) => response.send(newDataset))
    .catch((error) => next(error))
})

// UPDATE dataset selection (for all users)
router.put(
  '/dataset/selection',
  utilities.authoriseUser,
  (request, response, next) => {
    Dataset.findById(request.body._id, async (error, foundDataset) => {
      if (error || !foundDataset)
        next(error || new Error({ status: 400, message: 'datasett not found' }))
      else {
        const d = foundDataset
        updateSelection({
          selection: d.selection,
          path: request.body.path,
          name: request.body.name,
          selectionKey: d.selectionPriority,
        })
        d.lastUpdated = Date.now()
        d.markModified('selection')
        d.save((saveError) => {
          if (saveError) return next(saveError)
          response.end()
        })
      }
    })
  }
)

// UPDATE a dataset (for admin users)
// Supply the dataset or just the id in request.body
router.put('/dataset', utilities.authoriseUser, (request, response, next) => {
  const updatedDataset = request.body
  const isAdmin = utilities.hasMinimumUserRole(
    response.locals.user,
    userRoles.admin
  )
  if (!isAdmin) return next(new Error('Unauthorised'))
  Dataset.findById(updatedDataset._id, async (error, d) => {
    if (error || !d)
      next(error || new Error({ status: 400, message: 'datasett not found' }))
    const updateIsNewer = Date(updatedDataset.lastUpdated) > d.lastUpdated
    if (updateIsNewer) {
      d.name = updatedDataset.name
      d.lastUpdated = Date.now()
      d.description = updatedDataset.description
      d.users = updatedDataset.users
      d.storages = updatedDataset.storages
      d.consent = updatedDataset.consent
      d.status.active = updatedDataset.status.active
      d.formId =
        updatedDataset.consent == consentTypes.samtykke
          ? updatedDataset.formId
          : ''
      d.selectionPriority = updatedDataset.selectionPriority
      d.selection = updatedDataset.selection
      d.save((saveError, savedDataset) => {
        if (saveError) return next(saveError)
        response.send(savedDataset)
      })
    } else next(new Error(`${d.name} not updated, dataset not latest version`))
  })
})

module.exports = router
