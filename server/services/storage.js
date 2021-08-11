const {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  // ListObjectsCommand,
} = require('@aws-sdk/client-s3')

const { getSignedUrl } = require('@aws-sdk/s3-request-presigner')
const fs = require('fs')
const crypto = require("crypto")
const Dataset = require('../models/Dataset')
const moment = require('moment')

const { videoStorageTypes } = require('../constants')
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
};

const s3 = new S3Client(s3Configuration)

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
    SSECustomerKeyMD5: sseMD5
  }
  return s3.send(new PutObjectCommand(objectParams));
};

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
    SSECustomerKeyMD5: sseMD5
  }
  return s3.send(new GetObjectCommand(objectParams))
}

/**
 * Get presigned url to a file from S3
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
    /* SSECustomerKey: Buffer.from(process.env.AWS_SSE_CUSTOMER_KEY), // 256-bit, base64-encoded encryption key, Base-64 encoded */
    // SSECustomerKey: sseKey, // 256-bit, base64-encoded encryption key, Base-64 encoded
    // SSECustomerKeyMD5: sseMD5,
  }
  return getSignedUrl(s3, new GetObjectCommand(objectParams))
}

// RECOMMENDED (synchronous)
// delimiter is the separator between path segments
const generatePath = function ({ list, dataset, video }, delimiter) {
  const separator = delimiter || '/'
  const whitespace = / /g
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
          return dataset.users.owner.replace(whitespace, '')
        case 'UserID':
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
    Dataset.findById(video.dataset.id, (error, dataset) => {
      if (error) return reject(error)
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
function sendToEducloud({ video, subDirSrc }) {
  const path = getPath(video, subDirSrc)
  const keyname = `${video.users.owner.toString()}/${video.file.name}.${video.file.extension}`
  const sseKey = Buffer.alloc(32, crypto.randomBytes(32).toString("hex").slice(0, 32))
  const sseMD5 = crypto.createHash('md5').update(sseKey).digest('base64');
  video.file.encryptionKey = sseKey
  video.file.encryptionMD5 = sseMD5
  return uploadS3File({ path, keyname, sseKey, sseMD5 }).then(() => {
    console.log('Video sent to Educloud')
    video.storages.push({ path: keyname, kind: videoStorageTypes.educloud })
  }).catch((error) => {
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
  getSignedUrlS3URL,
  fetchStorage,
  sendToEducloud,
  sendToLagringshotell,
  generatePath,
}
