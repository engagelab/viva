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
const {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} = require('@aws-sdk/client-s3')

const { getSignedUrl } = require('@aws-sdk/s3-request-presigner')
const fs = require('fs')
const crypto = require('crypto')
const Dataset = require('../models/Dataset')
const User = require('../models/User.js')
const moment = require('moment')

const { videoStorageTypes, videoFolderNames } = require('../constants')
const {
  getPath,
  checkLHMount,
  createLHFolder,
  copyFile,
} = require('../subprocesses/fileOperations')

const s3Configuration = {
  // Setting credentials here does not seem to work. The should be only in .env file, AWS SDK will read them there
  /* credentials: {
    secretAccessKey: process.env.AWS_ACCESS_KEY_ID,
    accessKeyId: process.env.AWS_SECRET_ACCESS_KEY,
  }, */
  region: process.env.AWS_BUCKET_REGION,
  forcePathStyle: true,
  tls: true,
  endpoint: {
    hostname: process.env.AWS_BUCKET_ENDPOINT,
  },
}

const s3 = () => new S3Client(s3Configuration)

// FOR TESTING ONLY
/* async function listBucketItems() {
  const bucketParams = { Bucket: process.env.AWS_BUCKET_NAME };
  try {
    const data = await s3.send(new ListObjectsCommand(bucketParams));
    console.log("Success", data);
  } catch (err) {
    console.log("Error", err);
  }
}
listBucketItems() */

/**
 * Upload a file to S3
 *
 * @param {Object} meta - Object containing parameters.
 * @param {string} meta.path - Full path to the file on this server.
 * @param {string} meta.keyname - Name to be used for the file in the S3 bucket.
 * @return {promise} Promise
 */
const uploadS3File = async ({ path, keyname, sseKey, sseMD5 }) => {
  const objectParams = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: keyname,
    Body: fs.createReadStream(path),
    // ServerSideEncryption: 'AES256', // must be "AES256",
    SSECustomerAlgorithm: 'AES256',
    SSECustomerKey: sseKey, // 256-bit, base64-encoded encryption key, Base-64 encoded
    SSECustomerKeyMD5: sseMD5,
  }
  return s3().send(new PutObjectCommand(objectParams))
}

const deleteS3File = async ({ keyname, sseKey, sseMD5 }) => {
  const objectParams = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: keyname,
    // ServerSideEncryption: 'AES256', // must be "AES256",
    SSECustomerAlgorithm: 'AES256',
    SSECustomerKey: sseKey, // 256-bit, base64-encoded encryption key, Base-64 encoded
    SSECustomerKeyMD5: sseMD5,
  }
  return s3().send(new DeleteObjectCommand(objectParams))
}

/**
 * Download a file from S3
 *
 * @param {Object} meta - Object containing parameters.
 * @param {string} meta.keyname - Name to be used for the file in the S3 bucket.
 * @return {promise} Promise
 */
const downloadS3File = async ({ keyname, sseKey, sseMD5 }) => {
  const objectParams = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: keyname,
    // ServerSideEncryption: 'AES256', // must be "AES256",
    SSECustomerAlgorithm: 'AES256',
    SSECustomerKey: sseKey, // 256-bit, base64-encoded encryption key, Base-64 encoded
    SSECustomerKeyMD5: sseMD5,
  }
  return s3().send(new GetObjectCommand(objectParams))
}

/**
 * Get presigned url to a file from S3
 * NOTE: As Educloud uses client-supplied encryption keys, this method will not work from a browser unless those keys are sent with it
 *
 * @param {Object} meta - Object containing parameters.
 * @param {string} meta.keyname - Name to be used for the file in the S3 bucket.
 * @return {promise} Promise
 */
const getSignedUrlS3URL = async ({ keyname }) => {
  const objectParams = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: keyname,
    // ServerSideEncryption: 'AES256', // must be "AES256",
    SSECustomerAlgorithm: 'AES256',
    // SSECustomerKey: sseKey, // 256-bit, base64-encoded encryption key, Base-64 encoded
    // SSECustomerKeyMD5: sseMD5,
  }
  const client = s3()
  return getSignedUrl(client, new GetObjectCommand(objectParams))
}

