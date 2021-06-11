/*
 Designed and developed by Richard Nesnass & Sharanya Manivasagam
*/

const router = require('express').Router()
const utilities = require('../../utilities')
const tsdConsent = require('../../services/tsdConsent')
const User = require('../../models/User')

router.get('/consents', utilities.authoriseUser, (request, response, next) => {
  User.findById(request.session.ref, (err, user) => {
    if (!err) {
      if (request.query.datasetId && request.query.formId && request.query.formId !== '')  {
        tsdConsent.exportConsent(
          {
            user,
            datasetId: request.query.datasetId,
            formId: request.query.formId,
            utvalg: request.query.utvalg
          },
          error => next(error),
          consents => response.send(consents)
        )
      } else {
        response.send([])
      }
    } else if (err) {
      next(err)
    }
  })
})

// Post to TSD with utvlag instances to create consent
router.post('/consent', utilities.authoriseUser, (request, response, next) => {
  let datasett = request.query
  let groups = JSON.parse(datasett.dataportenGroupsId)
  console.log(groups)
  if (request.query.utvalg) {
    tsdConsent.createConsent(
      { user: request.body, datasett: request.query },
      error => next(error),
      clientID => response.send(clientID)
    )
  } else {
    response.send([])
  }
})

module.exports = router
