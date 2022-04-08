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
const { spawn } = require('child_process')
const QRCode = require('qrcode')
const { executables, videoFolderNames } = require('../constants')
const fileOperations = require('./fileOperations')

/*
https://ffmpeg.org/ffmpeg-filters.html#drawtext-1
To enable compilation of this filter, you need to configure FFmpeg with --enable-libfreetype.
To enable default font fallback and the font option you need to configure FFmpeg with --enable-libfontconfig.
To enable the text_shaping option, you need to configure FFmpeg with --enable-libfribidi
*/
const dirPath = process.cwd()

function spawnFFMPEG(args) {
  return new Promise((resolve, reject) => {
    let subprocess, error
    try {
      // This could take a long time, so using 'spawn' to allocate task to a separate thread
      subprocess = spawn(executables.ffmpeg, args)
    } catch (ex) {
      error += ex.stdout
      reject(error)
    }

    subprocess.on('error', (err) => {
      console.log(`Failed to start subprocess. Error: ${err}`)
      reject(err)
    })

    subprocess.stderr.on('data', (data) => {
      error += data
      console.log(`stderr Error: ${error}`)
      reject(error)
    })

    subprocess.on('close', (code) => {
      console.log(
        `ffmpeg process exited with code ${code}. ${
          error ? 'Error data: ' + error : ''
        }`
      )
      if (code !== 0) {
        reject(error)
      } else {
        resolve()
      }
    })
  })
}

// Create a thumbnail JPG image of the given video in the same directory
const createVideoThumbnail = (video, subDirSrc, subDirDest) => {
  let args = [
    '-y', // Overwrite existing
    '-loglevel',
    'error', // Mute warnings as they will trigger a pipeline error
    '-i',
    `${dirPath}/videos/${subDirSrc}/${video.file.name}`, // Input file
    '-vf',
    'scale=512:-1', // proportional scale
    '-frames:v',
    '1',
    `${dirPath}/videos/${subDirDest}/${video.file.name}.jpg`, // Output file as JPG
  ]
  return spawnFFMPEG(args)
}

// Create a new video including blurs, trim and watermark
const createVideoBlurTrimWatermark = (video, subDirSrc, subDirDest) => {
  let videoBlur = ''
  let audioBlur = ''
  let videoTrim = ''
  let audioTrim = ''
  let blur = video.details.edl.blur || []
  let trim = video.details.edl.trim || []
  let overlayArgs = '[1:v]overlay=5:5[out]'
  let videoArgs = '[0:v]'
  let audioArgs = ''
  let audioOutput = '[aT]'
  let audioMap = '-map'

  // Arguements passed for blurring on user specified timestamps
  for (let i = 0; i < blur.length; i++) {
    let videoCmd =
      // eslint-disable-next-line
      "boxblur=10:enable='between(t," +
      blur[i][0] +
      ',' +
      blur[i][1] +
      // eslint-disable-next-line
      ")'[v" +
      (i + 1) +
      '];'
    let audio = // eslint-disable-next-line
      "volume=0:enable='between(t," +
      blur[i][0] +
      ',' +
      blur[i][1] +
      // eslint-disable-next-line
      ")'[a" +
      (i + 1) +
      ']'
    if (i >= 1) {
      videoBlur = videoBlur + `[v${i}]` + videoCmd
      audioBlur = audioBlur + `,[a${i}]` + audio
    } else {
      videoBlur = videoCmd
      audioBlur = audio
    }
  }
  if (trim.length > 0) {
    videoTrim = `trim=start=${trim[0]}:end=${trim[1]},setpts=PTS-STARTPTS[vT];`
    audioTrim = `atrim=start=${trim[0]}:end=${trim[1]},asetpts=PTS-STARTPTS[aT],`
    videoArgs = '[0:v]' + videoTrim
    audioArgs = '[0:a]' + audioTrim
    overlayArgs = '[vT][1:v]overlay=5:5[out]'
  }
  if (blur.length > 0 && trim.length > 0) {
    videoArgs = '[0:v]' + videoBlur + `[v${blur.length}]` + videoTrim
    audioArgs = '[0:a]' + audioBlur + `,[a${blur.length}]` + audioTrim
  }
  // No trim with blur
  if (blur.length > 0 && trim.length == 0) {
    videoArgs = '[0:v]' + videoBlur
    audioArgs = '[0:a]' + audioBlur + ','
    overlayArgs = `[v${blur.length}]` + '[1:v]overlay=5:5[out]'
    audioOutput = `[a${blur.length}]`
  }
  // No trim No blur
  if (blur.length == 0 && trim.length == 0) {
    audioOutput = '0:a'
  }

  // Arguments to FFMEG for trimming, blurring and watermarking
  // let overlayArgs = videoOutput + '[1:v]overlay=5:H-h-5[out]';
  let args = [
    '-loglevel',
    'panic',
    '-y', // Overwrite existing file
    '-i', // Input file
    `${dirPath}/videos/${subDirSrc}/${video.file.name}`,
    '-i', // 2nd Input file (watermark)
    `${dirPath}/videos/${subDirSrc}/${video.file.name}_qrcode.png`,
    '-filter_complex',
    videoArgs + audioArgs + overlayArgs, // watermarking process
    '-map',
    '[out]', // map the video output
    audioMap,
    audioOutput, // map the audio output
    '-strict', // required to enable experimental features
    '-2', // required to enable experimental features
    `${dirPath}/videos/${subDirDest}/${video.file.name}.mp4`, // Output file as MP4
  ]
  return spawnFFMPEG(args)
}

/* Blur the in-betweens of video using the EDL(edit decision list sent by the user) */
const createFFMPEG = (video, subDirSrc, subDirDest) => {
  return new Promise((resolve, reject) => {
    // Create a QR-Code containing a reference to the video
    QRCode.toFile(
      `${dirPath}/videos/${subDirSrc}/${video.file.name}_qrcode.png`,
      video.details.id,
      { scale: 2, margin: 2 }
    )
      // If successful, execute FFMPEG to create a thumbnail of the video
      .then(() =>
        createVideoThumbnail(video, subDirSrc, videoFolderNames.thumbnails)
          // If successful, execute FFMPEG for trimming, blurring & watermark
          .then(() =>
            createVideoBlurTrimWatermark(video, subDirSrc, subDirDest)
              // If successful, update Video DB data and clean up
              .then(() => {
                video.file.mimeType = 'video/mp4'
                video.file.extension = 'mp4'
                return fileOperations // Remove the generated QR code image
                  .removeFile(`${video.file.name}_qrcode.png`, subDirSrc)
                  .then(() => {
                    console.log(
                      `Completed FFMPEG operations on ${video.details.id}`
                    )
                    resolve(video)
                  })
                  .catch((error) => reject(error))
              })
          )
      )
      .catch((err) => {
        console.error(err)
        reject(err)
      })
  })
}

module.exports = {
  createFFMPEG,
}
