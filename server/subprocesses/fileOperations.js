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
const { exec } = require('child_process');
const dirPath = process.cwd();
const lagringshotellPath = process.env.LAGRINGSHOTELL

// Get the complete file system path for the given video
const getPath = (subdir, filename, extension) => {
  return `${dirPath}/videos/${subdir}/${filename}.${extension}`
}

// Create a file on the server in given video subfolder
const createFile = (filename, subDir) => {
  return new Promise((resolve, reject) => {
    exec(`cd ${dirPath}/videos/${subDir} && touch ${filename}`, error => {
      if (error) {
        return reject(error);
      }
      console.log(`Created file '${filename}' from ${subDir}`);
      resolve();
    });
  });
};

// Remove a file from the server in given video subfolder
const removeFile = (filename, subDir) => {
  return new Promise((resolve, reject) => {
    exec(`cd ${dirPath}/videos/${subDir} && rm -f ${filename}`, error => {
      if (error) {
        return reject(error);
      }
      console.log(`Removed file '${filename}' from ${subDir}`);
      resolve();
    });
  });
};

// Move a file from one folder to another
// source and destination folders are set by videoFolderNames
const moveFile = (video, subDirSrc, subDirDest) => {
  const fileExtension = video.file.extension ? '.' + video.file.extension : '';
  return new Promise((resolve, reject) => {
    exec(
      `cd ${dirPath}/videos/${subDirSrc} && mv ${
      video.file.name
      }${fileExtension} ../${subDirDest}`,
      error => {
        if (error) {
          console.log(error)
          return reject(error);
        }
        console.log(`Moved video ${video.file.name} from '${subDirSrc}' to '${subDirDest}'`);
        resolve();
      }
    );
  });
};

// Copy a file from one folder to another
// subDirSrc is the path of the file, subDirDest is the folder the video is getting copied to
const copyFile = (video, subDirSrc, subDirDest, fileName) => {
  const regex = / /g
  let videoFilename = video.file.name.replace(regex, "")
  let destinationFilename = fileName.replace(regex,"")
  console.log(videoFilename)
  const fileExtension = video.file.extension ? '.' + video.file.extension : '';
  const newVideoPath = `${subDirDest}/${destinationFilename}${fileExtension}`;
  console.log(`cp  ${dirPath}/videos/${subDirSrc}/${
    videoFilename
    }${fileExtension}  ${subDirDest}/${
      destinationFilename
    }${fileExtension}`);
  return new Promise((resolve, reject) => {
    exec(
      `cp ${dirPath}/videos/${subDirSrc}/${
        videoFilename
      }${fileExtension} ${newVideoPath}`,
      error => {
        if (error) {
          return reject(error);
        }
        console.log(`Copied video '${videoFilename}' to '${subDirDest}'`);
        resolve(newVideoPath);
      }
    );
  });
};

/**
 * Create a filename.
 * @param {Object} video - The video's metadata.
 * @param {String} schoolname - The name of the school.
 * @param {Boolean} addUsername - If set to true, the username will be added to the filename.
 * @param {String} username - The username of the user
 * @returns {String} name - a newly created filename based on the parameters above
 */
const createName = (video, schoolname, addUsername, username) => {
  const fileExtension = video.file.extension ? '.' + video.file.extension : '';
  const datetime = new Date()
    .toLocaleString()
    // eslint-disable-next-line no-useless-escape
    .replace(/[\/:]/gi, '')
    .split(', ');
  return `${datetime[0]}-${datetime[1]}${(addUsername ? username : '')}${fileExtension}`
};

/* Create a folder on Lagringshotell if it does not exist */
/* Need to create path based on Dataset.storagePath */
const createLHFolder = folderPath => {
  return new Promise((resolve, reject) => {
    const removedPath = folderPath.replace(lagringshotellPath, '')
    const folder = removedPath;
    const completed = (error) => {
      if (error) return reject(error)
      console.log(`Created folder ${folder} in ${lagringshotellPath} successfully`)
      resolve()
    }
    if (lagringshotellPath) exec(`cd ${lagringshotellPath} && mkdir -p ${folder}`, completed)
    else exec(`cd ${__dirname}/videos/edited && mkdir -p ${folder}`, completed)
  })
}

// Check that a LagringsHotell mount exists
const checkLHMount = () => {
  return new Promise((resolve, reject) => {
    // check  if mount is available with a timeout
    if (lagringshotellPath) {
      exec(`ls ${lagringshotellPath}`);
      setTimeout(() => {
        exec(`ls ${lagringshotellPath}`, error => {
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

module.exports = {
  getPath,
  createFile,
  removeFile,
  moveFile,
  copyFile,
  createName,
  createLHFolder,
  checkLHMount,
};
