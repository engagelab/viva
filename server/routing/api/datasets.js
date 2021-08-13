/*
 Designed and developed by Richard Nesnass & Sharanya Manivasagam
*/
const router = require('express').Router()
const utilities = require('../../utilities')
const Dataset = require('../../models/Dataset')

const { userRoles /*, consentTypes */ } = require('../../constants')

/* ---------------- Setting activities ---------------- */

// Modifies the given utvalg setup in place
const updateSelection = ({
  currentPriority,
  selection,
  pathToNewName,
  newName,
}) => {
  // Find the correct level to insert
  let currentUtvalgKey = currentPriority[0]
  if (!currentUtvalgKey) return
  pathToNewName.forEach((title, index) => {
    const foundItem = selection[currentUtvalgKey].find((u) => u.title == title)
    if (foundItem) selection = foundItem.selection
    currentUtvalgKey = currentPriority[index + 1]
  })

  // Add an empty array for the new Utvalg if it is missing
  if (!selection[currentUtvalgKey]) selection[currentUtvalgKey] = []

  // Add an empty placeholder array for the next utvalg below, if needed
  const newItem = { title: newName, selection: {} }
  if (pathToNewName.length + 1 < currentPriority.length) {
    const nextKeyDown = currentPriority[pathToNewName.length + 1]
    newItem.selection[nextKeyDown] = []
  }
  selection[currentUtvalgKey].push(newItem)
}

/* const fetchVideosForDatasets = (datasets) => {
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
} */

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
    query = {
      $or: [{ 'users.groups': { $in: groupIds } }, { 'users.owner': u._id }],
    }
  } else {
    query = {
      $and: [{ 'users.groups': { $in: groupIds } }, { 'status.active': true }],
    }
  }

  Dataset.find(query, async (error, ds) => {
    if (error) return next(error)
    const datasets = ds.map((d) => d.redacted())
    response.send(datasets)
  })
})

// CREATE a dataset
router.post('/dataset', utilities.authoriseUser, (request, response, next) => {
  if (request.body.name && response.locals.user) {
    let datasetName = request.body.name
    const u = response.locals.user

    Dataset.create({ name: datasetName, 'users.owner': u._id })
      .then((newDataset) => {
        response.send(newDataset)
      })
      .catch((error) => next(error))
  } else return next(new Error('Empty name '))
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
          selection: d.selection, // The current selection for this Dataset
          currentPriority: d.selectionPriority, // The complete list of the Dataset's selection categories
          pathToNewName: request.body.path, // A path list of 'titles' above the location of the new title
          newName: request.body.name, // The name of the new item
        })
        d.status.lastUpdated = Date.now()
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
  const user = response.locals.user
  let isAdmin = utilities.hasMinimumUserRole(
    response.locals.user,
    userRoles.admin
  )
  if (!isAdmin) return next(new Error('Unauthorised'))
  Dataset.findById(updatedDataset._id, async (error, d) => {
    if (error || !d)
      next(error || new Error({ status: 400, message: 'datasett not found' }))
    updatedDataset.storages.forEach((storage) => {
      if (storage._id == '') delete storage._id
    })
    const updateIsNewer =
      Date(updatedDataset.status.lastUpdated) >= Date(d.status.lastUpdated)

    if (updateIsNewer) {
      d.name = updatedDataset.name
      d.status.lastUpdated = Date.now()
      d.description = updatedDataset.description
      d.users.owner = user._id
      d.storages = updatedDataset.storages
      d.consent = updatedDataset.consent
      d.status.active = updatedDataset.status.active
      // d.formId =
      //   updatedDataset.consent == consentTypes.samtykke
      //     ? updatedDataset.formId
      //     : ''
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
