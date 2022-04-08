const database = require('../../services/database')
const setup = require('../../setup')
const PORT = process.env.VUE_APP_SERVER_PORT || 80
let httpServer

function createHTTPServer() {
  // Create the server after the database has connected
  return database.connect('VIVA Testing')
  .then(() => setup.createTestDocuments())
  .then(() => {
    const { app } = require('../../app')
    return new Promise((resolve) => {
      httpServer = app.listen(PORT, () => {
        resolve(httpServer)
      })
    })
  })
}

function stopHTTPServer() {
  httpServer.close()
  return database.disconnect()
}

module.exports = { createHTTPServer, stopHTTPServer }
