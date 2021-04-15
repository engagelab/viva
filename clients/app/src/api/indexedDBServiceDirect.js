import { stores, strings } from '../constants';
// Database Name
const dbName = 'vivaDirect';

let dbOpenRequest;
let db;
let dbReadyCallbacks = [];

/*Initialise DB  */
const createDatabase = () => {
  dbOpenRequest = indexedDB.open(dbName, strings.dbVersion);
  dbOpenRequest.onerror = function() {
    console.log(Error('Error text'));
  };
  dbOpenRequest.onupgradeneeded = () => {
    db = event.target.result;
    const storeNames = Object.keys(stores);
    storeNames.forEach(name => {
      const s = db.createObjectStore(name, {
        keyPath: stores[name].keyPath,
      });
      const indexNames = Object.keys(stores[name].indexes);
      indexNames.forEach(indexName => {
        s.createIndex(indexName, stores[name].indexes[indexName].keys);
      });
    });

    if (dbReadyCallbacks.length > 0) dbReadyCallbacks.forEach(dbc => dbc());
    dbReadyCallbacks = [];
  };
};

const connectDB = () => {
  return new Promise(function(resolve, reject) {
    var dbOpenRequest = indexedDB.open(dbName, strings.dbVersion);
    dbOpenRequest.onsuccess = function() {
      var db = dbOpenRequest.result;
      resolve(db);
    };
    dbOpenRequest.onerror = function() {
      reject(Error('Error text'));
    };
  });
};

const getAllFromStorage = (deviceStatus, { store, index, criteria }) => {
  return new Promise((resolve, reject) => {
    const browser = deviceStatus.browser;
    connectDB().then(db => {
      let getRequest;
      const search = index.keys.map(key => criteria[key]);
      let query;
      if (search.length > 0) {
        browser == 'Safari' ? (query = search[0]) : (query = [...search]);
      }

      let transaction = db.transaction([store.name], 'readonly');
      let objectStore = transaction.objectStore(store.name);
      getRequest = objectStore.index(index.name).getAll(query);

      getRequest.onerror = () => {
        reject(Error('Error text'));
      };
      getRequest.onsuccess = () => {
        if (getRequest.result) resolve(getRequest.result);
        else reject(Error('object not found'));
        db.close();
      };
    });
  });
};

const getOneFromStorage = (deviceStatus, { store, index, criteria }) => {
  return new Promise((resolve, reject) => {
    const browser = deviceStatus.browser;
    connectDB().then(db => {
      let getRequest;
      const search = index.keys.map(key => criteria[key]);
      let query;
      browser == 'Safari' ? (query = search[0]) : (query = [...search]);

      var transaction = db.transaction([store.name], 'readonly');
      var objectStore = transaction.objectStore(store.name);
      getRequest = objectStore.index(index.name).get(query);

      getRequest.onerror = function() {
        reject(Error('Error text'));
      };
      getRequest.onsuccess = () => {
        resolve(getRequest.result);
        db.close();
      };
    });
  });
};
const saveToStorage = ({ store, idbData }) => {
  return new Promise((resolve, reject) => {
    connectDB().then(db => {
      let transaction = db.transaction([store.name], 'readwrite');
      let objectStore = transaction.objectStore(store.name);
      let saveRequest = objectStore.put(idbData); // Overwrite if exists

      saveRequest.onerror = function() {
        console.log(saveRequest.error);
        reject(Error('Error text'));
      };

      saveRequest.onsuccess = function() {
        resolve('Data saved OK');
        db.close();
      };
    });
  });
};

// Remove an item from a given IDB store
const removeFromStorage = ({ store, index, criteria }) => {
  return new Promise((resolve, reject) => {
    connectDB().then(db => {
      let search = index.keys.map(key => {
        if (Object.prototype.hasOwnProperty.call(criteria, key))
          return criteria[key];
      });
      search = search.length == 1 ? search[0] : search;
      if (search) {
        let transaction = db.transaction([store.name], 'readwrite');
        let objectStore = transaction.objectStore(store.name);

        let deleteRequest = objectStore.delete(search);
        deleteRequest.onerror = function() {
          reject(Error('Error text'));
        };

        deleteRequest.onsuccess = function() {
          resolve('Data saved OK');
          db.close();
        };
      }
    });
  });
};
const getStorageEstimate = callbackFn => {
  navigator.storage.estimate().then(estimate => {
    callbackFn(estimate);
  });
};

const registerOnetimeDBReadyCallback = callbackFn => {
  dbReadyCallbacks.push(callbackFn);
};

const dbExists = () => !!db;

export default {
  createDatabase,
  connectDB,
  getAllFromStorage,
  getOneFromStorage,
  saveToStorage,
  removeFromStorage,
  getStorageEstimate,
  registerOnetimeDBReadyCallback,
  dbExists,
};
