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
const tsdAPI_key = process.env.TSD_API_KEY
const utilities = require('../utilities')

// Use the User's id_token to get a "short lived" TSD token
function tsdAuthoriseConsent(idtoken) {
  const data = JSON.stringify({
    idtoken,
  })
  const options = {
    hostname: 'api.tsd.usit.no',
    path: `/v1/p01/auth/dataporten/token?type=consquery`,
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tsdAPI_key}`,
      'Content-Type': 'application/json',
      'Content-Length': data.length,
    },
  }
  return utilities.httpRequest(options, data)
}

const fetchConsents = ({ datasetId, formId, token }) => {
  const data = JSON.stringify({
    reference: { dataset: datasetId },
  })
  const options = {
    hostname: 'api.tsd.usit.no',
    path: `/v1/p01/consent/external/${formId}/verify`,
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Content-Length': data.length,
    },
  }
  return utilities.httpRequest(options, data)
}

function filterConsents(consents, utvalg) {
  return consents.filter((consent) => {
    if (consent.reference.subset.slice(-1) != '.')
      consent.reference.subset += '.'
    return consent.reference.subset == utvalg && consent.current
  })
}

// Method to export consents from TSD
function exportConsent(
  { user, datasetId, formId, utvalg },
  error,
  successCallback
) {
  tsdAuthoriseConsent(user.tokens.id_token)
    .then((token) => {
      fetchConsents({ datasetId, utvalg, formId, token }).then((consents) => {
        const regexComma = /,/gi
        const regexColon = /:/gi
        let filteredConsents = []
        utvalg = decodeURIComponent(utvalg)
          .replace(regexComma, '.')
          .replace(regexColon, '-')
        if (utvalg.length > 0 && utvalg.slice(-1) != '.') utvalg += '.'
        if (consents.length > 0) filteredConsents = filterConsents(consents, utvalg)
        successCallback(filteredConsents ? filteredConsents : [])
      })
    })
    .catch((err) => {
      error(err)
    })
}
module.exports = {
  exportConsent,
}
