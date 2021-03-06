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
const { execSync } = require('child_process')
const fs = require('fs')
const dirPath = process.cwd()
const Dataset = require('./models/Dataset')
const User = require('./models/User')
const Video = require('./models/Video').Video
const { videoStorageTypes, consentTypes, videoStatusTypes, videoFolderNames } = require('./constants')

const createTestDocuments = () => {
  return new Promise((resolve, reject) => {
    Dataset.findOne({ name: 'test' }, async (err, foundSetting) => {
      let dataSett = foundSetting
      if (err) {
        console.log(err)
        return reject()
      } else if (!dataSett) {
        dataSett = await Dataset.create({
          name: 'test',
          description: 'test description',
          created: new Date(),
          formId: 'none', // Nettskjema form ID
          status: {
            lastUpdated: new Date(), // Last time this Dataset was changed
            active: true, // Only active datasetts who will be fetched
            lockedBy: undefined, // Who has locked the datasett for editing
          },

          consent: {
            kind: consentTypes.manual,
          },
          users: {
            adminGroup: 'test',
            groups: ['23222', 'appleAppReview'],
          },
          selectionPriority: ["skole"], // Order of appearance of the utvalg categories
          selection: {
            "skole" : [
              {
                  "title" : "Huseby"
              }
            ]
          }, //  'utvalg' selection
          storages: [
            {
              name: videoStorageTypes.educloud,
              groupId: 'testGroupID',
              file: {
                // Path and name will be constructed from attributes from Video and Dataset based on these array entries
                path: ['folder1', 'folder2'],
                name: ['filename1', 'filename2'],
              },
              category: [],
            },
          ],
        })
        console.log('Created a Dataset')
      }

      // Find or create a test user
      User.findOne({ 'profile.username': 'testuser1' }, async (error, u) => {
        let user = u
        if (error) {
          console.log(error)
          return reject()
        } else if (!user) {
          user = await User.create({ profile: { username: 'testuser1' } })
          console.log('Created a User')
        }

        // Create one Video owned by the test user
        Video.findOne({ 'users.owner': user._id }, async (error2, v) => {
          let video = v
          if (error2) {
            console.log(error2)
            return reject()
          } else if (!video) {
            video = {
              file: {
                extension: 'mp4',
                name: 'VideoTest',
                mimeType: 'video/mp4',
              },
              details: {
                id: 'videoTextid',
                name: 'Video Tester',
                category: 'green', // green, yellow, red
                created: Date.now(),
                description: 'Video Test description',
                duration: '1000', // Seconds  created: { type: Date },
              },
              status: {
                main: videoStatusTypes.complete,
              },
              users: {
                owner: user._id,
                sharing: [
                  {
                    creator: '1',
                    created: new Date(),
                    users: [],
                    access: true,
                    title: 'Test share 1',
                    description: 'Test description 1',
                    edl: { trim: [], blur: [] },
                    tags: [],
                    annotations: [],
                    comment: [],
                  },
                ],
              },
              dataset: {
                id: dataSett._id,
                name: 'test',
                selection: [],
                groups: [],
              },
              consents: [],
              storages: [],
            }
            await Video.create(video)
            console.log('Created a Video')
          }
          resolve()
        })
      })
    })
  })
}

/* uploadS3File({
  path: './videos/uploaded/ForBiggerBlazes.mp4',
  keyname: 'blazinghot',
}).then((res) => console.log(res)) */
/*const createReference = data =>
  require('crypto')
    .createHash('sha1')
    .update(data)
    .digest('base64')

// Create a test user in the database, if it doesn't already exist
/*const initialiseDatabase = () => {
  const username = 'testuser'
  const password = 'testpassword'

  if (process.env.NODE_ENV != 'production') {
    User.findOne(
      { username: username, password: password },
      (err, foundUser) => {
        let user = foundUser
        if (err) {
          return console.log(err)
        } else if (!user) {
          user = {
            lastLogin: Date.now(),
            username,
            password,
            fullName: 'Test User',
            oauthId: '123456789',
            accessToken: 'none',
            refreshToken: 'none'
          }
          user.reference = createReference(user.oauthId)
          User.create(user)
          console.log('Created a test User')
        } else {
          user.lastLogin = Date.now()
          user.save()
        }
      }
    )
    // Not needed anymore

  }
}

const createPilotSchoolList = () => {
  pilotDataset.forEach(dataSett => {
    Dataset.findOne({ navn: dataSett }, (err, foundSetting) => {
      let setting = foundSetting
      if (err) {
        return console.log(err)
      } else if (!setting) {
        /* let storage = {
          storageName: videoStorageTypes.google
        }
        setting = {
          /*  storages: {
              primary: {
                name: videoStorageTypes.google
              }
            },
          navn: dataSett,
          created: Date.now(),
          owner: 'engagelab',
          elementer: 23
        }
        Dataset.create(setting)
        console.log(`Created a pilot school: ${dataSett}`)
      }
    })
  })
}*/

const createVideoDirectories = () => {
  const videoDir = `${dirPath}/videos`
  const subDirs = Object.values(videoFolderNames)

  const createVideoSubDirectory = (subDir) => {
    if (!fs.existsSync(subDir)) {
      execSync(`mkdir ${subDir}`, (error) => {
        if (error) {
          console.error('Unable to create video subdirectory')
        }
      })
    }
  }

  if (!fs.existsSync(videoDir)) {
    execSync(`mkdir ${dirPath}/videos`, (error) => {
      if (error) {
        console.error('Unable to create video storage directory')
      }
    })
  }
  subDirs.forEach((subDir) => createVideoSubDirectory(`${videoDir}/${subDir}`))
}

module.exports = {
  //initialiseDatabase,
  createVideoDirectories,
  createTestDocuments,
  // createPilotSchoolList
}
