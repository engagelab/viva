/*
 Designed and developed by Richard Nesnass & Sharanya Manivasagam
*/

const router = require('express').Router()
const utilities = require('../utilities')
const User = require('../../models/User')

/* ---------------- User activities ---------------- */

// Delete a user
/* router.delete('/user', utilities.authoriseUser, (request, response) => {
  User.findOneAndDelete({ _id: request.query._id }, (error, userId) => {
    if (error) {
      utilities.errorResponse(
        { status: 400, message: 'User not deleted ' },
        response
      )
    } else {
      console.log('User ID deleted')
      return response.send(userId).status(200)
    }
  })
}) */

/** Update the current user  */
router.put('/user', utilities.authoriseUser, (request, response) => {
  const userId = request.session.ref
  User.findById(userId, (error, user) => {
    if (error) {
      utilities.errorResponse(
        { status: 400, message: error.toString() },
        response
      )
    } else {
      const u = user
      const update = request.body
      if (update.draftMetadataIDs && Array.isArray(update.draftMetadataIDs)) {

        // Setup structures
        if (!u.draftMetadataIDs) u.draftMetadataIDs = []
        const newDrafts = update.draftMetadataIDs.filter(id => !u.draftMetadataIDs.includes(id))
        const removedDrafts = update.removedDraftMetadataIDs || []

        // Remove drafts
        let dbDrafts = u.draftMetadataIDs.filter(r => !removedDrafts.includes(r))

        // Record statistics
        if (!u.stats.totalDrafts) u.stats.totalDrafts = 0
        u.stats.totalDrafts += newDrafts.length
        u.stats.totalDrafts -= u.draftMetadataIDs.length - dbDrafts.length

        // Add new drafts
        u.draftMetadataIDs = [ ...dbDrafts, ...newDrafts ]
      }
      if (!u.encryptionKey && update.encryptionKey) {
        u.encryptionKey = update.encryptionKey
      }
      if (update.datasett) {
        u.datasett = update.datasett
      }
      u.save((error2, savedUser) => {
        if (error2) {
          return utilities.errorResponse(error2, response, 400);
        } else {
          utilities.successResponse(savedUser.redacted(), response)
        }
      })
    }
  })
})

// Don't activate delete in production!
if (process.env.NODE_ENV === 'development') {
  router.delete('/user', utilities.authoriseUser, (request, response) => {
    User.findByIdAndDelete()(request.body.id, (error, deletedUser) => {
      if (!error && deletedUser) {
        utilities.successResponse(deletedUser, response)
      } else {
        utilities.errorResponse('User not created', response)
      }
    })
  })
}

// Get the current User model
router.get('/user', utilities.authoriseUser, (request, response) => {
  if (!request.session.ref) {
    console.log(`No session ref found! Calling GET /user`)
    return utilities.errorResponse('Not found', response)
  }
  User.findById(request.session.ref, (error, user) => {
    if (!error && user) {
      utilities.successResponse({ user: user.redacted() }, response)
    } else {
      utilities.errorResponse('Not found', response)
    }
  })
})

router.get('/appversion', (request, response) => {
  response.send(process.env.VUE_APP_VERSION).end()
})

module.exports = router
