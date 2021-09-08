/*
 Designed and developed by Richard Nesnass & Sharanya Manivasagam
*/

const fs = require('fs')
const path = require('path')
const router = require('express').Router()
const utilities = require('../../utilities')
const tsdConsent = require('../../services/tsd')

const sampleConsentsRaw = fs.readFileSync(
  path.resolve(__dirname, './sampleConsents.json')
)
const sampleConsents = JSON.parse(sampleConsentsRaw)

router.get('/consents', utilities.authoriseUser, (request, response, next) => {
  const user = response.locals.user
  if (
    request.query.datasetId &&
    request.query.formId &&
    request.query.formId !== ''
  ) {
    if (process.env.NODE_ENV === 'development') {
      return response.send(sampleConsents)
    }
    tsdConsent.exportConsent(
      {
        user,
        datasetId: request.query.datasetId,
        formId: request.query.formId,
        utvalg: request.query.utvalg,
      },
      (error) => next(error),
      (consents) => response.send(consents)
    )
  } else {
    response.send([])
  }
})

// Post to TSD with utvlag instances to create consent
router.post('/consent', utilities.authoriseUser, (request, response, next) => {
  let datasett = request.query
  let groups = JSON.parse(datasett.dataportenGroupsId)
  console.log(groups)
  if (request.query.utvalg) {
    tsdConsent.createConsent(
      { user: request.body, datasett: request.query },
      (error) => next(error),
      (clientID) => response.send(clientID)
    )
  } else {
    response.send([])
  }
})

module.exports = router
