/*
 Designed and developed by Richard Nesnass & Sharanya Manivasagam
*/

const router = require('express').Router()
const utilities = require('../../utilities')
const Video = require('../../models/Video')

/* ---------------- Video activities ---------------- */

router.post(
  '/video/share',
  utilities.authoriseUser,
  async (request, response, next) => {
    Video.find({ 'details.id': request.query.id }, (error, v) => {
      if (error || !v) {
        return response.status(400).end()
      } else {
        const newShare = v.users.sharing.create({
          creator: '',
          users: [],
          access: true,
          title: '',
          description: '',
          edl: { trim: [] , blur: [] },
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
    Video.find({ 'details.id': request.query.id }, (error, v) => {
      if (error || !v || !updatedShare._id) {
        return response.status(400).end()
      } else {
        const s = v.users.sharing.id(updatedShare._id);
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
    Video.find({ 'details.id': request.query.id }, (error, v) => {
      if (error || !v || !deletedShare._id) {
        return response.status(400).end()
      } else {
        v.users.sharing.id(deletedShare._id).remove();
        v.save((saveError) => {
          if (saveError) return next(saveError)
          response.end()
        })
      }
    })
  }
)
module.exports = router
