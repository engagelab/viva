const router = require('express').Router()
const authenticationRoutes = require('../authentication')

router.get('/lti/authorize', authenticationRoutes.LTI13Callback)

module.exports = router
