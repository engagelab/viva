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
const Dataset = require('../../models/Dataset')

/* To set/unset lock for a datasett */
router.put('/lock', utilities.authoriseUser, (request, response, next) => {
  let datasett = request.body
  let lockMode = request.query.lock
  const user = response.locals.user

  Dataset.findOne({ _id: datasett.id }, (error, foundDataset) => {
    if (error || !foundDataset) {
      next(new Error({ status: 400, message: 'datasett not created' }))
    } else {
      const d = foundDataset
      if (
        lockMode == 'check' &&
        d.lock.active &&
        d.lock.lockedBy != user.username
      ) {
        let string = d.lock.lockedBy + ' is editing and locked the datasett'
        response
          .send(request.query.mode == 'Admin' ? string : '')
          .status(200)
          .end()
      } else {
        if (lockMode == 'set') {
          let l = {
            active: true,
            lockedBy: user.username,
          }
          d.lock = { ...l }
          d.save()
          response
            .send(request.query.mode == 'Admin' ? d : {})
            .status(200)
            .end()
        } else if (lockMode == 'unset' && d.lock.lockedBy == user.username) {
          let l = {
            active: false,
            lockedBy: '',
          }
          d.lock = { ...l }
          d.save()
          response
            .send(request.query.mode == 'Admin' ? d : {})
            .status(200)
            .end()
        } else if (lockMode == 'check' && !d.lock.active) {
          let l = {
            active: true,
            lockedBy: user.username,
          }
          d.lock = { ...l }
          d.save()
          response
            .send(request.query.mode == 'Admin' ? d : {})
            .status(200)
            .end()
        } else {
          response
            .send(request.query.mode == 'Admin' ? d : {})
            .status(200)
            .end()
        }
      }
    }
  })
})
module.exports = router
