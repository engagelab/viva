const { spawn } = require('child_process')
const QRCode = require('qrcode')
const executables = require('../constants').executables
const fileOperations = require('./fileOperations')

/*
https://ffmpeg.org/ffmpeg-filters.html#drawtext-1
To enable compilation of this filter, you need to configure FFmpeg with --enable-libfreetype.
To enable default font fallback and the font option you need to configure FFmpeg with --enable-libfontconfig.
To enable the text_shaping option, you need to configure FFmpeg with --enable-libfribidi
*/
const dirPath = process.cwd()

/* Blur the in-betweens of video using the EDL(edit decision list sent by the user) */
const createFFMPEG = (video, subDirSrc, subDirDest) => {
  return new Promise((resolve, reject) => {
    let subprocess
    let err = ''

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
      videoTrim = `trim=start=${trim[0]}:end=${
        trim[1]
      },setpts=PTS-STARTPTS[vT];`
      audioTrim = `atrim=start=${trim[0]}:end=${
        trim[1]
      },asetpts=PTS-STARTPTS[aT],`
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
      `${dirPath}/videos/${subDirSrc}/${video.filename}`,
      '-i', // 2nd Input file (watermark)
      `${dirPath}/videos/${subDirSrc}/${video.filename}_qrcode.png`,
      '-filter_complex',
      videoArgs + audioArgs + overlayArgs, // watermarking process
      '-map',
      '[out]', // map the video output
      audioMap,
      audioOutput, // map the audio output
      '-strict', // required to enable experimental features
      '-2', // required to enable experimental features
      `${dirPath}/videos/${subDirDest}/${video.filename}.mp4` // Output file as MP4
    ]

    QRCode.toFile(
      `${dirPath}/videos/${subDirSrc}/${video.details.id}_qrcode.png`,
      video.details.id,
      { scale: 2, margin: 2 }
    )
      // If successful, ffmpeg is executed with specified arguements for trimming/blurring/watermark
      .then(() => {
        try {
          // This could take a long time, so using 'spawn' to allocate task to a separate thread
          subprocess = spawn(executables.ffmpeg, args)
        } catch (ex) {
          err += ex.stdout
        }

        subprocess.on('error', err => {
          console.log(`Failed to start subprocess. Error: ${err}`)
        })

        subprocess.stderr.on('data', data => {
          err += data
          console.log(err)
        })

        subprocess.on('close', code => {
          console.log(
            `ffmpeg process exited with code ${code}. ${
              err ? 'Error data: ' + err : ''
            }`
          )
          if (code !== 0) {
            reject(err)
          } else {
            video.file.mimeType = 'video/mp4'
            video.file.type = 'mp4'
            fileOperations // Remove the generated QR code image
              .removeFile(`${video.details.id}_qrcode.png`, subDirSrc)
              .then(() => {
                console.log(`Completed FFMPEG operations on ${video.details.id}`)
                resolve(video)
              })
              .catch(error => reject(error))
          }
        })
      })
      .catch(err => {
        console.error(err)
        reject(err)
      })
  })
}

module.exports = {
  createFFMPEG
}
