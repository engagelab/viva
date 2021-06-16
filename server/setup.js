const { execSync } = require('child_process')
const fs = require('fs')
const dirPath = process.cwd()
const Dataset = require('./models/Dataset')
const { videoStorageTypes, consentTypes } = require('./constants')
const videoFolderNames = require('./constants').videoFolderNames

Dataset.findOne(
  { name: 'test' },
  (err, foundSetting) => {
    let dataSett = foundSetting
    if (err) {
      return console.log(err)
    } else if (!dataSett) {
      dataSett = {
        name: 'test',
        description: 'test description',
        created: new Date(),
        formId: 'none', // Nettskjema form ID
        status: {
          lastUpdated: new Date(), // Last time this Dataset was changed
          active: true, // Only active datasetts who will be fetched
          lockedBy: undefined  // Who has locked the datasett for editing
        },
        consent: {
          kind: consentTypes.manual,
        },
        users: {
          dataManager: {
            oauthId: 'testDataManagerID',
            name: 'test username',
          },
          adminGroup: 'test',
          dataportenGroups: ['23222'],
          canvasGroups: []  // Canvas course IDs
        },
        selectionPriority: [], // Order of appearance of the utvalg categories
        selection: {}, //  'utvalg' selection
        storages: [{
          name: videoStorageTypes.educloud,
          groupId: 'testGroupID',
          file: {
            // Path and name will be constructed from attributes from Video and Dataset based on these array entries
            path: ['folder1', 'folder2'],
            name: ['filename1', 'filename2'],
          },
          category: [],
        }],
      }
      Dataset.create(dataSett)
      console.log('Created a test Setting')
    }
  }
)

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
          dataManager: 'engagelab',
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

  const createVideoSubDirectory = subDir => {
    if (!fs.existsSync(subDir)) {
      execSync(`mkdir ${subDir}`, error => {
        if (error) {
          console.error('Unable to create video subdirectory')
        }
      })
    }
  }

  if (!fs.existsSync(videoDir)) {
    execSync(`mkdir ${dirPath}/videos`, error => {
      if (error) {
        console.error('Unable to create video storage directory')
      }
    })
  }
  subDirs.forEach(subDir => createVideoSubDirectory(`${videoDir}/${subDir}`))
}

module.exports = {
  //initialiseDatabase,
  createVideoDirectories,
  // createPilotSchoolList
}
