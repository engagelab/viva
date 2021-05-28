/*
 Designed and developed by Richard Nesnass & Sharanya Manivasagam
*/
const crypto = require('crypto');
const bcrypt = require('bcrypt');

const addZero = i => {
  return i < 10 ? '0' + i : i
}
const asFormattedDateString = date => {
  return (
    date.getDate() +
    '-' +
    (date.getMonth() + 1) +
    '-' +
    date.getFullYear() +
    '_' +
    addZero(date.getHours()) +
    '-' +
    addZero(date.getMinutes())
  )
}

const shuffleArray = array => {
  const a = array.slice();
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

function createReference(data) {
  return crypto
    .createHash('sha256')
    .update(data)
    .digest('base64');
}

// Returns a Promise(hashed version of the password)
const hash = (password) => bcrypt.hash(password, 10)
// Returns a Promise(true) if password matches the hashed password
const hashCompare = (password, hashedPassword) => bcrypt.compare(password, hashedPassword)

module.exports = {
  asFormattedDateString,
  shuffleArray,
  createReference,
  hash,
  hashCompare,
}
