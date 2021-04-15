/*
 Designed and developed by Richard Nesnass & Sharanya Manivasagam
*/

const users = require('./users');
const videos = require('./videos');
const settings = require('./settings');
const consents = require('./consent');
const transfer = require('./googleTransfer');
const groups = require('./dataportengroups');
const lock = require('./lock');

module.exports = [users, videos, settings, consents, transfer, groups,lock];
