const fileOperations = require('./fileOperations')
const { exec } = require('child_process')

const path = process.env.LAGRINGSHOTELL
/* Import env file */
require('dotenv').config({ silent: process.env.NODE_ENV === 'production' })

/* Create a folder if it does not exist */
/* Need to create path based on Dataset.storagePath */
const createFolder = folderPath => {
  return new Promise((resolve, reject) => {
    const removedPath = folderPath.replace(path, '')
    const folder = removedPath;
    const completed = (error) => {
      if (error) return reject(error)
      console.log(`Created folder ${folder} in ${path} successfully`)
      resolve()
    }
    if (path) exec(`cd ${path} && mkdir -p ${folder}`, completed)
    else exec(`cd ${__dirname}/videos/edited && mkdir -p ${folder}`, completed)
  })
}
const checkMount = () => {
  return new Promise((resolve, reject) => {
    // check  if mount is available with a timeout
    if (path) {
      exec(`ls ${path}`);
      setTimeout(() => {
        exec(`ls ${path}`, error => {
          if (error) {
            return reject("Path is not available , unmounted")
          }
          resolve()
        })
      }
        , 5000);
    } else {
      reject();
    }

  })
}
// Create a copy of the uploaded video to the lagringshotell
function createVideoAtLagringshotell({ video, store, subDirSrc }) {
  return checkMount().then(() => {
    return createFolder(store.path).then(() => {

      return fileOperations.copyFile(video, subDirSrc, store.path, store.fileName)
        .then(newVideoPath => video.storages.push({ path: newVideoPath, type: 'lagringshotell'}))
    })
  })
}

module.exports = {
  createVideoAtLagringshotell
}
