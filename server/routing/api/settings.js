/*
 Designed and developed by Richard Nesnass & Sharanya Manivasagam
*/
const router = require('express').Router();
const utilities = require('../utilities');
const Datasett = require('../../models/Datasett');
const Video = require('../../models/Video');
const User = require('../../models/User');

/* ---------------- Setting activities ---------------- */

const updateUtvalg = data => {
  const path = data.path;
  const newName = data.name;
  const utvalgKeys = data.utvalgKey;
  let selectedUtvalg = data.utvalg;

  // Find the correct level to insert
  let currentUtvalgKey = utvalgKeys[0];
  if (!currentUtvalgKey) return;
  path.forEach((title, index) => {
    selectedUtvalg = selectedUtvalg[currentUtvalgKey].find(
      u => u.title == title
    );
    currentUtvalgKey = utvalgKeys[index + 1];
  });

  // Add an empty array for the new Utvalg if it is missing
  if (!selectedUtvalg[currentUtvalgKey]) selectedUtvalg[currentUtvalgKey] = [];

  // Add an empty placeholder array for the next utvalg below, if needed
  const newItem = { title: newName };
  if (path.length + 1 < utvalgKeys.length) {
    const nextKeyDown = utvalgKeys[path.length + 1];
    newItem[nextKeyDown] = [];
  }
  selectedUtvalg[currentUtvalgKey].push(newItem);
  return;
};

const fetchVideos = settingIds => {
  return new Promise((resolve, reject) => {
    /* fetchUsers().then(fiedeUsers => {
      console.log(fiedeUsers) */

    let populateQuery = [{ path: 'userId', select: ['username'] }];
    Video.find({ settingId: { $in: [...settingIds] } }, (error, videos) => {
      let videosToReturn = [];
      if (error) {
        reject(error);
      } else if (videos.length > 0) {
        videosToReturn = videos.map(v => {
          const redacted = v.redacted();
          const owner = v.populated('userId') ? v.userId.username : '';
          return { ...redacted, owner };
        });
      }
      resolve(videosToReturn);
    }).populate(populateQuery);
  });
  // })
};

const moment = require('moment');

const fetchdraftVideos = () => {
  return new Promise((resolve, reject) => {
    User.find({}, (error, users) => {
      let draftvideos = [];
      if (error) {
        reject(error);
      } else if (users.length > 0) {
        users.filter(u => {
          if (u.draftMetadataIDs.length > 0) {
            let d = {};
            d.username = u.username;
            d.draftIds = [...u.draftMetadataIDs];
            draftvideos.push(d);
          }
        });
        resolve(draftvideos);
      }
    });
  });
};

// Get the status of a User's videos
router.get('/settings', utilities.authoriseUser, (request, response) => {
  User.findById(request.session.ref, (err, user) => {
    if (!err) {
      utilities
        .dataportenGroupListForUser(user)
        .then(groups => {
          const userGroupIds = groups.map(g => g.id);
          if (request.query.mode == 'Admin') {
            Datasett.find(
              {
                $or: [
                  { accessGroupId: { $in: userGroupIds } },
                  { 'dataManager.oauthID': user.oauthId },
                ],
              },
              (error, datasetts) => {
                let settingsToReturn = [];
                let settingIds = [];
                if (error) {
                  return console.error(error);
                } else if (datasetts.length > 0) {
                  settingsToReturn = [...datasetts];
                  settingsToReturn.forEach(setting => {
                    settingIds.push(setting.id);
                  });
                }
                fetchVideos(settingIds).then(videos => {
                  fetchdraftVideos().then(draftvideos => {
                    response
                      .send({
                        datasetts: settingsToReturn,
                        videologgs: videos,
                        drafts: draftvideos,
                      })
                      .status(200)
                      .end();
                  });
                });
              }
            );
          } else {
            Datasett.find(
              {
                $and: [
                  { 'dataportenGroups.id': { $in: userGroupIds } },
                  { active: 'true' },
                ],
              },
              (error, datasetts) => {
                let settingsToReturn = [];
                if (error) {
                  return console.error(error);
                } else if (datasetts.length > 0) {
                  settingsToReturn = [...datasetts];
                }
                response
                  .send(settingsToReturn)
                  .status(200)
                  .end();
              }
            );
          }
        })
        .catch(error =>
          utilities.errorResponse(
            { status: 400, message: error.toString() },
            response
          )
        );
    } else if (err) {
      utilities.errorResponse(err, response, 400);
    }
  });
});

