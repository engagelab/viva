/*
 Designed and developed by Richard Nesnass & Sharanya Manivasagam
*/

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
  mongoose.connect(
    mongoDBConnectionString,
    {
      useNewUrlParser: true,
      useFindAndModify: false,
      useUnifiedTopology: true
    },
    error => {
      if (error) {
        console.error(
          `${callerName}: Error connecting to MongoDB Database: ${error}`
        )
      } else {
        console.log(
          `${callerName} connected to Database: ${process.env.MONGODB_DATABASE_NAME} at ${process.env.MONGODB_HOST}`
        )
      }
    }
  )
}

module.exports = {
  connect,
  mongoose
}
