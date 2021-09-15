### Settings

#### Node Server tests
API tests are run using Mocha and Chai. Find tests in `test/server/`


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
