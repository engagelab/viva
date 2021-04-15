const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3')
const fs = require('fs')

// Initialize
const endpoint = {
  protocol: 'https',
  hostname: process.env.AWS_BUCKET_ENDPOINT,
  port: 443
}
const s3 = new S3Client({ region: process.env.AWS_BUCKET_REGION, endpoint, tls: true });

/**
 * Upload a file to S3
 *
 * @param {Object} meta - Object containing parameters.
 * @param {string} meta.path - Full path to the file on this server.
 * @param {string} meta.keyname - Name to be used for the file in the S3 bucket.
 * @return {promise} Promise
 */
const uploadFile = async ({ path, keyname }) => {
  const objectParams = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: keyname,
    Body: fs.createReadStream(path),
  };
  return s3.send(new PutObjectCommand(objectParams));
};

/**
 * Download a file from S3
 *
 * @param {Object} meta - Object containing parameters.
 * @param {string} meta.keyname - Name to be used for the file in the S3 bucket.
 * @return {promise} Promise
 */
 const downloadFile = async ({ keyname }) => {
  const objectParams = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: keyname,
  };
  return s3.send(new GetObjectCommand(objectParams));
};


module.exports = {
  uploadFile,
  downloadFile,
}
