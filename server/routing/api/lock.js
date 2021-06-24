/*
 Designed and developed by Richard Nesnass & Sharanya Manivasagam
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
