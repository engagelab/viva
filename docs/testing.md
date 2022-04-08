### Settings

#### Setup

Testing the server API relies automating login by 'skipping over' the Dataporten authentication process
This requires NODE_ENV be set to 'test' in `.env` as follows:
```
NODE_ENV=test
VUE_APP_SERVER_HOST=http://localhost
VUE_APP_SERVER_PORT=8000
BASE_URL='/'
VUE_APP_DISABLE_DELAYS=true
```

#### Node Server tests
API tests are run using Mocha and Chai. Find tests in `test/server/`

Run tests by callling `yarn run test`

#### VS Code launch config to run Mocha testing (IN USE):

```
{
  "name": "Mocha Tests",
  "type": "node",
  "request": "launch",
  "program": "${workspaceFolder}/node_modules/mocha/bin/_mocha",
  "args": [
      "--recursive",
      "--colors",
      "${workspaceFolder}/test/**/*.test.js"
  ],
  "internalConsoleOptions": "openOnSessionStart"
}
```
#### VS Code launch config to run Jest testing (NOT in use):

```
{
  "name": "Tests",
  "type": "node",
  "request": "launch",
  "program": "${workspaceRoot}/node_modules/jest-cli/bin/jest.js",
  "stopOnEntry": false,
  "args": ["--runInBand"],
  "cwd": "${workspaceRoot}",
  "preLaunchTask": null,
  "runtimeExecutable": null,
  "runtimeArgs": [
      "--nolazy"
  ],
  "env": {
      "NODE_ENV": "test"
  },
  "externalConsole": false,
  "sourceMaps": false,
  "outDir": null
}
```
