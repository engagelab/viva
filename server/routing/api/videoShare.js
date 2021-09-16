/*
 Designed and developed by Richard Nesnass & Sharanya Manivasagam
*/

const router = require('express').Router()
const utilities = require('../../utilities')
const { Video } = require('../../models/Video')
const ObjectId = require('mongoose').Types.ObjectId

const Dataset = require('../../models/Dataset')
/* ---------------- Video activities ---------------- */
// This is creating share for a particular video
router.post(
  '/video/share',
  utilities.authoriseUser,
  async (request, response, next) => {
    const ltiID = response.locals.user.profile.ltiID
    Video.findOne({ 'details.id': request.query.id }, async (error, v) => {
      if (error || !v) {
        return response.status(400).end()
      } else {
        // Crate a subdocument based on the Videos 'users.sharing' schema
        const newShare = await v.users.sharing.create({
        //const newShare = await model('Share', shareSchema).create({
          creator: ltiID || '',
          users: [],
          access: true,
          title: '',
          description: '',
          edl: { trim: [0, v.details.duration], blur: [] },
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

/***********************  CRUD Operations for annotations in a share ****************************** */

// This is creating annotation for a share
router.post(
  '/video/share/annotation',
  utilities.authoriseUser,
  async (request, response, next) => {
    // Create a subdocument based on the Videos 'users.sharing.annotations' schema
    const newAnnotation = Video.schema.path('users.sharing.annotations').cast([request.body])[0]
    // const newAnnotation = await model('Annotation', annotationSchema).create(request.body)
    Video.findOneAndUpdate(
      { 'details.id': request.query.videoID, 'users.sharing._id': ObjectId(request.query.shareID) },
      { $push: { 'users.sharing.$.annotations': newAnnotation } }, // '$' is the first item that matches the query
      { new: true },
      (error, v) => {
        if (error || !v) return next(error)
        else response.send(newAnnotation)
    })
  }
)

// To update a annotate for a share ID
router.put(
  '/video/share/annotation',
  utilities.authoriseUser,
  (request, response, next) => {
    delete request.body._id
    Video.findOneAndUpdate(
      {
        'details.id': request.query.videoID,
      },
      {
        'users.sharing.$[s].annotations.$[a].comment': request.body.comment,
        'users.sharing.$[s].annotations.$[a].time': request.body.time
      },
      { new: true, arrayFilters: [
        {'s._id': ObjectId(request.query.shareID)},
        {'a._id': ObjectId(request.query.annotationID)}
      ]},
      (error, updatedVideo) => {
        if (error) return next(error)
        else if (process.env.NODE_ENV === 'test') {
          const updatedShare = updatedVideo.users.sharing.find((s) => {
            const id = s._id.toString()
            return id === request.query.shareID
          })
          const updatedAnnotation = updatedShare.annotations.find((a) => a._id.toString() === request.query.annotationID)
          response.send(updatedAnnotation)
        } else {
          response.status(200).end()
        }
      }
    )
  }
)

router.delete(
  '/video/share/annotation',
  utilities.authoriseUser,
  (request, response, next) => {
    Video.findOneAndUpdate(
      { 'details.id': request.query.videoID, 'users.sharing._id': ObjectId(request.query.shareID) },
      { $pull: { 'users.sharing.$.annotations': { '_id' : request.query.annotationID } } },
      { new: true },
      (error) => {
        if (error) return next(error)
        else response.status(200).end()
      }
    )
  }
)

module.exports = router
