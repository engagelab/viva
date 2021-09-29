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
