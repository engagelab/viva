/*
 Designed and developed by Richard Nesnass, Sharanya Manivasagam, and Ole Smørdal

 This file is part of VIVA.

 VIVA is free software: you can redistribute it and/or modify
 it under the terms of the GNU Affero General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 GPL-3.0-only or GPL-3.0-or-later

 VIVA is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU Affero General Public License for more details.

 You should have received a copy of the GNU Affero General Public License
 along with VIVA.  If not, see <http://www.gnu.org/licenses/>.
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
        'users.sharing.$[s].annotations.$[a].text': request.body.text,
        'users.sharing.$[s].annotations.$[a].time': request.body.time
      },
      { new: true, arrayFilters: [
        {'s._id': ObjectId(request.query.shareID)},
        {'a._id': ObjectId(request.query.annotationID)}
      ]},
      (error, updatedVideo) => {
        if (error) return next(error)
        else if (process.env.NODE_ENV === 'testing') {
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

// Add a comment to an existing annotation
router.put(
  '/video/share/annotation/comment',
  utilities.authoriseUser,
  (request, response, next) => {
    Video.findOneAndUpdate(
      { 'details.id': request.query.videoID },
      {
        $push: { 'users.sharing.$[s].annotations.$[a].comments': request.body }
      },
      { arrayFilters: [
        {'s._id': ObjectId(request.query.shareID)},
        {'a._id': ObjectId(request.query.annotationID)}
      ]},
      (error) => {
        if (error) return next(error)
        else response.status(200).end()
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

// Add a comment to an existing share
// Returns the updated share so it can be updated front-end
router.put(
  '/video/share/comment',
  utilities.authoriseUser,
  (request, response, next) => {
    const shareID = ObjectId(request.query.shareID)
    Video.findOneAndUpdate(
      { 'details.id': request.query.videoID, 'users.sharing._id': shareID },
      {
        $push: { 'users.sharing.$.comments': request.body }
      },
      { new: true },
      (error, updatedVideo) => {
        if (error) return next(error)
        else {
          const share = updatedVideo.users.sharing.id(shareID)
          response.send(share)
        }
      }
    )
  }
)

module.exports = router
