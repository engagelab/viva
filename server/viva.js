/*
 Designed and developed by Richard Nesnass and Sharanya Manivasagam
*/
const https = require('https');
const fs = require('fs');
const dirPath = process.cwd();
const { fork } = require('child_process');
const nodeCleanup = require('node-cleanup');
const app = require('./app');

const port = process.env.VUE_APP_SERVER_PORT;
const host = process.env.VUE_APP_SERVER_HOST;
const packageVersion = require('../package.json').version;
const version = `VIVA v${packageVersion}`;

// Task Delegator will be a child process
let taskDelegator;

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
https.createServer(sslOptions, app).listen(process.env.VUE_APP_SERVER_PORT, startServerCallback)
