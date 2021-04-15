/*
 Designed and developed by Richard Nesnass & Sharanya Manivasagam
*/

const fs = require('fs');
const { google } = require('googleapis');
const fileOperations = require('./fileOperations');
const videoStatusTypes = require('../constants').videoStatusTypes;
const { formPath } = require('../utilities');

/* --------------    UiO Google Suite ----------------- */

// API Documentation: https://github.com/googleapis/google-api-nodejs-client#google-apis-nodejs-client

// Get user details from Google
// * Returns a promise *
function userDetailsFromGoogle(auth) {
  const people = google.people({
    version: 'v1',
    auth,
  });
  return people.people.get({
    resourceName: 'people/me',
    personFields: 'emailAddresses',
  });
}

function checkFolderExists(drive, metadata) {
  // Resolves with the found folder, otherwise undefined
  return new Promise((resolve, reject) => {
    drive.files.list({
      q: `mimeType = 'application/vnd.google-apps.folder' and name = '${metadata.name}' and trashed = false and appProperties has { key="appID" and value='${metadata.appProperties.appID}'} and appProperties has { key="folderStructure" and value='${metadata.appProperties.folderStructure}'}`,
      spaces: 'drive',
      fields: 'nextPageToken, files(name, id)',
    },
      function (err, res) {
        if (err) {
          reject(err);
        } else if (res && res.data.files.length > 0) {
          // We are looking for only one file with the given title
          // console.log(res.data.files);
          resolve({file: res.data.files[0], metadata });
        } else {
          console.log(`Folder: ${metadata.name} not found`);
          resolve({ file: null, metadata });
        }
      }
    );
  });
}

function createGFile(drive, metadata, media) {
  // Resolves with the created file
  return new Promise((resolve, reject) => {
    const f = {
      resource: metadata,
      fields: 'id',
    }
    if (media) {
      f.media = media
    }
    drive.files.create(f, function (err, res) {
        if (err) {
          reject(err);
        } else {
          resolve({ file: res.data, metadata });
        }
      }
    );
  });
}

/* Helper functions */
function metadataObject(name, folderStructure) {
  return {
    name,
    mimeType: 'application/vnd.google-apps.folder',
    appProperties: { appID: 'viva-app-university-of-oslo', folderStructure },
    parents: [],
  };
}

/* Creating folders */
async function createFolders(drive, folders, rootID) {
    let subFolder;

    /* Find the lowest existing parent folder */
    while (folders[0] && folders[0].file) {
      subFolder = folders.shift();
    }

    /* Create needed new folders sequentially, async on GDrive */
    for (let i = 0; i < folders.length; i++) {
      const meta = folders[i].metadata
      let parentID = subFolder ? subFolder.id : rootID
      meta.parents.push(parentID)
      try {
        subFolder = await createGFile(drive, meta)
      } catch(error) {
        return Promise.resolve({ error, subFolder: null })
      }
    }

    // Return the lowest new subFolder
    return Promise.resolve({ error: false, subFolder })
}

/* Prepare folder metadata and check for existing folders  */
function createFolderStructures(drive, rootID, folderPath) {
  const paths = folderPath.split('/')
  const foldersChecked = []

  // Create metadata items for GDrive for creation of new folders
  let path = ''
  for (let i = 0; i < paths.length; i++) {
    path += `${paths[i]}/`
    const metadata = metadataObject(paths[i], path);
    foldersChecked.push(checkFolderExists(drive, metadata));
  }

  // When all folders have been checked, create the ones that don't exist
  return Promise
    .all(foldersChecked)
    .then(folders => createFolders(drive, folders, rootID))
}

function initializeStructure(video, drive, rootID, path, filename) {
  return new Promise((resolve, reject) => {

    const videoReject = (error, msg) => {
      video.errorInfo = msg
      reject(error);
    }

    createFolderStructures(drive, rootID, path).then(({error, subFolder}) => {
      if (error || !subFolder.file) {
        return videoReject(error, 'Error creating folder structure')
      }
      const dirPath = process.cwd();
      const localVideoPath = `${dirPath}/videos/edited/${video.filename}.${video.fileType}`;
      const metaData = {
        name: filename,
        parents: [subFolder.file.id],
      };
      const media = {
        mimeType: video.mimeType,
        body: fs.createReadStream(localVideoPath),
      };

      createGFile(drive, metaData, media).then(() => {
        console.log(`${new Date().toUTCString()} Folders OK, video transferred. SubFolder name: ${subFolder.file.name} Video name: ${filename}`);
        fileOperations.moveFile(video, videoStatusTypes.edited, videoStatusTypes.complete).then(() => {
          video.status = videoStatusTypes.complete;
          video.pipelineInProgress = false;
          video.storagePath.push(localVideoPath);
          video.save()
          resolve();
        }).catch(err => videoReject(err, 'Error moving file to complete'))
      }).catch(err => videoReject(err, 'File creation error for Google Drive. Transfer not completed'));
    }).catch(err => videoReject(err, 'Folder setup error for Google Drive. Transfer not completed'));
  });
}

// Upload a video file to the user's Google Drive space
function createVideoAtGoogle(video, setting, auth) {
  return new Promise((resolve, reject) => {
    const drive = google.drive({ version: 'v3', auth });
    const vivaMetadata = {
      name: 'VIVA',
      mimeType: 'application/vnd.google-apps.folder',
      appProperties: { appID: 'viva-app-university-of-oslo', folderStructure: 'VIVA' },
    };

    const folderMetaData = setting.storages.find(element => element.name === 'google');
    const pathPromise = formPath(folderMetaData.storagePath.path, setting, video);
    const filenamePromise = formPath(folderMetaData.storagePath.fileName, setting, video);
    const slashes = /[/]/g;

    return Promise.all([pathPromise, filenamePromise]).then(paths => checkFolderExists(drive, vivaMetadata)
      .then(rootFolder => {
        if (rootFolder && rootFolder.file) {
          const rootID = rootFolder.file.id;
          return initializeStructure(video, drive, rootID, paths[0], paths[1].replace(slashes, "-").substring(1)).then(() => resolve())
        } else {
          console.log('VIVA folder not found ... \nCreating VIVA folder ...');
          return createGFile(drive, vivaMetadata).then(vivaFolder => {
            return initializeStructure(video, drive, vivaFolder.id, paths[0], paths[1].replace(slashes, "-").substring(1)).then(() => resolve())
          });
        }
    }).catch(error => reject(error)));
  });
}

module.exports = {
  userDetailsFromGoogle,
  createVideoAtGoogle
};
