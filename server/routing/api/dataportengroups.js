/* const http = require('http');
const https = require('https'); */
// const Request = require('request');
const router = require('express').Router()
const utilities = require('../utilities')
const User = require('../../models/User')

router.get(
  '/dataportengroups',
  utilities.authoriseUser,
  (request, response) => {
    User.findById(request.session.ref, (err, user) => {
      if (user.provider === 'Dataporten') {
        utilities.dataportenGroupListForUser(user)
          .then( groups => utilities.successResponse(groups, response))
          .catch(error => utilities.errorResponse({ status: 400, message: error.toString() }, response))
      } else if (err) {
        utilities.errorResponse(err, response, 400)
      } else {
        utilities.successResponse([], response)
      }
    })
  }
)

module.exports = router
