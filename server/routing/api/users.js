/*
 Designed and developed by Richard Nesnass & Sharanya Manivasagam
*/

const router = require('express').Router()
const { authoriseUser } = require('../utilities')
const dataporten = require('../services/dataporten')
const canvas = require('../services/canvas')
const User = require('../../models/User')

/* ---------------- User activities ---------------- */

/** Update the current user  */
router.put('/user', authoriseUser, (request, response, next) => {
  const userId = request.session.ref
  User.findById(userId, (error, u) => {
    if (error) {
      return next(error)
    }
    const update = request.body
    if (update.videos.draftIDs && Array.isArray(update.videos.draftIDs)) {
      // Setup structures
      if (!u.videos.draftIDs) u.videos.draftIDs = []
      const newDrafts = update.videos.draftIDs.filter(
        (id) => !u.videos.draftIDs.includes(id)
      )
      const removedDrafts = update.removedDraftMetadataIDs || []

      // Remove drafts
      let dbDrafts = u.videos.draftIDs.filter((r) => !removedDrafts.includes(r))

      // Record statistics
      if (!u.stats.totalDrafts) u.stats.totalDrafts = 0
      u.status.totalDrafts += newDrafts.length
      u.status.totalDrafts -= u.videos.draftIDs.length - dbDrafts.length

      // Add new drafts
      u.videos.draftIDs = [...dbDrafts, ...newDrafts]
    }
    if (!u.tokens.encryptionKey && update.tokens.encryptionKey) {
      u.tokens.encryptionKey = update.tokens.encryptionKey
    }
    if (update.datasett) u.datasett = update.datasett
    u.save((error2, savedUser) => {
      if (error2) return next(error2)
      response.send(savedUser.redacted())
    })
  })
})

// Don't activate delete in production!
if (process.env.NODE_ENV === 'development') {
  router.delete('/user', authoriseUser, (request, response, next) => {
    User.findByIdAndDelete()(request.body.id, (error, deletedUser) => {
      if (!error && deletedUser) {
        response.send(deletedUser)
      } else {
        next(new Error('User not created'))
      }
    })
  })
}

// Get the current User model
router.get('/user', authoriseUser, async (request, response) => {
  response.send(response.locals.user)
})

router.get('/groups', authoriseUser, async (request, response, next) => {
  const u = response.locals.user
  const serviceType = u.status.provider
  let groups = []
  try {
    switch (serviceType) {
      case 'dataporten':
        groups = await dataporten.groupsForUser(u)
        break
      case 'canvas':
        groups = await canvas.groupsForUser(u)
        break
      default:
        break
    }
    response.send(groups)
  } catch (error) {
    next(error)
  }
})

router.get('/appversion', (request, response) => {
  response.send(process.env.VUE_APP_VERSION).end()
})

module.exports = router