// RECOMMENDED (synchronous)
// delimiter is the separator between path segments
const generatePath = function ({ list, dataset, video }, delimiter) {
  const separator = delimiter || '/'
  const whitespace = / /g
  let owner = 'unknownOwner'
  if (list.length < 1) return ''
  return list
    .map((p) => {
      switch (p) {
        case 'datasettName':
          return dataset.name.replace(whitespace, '')
        case 'fileName':
          return video.file.name
        case 'timeStamp':
          return moment(video.details.created).format('dd-mmm-YYYY-h-mm-ss')
        case 'owner':
          owner = dataset.users.owner.profile.fullName || 'unknownOwner'
          return owner.replace(whitespace, '')
        case 'userID':
          return video.users.owner
        default:
          return ''
      }
    })
    .reduce((acc, curr) => acc + separator + curr)
}

// RECOMMENDED
const fetchStorage = (video) => {
  return new Promise((resolve, reject) => {
    Dataset.findById(video.dataset.id)
      .populate({
        path: 'users.owner',
        model: User,
      })
      .exec((error, dataset) => {
        if (error || !dataset) return reject(error)
        let stores = []
        dataset.storages.forEach((storage) => {
          let path = generatePath(
            { list: storage.file.path, dataset, video },
            '/'
          )
          const fileName = generatePath(
            { list: storage.file.name, dataset, video },
            '-'
          )
          // TODO: Can 'groupId' be integrated into storage.file.path ?
          if (storage.kind === videoStorageTypes.lagringshotell) {
            const basePath = process.env.LAGRINGSHOTELL || '/tmp/'
            if (storage.groupId) path = storage.groupId + '/' + path
            path = basePath + path
          }
          stores.push({
            kind: storage.kind,
            path,
            fileName,
          })
        })
        resolve(stores)
      })
  })
}

// Using user(owner) ID as a containing folder
function sendVideoToEducloud({ video, subDirSrc }) {
  let path = getPath(subDirSrc, video.file.name, video.file.extension)
  let keyname = `${video.users.owner.toString()}/${video.file.name}.${
    video.file.extension
  }`
  const sseKey = Buffer.alloc(
    32,
    crypto.randomBytes(32).toString('hex').slice(0, 32)
  )
  const sseMD5 = crypto.createHash('md5').update(sseKey).digest('base64')
  video.file.encryptionKey = sseKey
  video.file.encryptionMD5 = sseMD5
  return uploadS3File({ path, keyname, sseKey, sseMD5 })
    .then(() => {
      console.log(`Video sent to Educloud at key: ${keyname}`)
      video.storages.push({ path: keyname, kind: videoStorageTypes.educloud })
      path = getPath(videoFolderNames.thumbnails, video.file.name, 'jpg')
      keyname = `${video.users.owner.toString()}/${video.file.name}.jpg`
      return uploadS3File({ path, keyname, sseKey, sseMD5 }).then(() => {
        console.log(`Thumbnail sent to Educloud at key: ${keyname}`)
      })
    })
    .catch((error) => {
      console.log(error)
      return Promise.reject(error)
    })
}

// Create a copy of the uploaded video to the lagringshotell
function sendToLagringshotell({ video, store, subDirSrc }) {
  return checkLHMount().then(() => {
    return createLHFolder(store.path).then(() => {
      return copyFile(video, subDirSrc, store.path, store.fileName).then(
        (newVideoPath) =>
          video.storages.push({
            path: newVideoPath,
            kind: videoStorageTypes.lagringshotell,
          })
      )
    })
  })
}

module.exports = {
  uploadS3File,
  downloadS3File,
  deleteS3File,
  getSignedUrlS3URL,
  fetchStorage,
  sendVideoToEducloud,
  sendToLagringshotell,
  generatePath,
}