// To create new datasett from admin portal
router.put('/setting', utilities.authoriseUser, (request, response) => {
  let dataset;
  let tempDataset;
  if (request.query.mode == 'Admin') {
    dataset = request.body.datasett;
    tempDataset = request.body.tempDataset;
  } else if (request.body.id) {
    dataset = { id: request.body.id }
  }

  User.findById(request.session.ref, (err, user) => {
    if (!err) {
      if (!dataset.id && request.query.mode == 'Admin') {
        dataset.dataManager.oauthID = user.oauthId;
        dataset.created = Date.now();
        dataset.utvalg = {};
        dataset.lastUpdated = Date.now();
        Datasett.create(dataset).catch(error => {
          utilities.errorResponse(
            {
              status: 400,
              message:
                'Did not create datasett as name alreay exists. ' + error,
            },
            response
          );
        });
      } else {
        Datasett.findById(dataset.id, async (error, foundDatasett) => {
          if (error || !foundDatasett) {
            utilities.errorResponse(
              { status: 400, message: 'datasett not created' },
              response
            );
          } else {
            const d = foundDatasett;
            if (
              request.query.mode == 'Admin' &&
              moment(d.lastUpdated).unix() ==
                moment(tempDataset.lastUpdated).unix()
            ) {
              d.navn = dataset.navn;
              d.lastUpdated = Date.now();
              d.elementer = dataset.elementer;
              d.dataManager = { ...dataset.dataManager };
              d.description = dataset.description;
              d.utvalgtPriority = dataset.utvalgtPriority;
              d.dataportenGroups = [...dataset.dataportenGroups];
              d.storages = [...dataset.storages];
              d.samtykke = dataset.samtykke;
              d.active = dataset.active;
              d.accessGroupId = dataset.accessGroupId;
              if (dataset.samtykke == 'samtykke') {
                d.formId = dataset.formId;
              } else {
                d.formId = '';
              }
              d.samtykkeHandling = { ...dataset.samtykkeHandling };
              d.utvalg = { ...dataset.utvalg };
              d.save((error, savedDataset) => {
                if (error) {
                  utilities.errorResponse(error, response, 400);
                } else {
                  response
                    .send(request.query.mode == 'Admin' ? savedDataset : {})
                    .status(200)
                    .end();
                }
              });
            } else if (request.query.mode == undefined) {
              updateUtvalg({
                utvalg: d.utvalg,
                path: request.body.path,
                name: request.body.name,
                utvalgKey: d.utvalgtPriority,
              });
              d.lastUpdated = Date.now();
              d.markModified('utvalg');
              d.save((error, savedDataset) => {
                if (error) {
                  utilities.errorResponse(error, response, 400);
                } else {
                  response
                    .send(request.query.mode == 'Admin' ? savedDataset : {})
                    .status(200)
                    .end();
                }
              });
            } else if (
              request.query.mode == 'Admin' &&
              moment(d.lastUpdated).unix() !=
                moment(tempDataset.lastUpdated).unix()
            ) {
              let err = {};
              err.message =
                d.navn + 'is not updated, as the dataset is not latest';
              utilities.errorResponse(err, response, 400);
            }
          }
        });
      }
    } else if (err) {
      utilities.errorResponse(err, response, 400);
    } else {
      utilities.successResponse([], response);
    }
  });
});

router.get(
  '/dataportengroups',
  utilities.authoriseUser,
  (request, response) => {
    User.findById(request.session.ref, (err, user) => {
      if (!err && user.provider === 'Dataporten') {
        utilities
          .dataportenGroupListForUser(user)
          .then(groups => utilities.successResponse(groups, response))
          .catch(error =>
            utilities.errorResponse(
              { status: 400, message: error.toString() },
              response
            )
          );
      } else if (err) {
        utilities.errorResponse(err, response, 400);
      } else {
        utilities.successResponse([], response);
      }
    });
  }
);

module.exports = router;
