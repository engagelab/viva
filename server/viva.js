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
const https = require('https');
const fs = require('fs');
const dirPath = process.cwd();
const { fork } = require('child_process');
const nodeCleanup = require('node-cleanup');

const db = require('./services/database')
const openidClient = require('./services/openid')
const setup = require('./setup')

const port = process.env.VUE_APP_SERVER_PORT;
const host = process.env.VUE_APP_SERVER_HOST;
const packageVersion = require('../package.json').version;
const version = `VIVA v${packageVersion}`;

// Task Delegator will be a child process
let taskDelegator

// App needs to be created after 3rd party service information is available

nodeCleanup(function(exitCode, signal) {
  console.log(
    `VIVA Server closing down. Exit code: ${exitCode} Signal: ${signal}`
  );
  if (taskDelegator) {
    taskDelegator.send('exit');
  }
});

function forkTaskDelegator() {
  const execArgv =
    process.env.NODE_ENV == 'development' ? ['--harmony', '--inspect'] : [];
  taskDelegator = fork(`${dirPath}/server/taskDelegator.js`, { execArgv });

  // When the Task Delegator exits, this event arrives and causes closure of VIVA server
  taskDelegator.on('exit', function(exitCode, signal) {
    console.log(
      `VIVA Task Delegator closing down. Exit code: ${exitCode} Signal: ${signal}`
    );
    taskDelegator = null; // enable the cleanup handler
  });
}

function startServerCallback() {
  console.log(version);
  console.log(`Your server is listening at ${host}:${port}`);

  if (process.env.NODE_ENV == 'development') {
    forkTaskDelegator();
  }
}

// Activate HTTPS server or HTTP server if running locally
const SSLkey = fs.readFileSync(process.env.SSL_KEY_FILE)
let SSLcert = fs.readFileSync(process.env.SSL_CERT_FILE)
const SSLchain = fs.readFileSync(process.env.SSL_CHAIN_FILE)
const SSLfullchain = SSLcert + SSLchain

const sslOptions = {
  key: SSLkey,
  cert: SSLfullchain,
  ca: null,
}


// Connect to database
db.connect('VIVA Server').then(() => {
  // Create directories if necessary
  setup.createVideoDirectories()
  // Create test documents if necessary
  if (process.env.NODE_ENV !== 'production') setup.createTestDocuments()

  // Get async Dataporten information before starting app
  openidClient.discoverServices().then(() => {
    const app = require('./app').app

    // Redirect http calls to https
    app.use((req, res, next) => {
      if (!req.secure) {
        const redirect = `https://${req.headers.host}${req.url}`
        return res.redirect(redirect)
      }
      return next()
    })

    // Start server
    https.createServer(sslOptions, app).listen(process.env.VUE_APP_SERVER_PORT, startServerCallback)
  })
})

