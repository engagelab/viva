const { exec } = require('child_process');
const dirPath = process.cwd();

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
  const fileExtension = video.file.type ? '.' + video.file.type : '';
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
  const fileExtension = video.file.type ? '.' + video.file.type : '';
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
  const fileExtension = video.fileType ? '.' + video.fileType : '';
  const datetime = new Date()
    .toLocaleString()
    // eslint-disable-next-line no-useless-escape
    .replace(/[\/:]/gi, '')
    .split(', ');
  return `${datetime[0]}-${datetime[1]}${(addUsername ? username : '')}${fileExtension}`
};

module.exports = {
  createFile,
  removeFile,
  moveFile,
  copyFile,
  createName,
};
