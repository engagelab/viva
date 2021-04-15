/*
 Designed and developed by Richard Nesnass & Sharanya Manivasagam
*/
const Datasett = require('./models/Datasett')
const moment = require('moment');

const addZero = i => {
  return i < 10 ? '0' + i : i
}
const asFormattedDateString = date => {
  return (
    date.getDate() +
    '-' +
    (date.getMonth() + 1) +
    '-' +
    date.getFullYear() +
    '_' +
    addZero(date.getHours()) +
    '-' +
    addZero(date.getMinutes())
  )
}

const formPath = (path, datasett, video) => {
  return new Promise((resolve, reject) => {
    let folder = '';
    // const regex = / /g;
    path.forEach(p => {
      if (p.length != 0) {
        if (p == 'datasettName')
          folder = folder + '/' + datasett.navn;
        if (p == 'fileId')
          folder =
            folder + '/' + video.fileId.substring(0, 7);
        if (p == 'timeStamp') {
          folder =
            folder + '/' + moment(video.created).format('DD-MMM-YYYY-hh-mm-ss');
        }
        if (p == 'dataManager') {
          folder = folder + '/' + datasett.dataManager.name;
        }
        if (p == 'UserID') {
          folder = folder + '/' + video.userId;
        }
      }

    });
    if (folder.indexOf('/') == 0)
      folder = folder.slice(1);
    if (folder)
      resolve(folder)
    else
      reject('Path not found')
  });


}

/* Fetch Storage location from Datasett for selected video */
const fetchStorage = async video => {
  try {
    let datasett = await Datasett.findById(video.settingId)

    let promises =  datasett.storages.map(async storage => {
      let store= await fetchStore({
         storage:storage,
         datasett: datasett,
         video:video
      })
      return store;
    })
    const stores = await Promise.all(promises)
    return  stores;
  } catch (error) {
    console.log(error)
  }
}
const fetchStore = (video) => {
  return new Promise((resolve, reject) => {
    const store = {};
    const slashes = /[/]/g;
    let path = formPath(
      video.storage.storagePath.path,
      video.datasett,
      video.video);
    let fileName = formPath(
      video.storage.storagePath.fileName,
      video.datasett,
      video.video);
     Promise.all([path, fileName]).then((paths) => {

      if (video.storage.name == 'lagringshotell') {
        let basePath = '';
        if (process.env.LAGRINGSHOTELL) {
          basePath = process.env.LAGRINGSHOTELL;
        }
        else { basePath = '/Users/sharanya/Projects/sidok/videos' + '/' }
        const regex = / /g
        if (video.storage.groupId)
          store.path = basePath + video.storage.groupId + '/' + paths[0]
        else
          store.path = basePath + paths[0]
        store.path = store.path.replace(regex, "");
        store.type = 'lagringshotell';
        store.fileName = paths[1].replace(slashes, "-");
      } else if (video.storage.name == 'google') {
        store.path = paths[0]
        store.type = 'google'
      } else {
        store.path = ''
        store.type = 'unknownStorageType'
      }
      resolve(store)
    })
   }).catch(error => reject(error));
}

module.exports = {
  asFormattedDateString,
  fetchStorage,
  formPath
}
