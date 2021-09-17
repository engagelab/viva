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

require('dotenv').config({ silent: process.env.NODE_ENV !== 'development' })
const mongoose = require('mongoose')

// MongoDB configuration
const passString = encodeURIComponent(process.env.MONGODB_PASSWORD)
const mongoDBConnectionString =
  `mongodb://${process.env.MONGODB_USER}:` +
  `${passString}@` +
  `${process.env.MONGODB_HOST}:` +
  `${process.env.MONGODB_PORT}/` +
  `${process.env.MONGODB_DATABASE_NAME}` +
  `?authSource=${process.env.MONGODB_AUTHSOURCE}`

// Exit gracefully if the server is killed
process.on('SIGINT', () => {
  mongoose.disconnect()
  process.exit()
})

function connect (callerName) {
  // Start a MongoDB connection
  return new Promise((resolve, reject) => {
    mongoose.connect(
      mongoDBConnectionString,
      {
        useCreateIndex: true,
        useNewUrlParser: true,
        useFindAndModify: false,
        useUnifiedTopology: true
      },
      (error) => {
        if (error) {
          console.error(
            `${callerName}: Error connecting to MongoDB Database: ${error}`
          )
          reject(error)
        } else {
          /* console.log(
            `${callerName} connected to Database: ${process.env.MONGODB_DATABASE_NAME} at ${process.env.MONGODB_HOST}`
          ) */
          resolve()
        }
      }
    )
  })
}

function disconnect () {
  return mongoose.disconnect()
}


module.exports = {
  connect,
  disconnect,
  mongoose
}
