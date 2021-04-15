/* eslint-disable no-unused-vars */
import { openDB } from 'idb/with-async-ittr.js';
import { stores, strings } from '../constants';

const dbName = 'viva';
let db;
let dbReadyCallback;

// Create DB
const createDatabase = async () => {
  if (!('indexedDB' in window)) {
    throw new Error('Browser does not support IndexedDB');
  }
  // Retrieve specific structure data from constants.js
  db = await openDB(dbName, strings.dbVersion, {
    upgrade(db) {
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
    },
  });
  if (db && dbReadyCallback) dbReadyCallback();
};

// Fetch ALL items matching the given indexes from IndexDB
// criteria should hold the relevant key to search by
// e.g. if searching by the 'settingId' index ==> criteria = { settingId: '123xyz...' }
// 'store' and 'index' values should be referrenced from constants.js
const getAllFromStorage = ({ store, index, criteria }) => {
  const search = index.keys.map(key => criteria[key]);
  return db
    .getAllFromIndex(store.name, index.name, search)
    .catch(error => Promise.reject(error));
};

// Fetch a single item from a given index and store
const getOneFromStorage = ({ store, index, criteria }) => {
  const search = index.keys.map(key => criteria[key]);
  return db
    .getFromIndex(store.name, index.name, search)
    .catch(error => Promise.reject(error));
};

// Save an item to a given IDB store
const saveToStorage = ({ store, data }) => {
  return db.put(store.name, data).catch(error => Promise.reject(error));
};

// Remove an item from a given IDB store
const removeFromStorage = ({ store, index, criteria }) => {
  let search = index.keys.map(key => criteria[key]);
  search = search.length == 1 ? search[0] : search;
  return db.delete(store.name, search).catch(error => Promise.reject(error));
};

const getStorageEstimate = callbackFn => {
  navigator.storage.estimate().then(estimate => {
    callbackFn(estimate);
  });
};

const registerDBReadyCallback = callbackFn => {
  dbReadyCallback = callbackFn;
};

const dbExists = () => !!db;

export default {
  createDatabase,
  getAllFromStorage,
  getOneFromStorage,
  saveToStorage,
  removeFromStorage,
  getStorageEstimate,
  registerDBReadyCallback,
  dbExists,
};
