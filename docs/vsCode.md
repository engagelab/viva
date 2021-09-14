### Settings

#### Launch config to run Jest testing:

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
  },
```
