/*
 Designed and developed by Richard Nesnass & Sharanya Manivasagam
*/

const users = require('./users')
const videos = require('./videos')
const videoShare = require('./videoShare')
const datasets = require('./datasets')

const consents = require('./consent')
const transfer = require('./googleTransfer')
const lock = require('./lock')

module.exports = [users, videos, datasets, videoShare, consents, transfer, lock]
