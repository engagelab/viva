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
const { authoriseUser, hasMinimumUserRole } = require('../../utilities')
const { userRoles } = require('../../constants')
const dataporten = require('../../services/dataporten')
const canvas = require('../../services/canvas')
const User = require('../../models/User')

/* ---------------- User activities ---------------- */

/** Update the current user  */
router.put('/user', authoriseUser, (request, response, next) => {
  const u = response.locals.user
  const update = request.body
  if (update.videos.draftIDs && Array.isArray(update.videos.draftIDs)) {
    // Setup structures
    if (!u.videos.draftIDs) u.videos.draftIDs = []
    const newDrafts = update.videos.draftIDs.filter(
      (id) => !u.videos.draftIDs.includes(id)
    )
    const removedDrafts = update.videos.removedDraftIDs || []

    // Remove drafts
    let dbDrafts = u.videos.draftIDs.filter((r) => !removedDrafts.includes(r))

    // Record statistics
    if (!u.status.totalDrafts) u.status.totalDrafts = 0
    u.status.totalDrafts += newDrafts.length
    u.status.totalDrafts -= u.videos.draftIDs.length - dbDrafts.length

    // Add new drafts
    u.videos.draftIDs = [...dbDrafts, ...newDrafts]
  }
  if (update.datasetConfig) u.datasetConfig = update.datasetConfig
  u.save((error2, savedUser) => {
    if (error2) return next(error2)
    response.send(savedUser.redacted())
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
  response.send(response.locals.user.redacted())
})

// Get all users
router.get('/users', authoriseUser, async (request, response, next) => {
  const u = response.locals.user
  const mode = request.query.mode
  const isAdmin = hasMinimumUserRole(u, userRoles.admin)
  if (isAdmin && mode !== 'namesandroles') {
    User.find({}, (error, users) => {
      if (error) next(error)
      else {
        const usersRedacted = users.map((u2) => {
          return {
            name: u2.profile.username,
            videos: u2.videos.draftIDs,
          }
        })
        response.send(usersRedacted)
      }
    })
  } else {
    let users = []
    if (request.session.canvasData.namesAndRoles) users = request.session.canvasData.namesAndRoles
    response.send(users)
  }
})

// Respond with 'draft' videos from all user accounts
router.get('/users/drafts', authoriseUser, async (request, response) => {
  const isAdmin = hasMinimumUserRole(response.locals.user, userRoles.admin)
  if (isAdmin) {
    User.find({ 'videos.draftIDs': { $exists: true, $ne: [] } }, { 'profile.username': 1, 'videos.draftIDs': 1 }, (error, users) => {
      if (error) return response.status(500).send(error)
      return response.send(users)
    })
  } else response.send(403).end()
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
  response.send({ version: process.env.VUE_APP_VERSION }).end()
})

module.exports = router
