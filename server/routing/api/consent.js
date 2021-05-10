/*
 Designed and developed by Richard Nesnass & Sharanya Manivasagam
*/

const router = require('express').Router()
const utilities = require('../utilities')
const tsd = require('../../services/tsdConsent')
const User = require('../../models/User')

router.get('/consents', utilities.authoriseUser, (request, response) => {
  // return utilities.successResponse([], response)
  User.findById(request.session.ref, (err, user) => {
    if (!err) {
      if (request.query.datasettId && request.query.formId && request.query.formId !== '')  {
        tsd.exportConsent(
          {
            user,
            datasettId: request.query.datasettId,
            formId: request.query.formId,
            utvalg: request.query.utvalg
          },
          error => utilities.errorResponse(error, response, 400),
          consents => utilities.successResponse(consents, response)
        )
      } else {
        utilities.successResponse([], response)
      }
    } else if (err) {
      utilities.errorResponse(err, response, 400)
    }
  })
})

// Post to TSD with utvlag instances to create consent
router.post('/consent', utilities.authoriseUser, (request, response) => {
  let datasett = request.query
  let groups = JSON.parse(datasett.dataportenGroupsId)
  console.log(groups)
  if (request.query.utvalg) {
    tsd.createConsent(
      { user: request.body, datasett: request.query },
      error =>
        utilities.errorResponse(
          { status: 400, message: error.toString() },
          response
        ),
      clientID => utilities.successResponse(clientID, response)
    )
  } else {
    utilities.successResponse([], response)
  }
})

module.exports = router
