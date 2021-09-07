/*
 Designed and developed by Richard Nesnass & Sharanya Manivasagam
*/

const router = require('express').Router()
const utilities = require('../../utilities')
const Video = require('../../models/Video')

const Dataset = require('../../models/Dataset')
/* ---------------- Video activities ---------------- */

router.post(
  '/video/share',
  utilities.authoriseUser,
  async (request, response, next) => {
    const ltiID = response.locals.user.profile.ltiID
    Video.findOne({ 'details.id': request.query.id }, (error, v) => {
      if (error || !v) {
        return response.status(400).end()
      } else {
        const newShare = v.users.sharing.create({
          creator: ltiID || '',
          users: [],
          access: true,
          title: '',
          description: '',
          edl: { trim: [], blur: [] },
          annotations: [],
          comment: [],
          status: [],
        })
        v.users.sharing.push(newShare)
        v.save((saveError) => {
          if (saveError) return next(saveError)
          response.send(newShare)
        })
      }
    })
  }
)

// To update a sharing item for a given video ID
router.put(
  '/video/share',
  utilities.authoriseUser,
  async (request, response, next) => {
    const updatedShare = request.body
    Video.findOne({ 'details.id': request.query.id }, (error, v) => {
      if (error || !v || !updatedShare._id) {
        return response.status(400).end()
      } else {
        const s = v.users.sharing.id(updatedShare._id)
        if (s) {
          s.users = updatedShare.users
          s.creator = updatedShare.creator
          s.access = updatedShare.access
          s.title = updatedShare.title
          s.description = updatedShare.description
          s.edl = updatedShare.edl
          s.comment = updatedShare.comment
          s.status = updatedShare.status
          v.save((saveError) => {
            if (saveError) return next(saveError)
            response.send(s)
          })
        } else response.status(404).end()
      }
    })
  }
)

router.delete(
  '/video/share',
  utilities.authoriseUser,
  async (request, response, next) => {
    const deletedShare = request.body
    Video.findOne({ 'details.id': request.query.id }, (error, v) => {
      if (error || !v || !deletedShare._id) {
        return response.status(400).end()
      } else {
        v.users.sharing.id(deletedShare._id).remove()
        v.save((saveError) => {
          if (saveError) return next(saveError)
          response.end()
        })
      }
    })
  }
)
// filter datasets for a canvas course
function fetchDatasetsBasedOnCourse(courseId) {
  return new Promise((resolve, reject) => {
    let query = {}
    query = {
      $and: [{ 'users.groups': { $eq: courseId } }, { 'status.active': true }],
    }
    Dataset.find(query, (error, ds) => {
      if (error) return reject('Error fetching datasets')
      resolve(ds)
    })
  })
}

// Fetch all videos for a filtered dataset
router.get('/videos/share', utilities.authoriseUser, (request, response) => {
  let query = {}

  // function to fetch datasets for a course
  if (request.session.canvasData) {
    fetchDatasetsBasedOnCourse(request.session.canvasData.courseId).then(
      (datasets) => {
        console.log(datasets)
        // Filter video based on datasets for a course
        const ids = datasets.map((dataset) => dataset._id)
        query = {
          $and: [
            { 'dataset.id': { $in: ids } },
            {
              $or: [
                {
                  'users.sharing.users': {
                    $in: [response.locals.user.profile.ltiID],
                  },
                },
                { 'users.owner': response.locals.user._id },
              ],
            },
          ],
        }

        Video.find(query, (error, videos) => {
          let videosToReturn = []
          if (error) {
            console.error(error)
            return response.status(400).end()
          } else {
            videosToReturn = videos.map((v) => v.redacted())
            response.send(videosToReturn).status(200).end()
          }
        })
      }
    )
  }
})
module.exports = router
