/*
 Copyright 2018 Richard Nesnass and Sharanya Manivasagam
*/
import Vue from 'vue';
import Router from '../../router';
import { serverService } from '../../api/communication';
import webcryptoService from '../../api/webCryptoService';
import constants from '../../constants';
const { appVersion } = constants.strings;

export default {
  namespaced: true,
  state: {
    selectedUser: undefined,
    hostType: 'tablet',
    isLoggedIn: false,
    isAuthorised: false,
    useCordova: false,
    appIsOld: false,
    dialog: {
      visible: false,
      data: undefined, // Data object to pass to the child dialog
      doneCallback: undefined, // Callback function from the originating component
    },
    deviceStatus: {
      mobile: false,
      browser: '',
      isFullScreen: false,
      lastActive: new Date().getTime(), // ms from epoch
    },
    serverStatus: {
      cpuload: {},
    },
    snackbar: {
      visibility: false, // A toggle for showing error messages to the user
      text: '',
      callback: undefined,
    },
  },
  getters: {
    // General getters
    hostType: state => state.hostType,
    isLoggedIn: state => state.isLoggedIn,
    isAuthorised: state => state.isAuthorised,
    dialog: state => state.dialog,
    useCordova: state => state.useCordova,
    appIsOld: state => state.appIsOld,

    // User specific getters
    user: state => state.selectedUser,
    lastActive: state => state.deviceStatus.lastActive,
    deviceStatus: state => state.deviceStatus,
    isFullScreen: state => state.deviceStatus.isFullScreen,
    serverStatus: state => state.serverStatus,
    snackbar: state => state.snackbar,
  },
  mutations: {
    // Not called outside of this store (test actions instead)
    hostType(state, type) {
      state.hostType = type;
    },
    useCordova(state) {
      state.useCordova = true;
    },
    // Not called outside of this store (test actions instead)
    isLoggedIn(state, bool) {
      state.isLoggedIn = bool;
    },
    // Not called outside of this store (test actions instead)
    isAuthorised(state, bool) {
      state.isAuthorised = bool;
    },
    isFullScreen(state, boolean) {
      Vue.set(state.deviceStatus, 'isFullScreen', boolean);
    },
    activeNow(state) {
      Vue.set(state.deviceStatus, 'lastActive', new Date().getTime());
    },
    // Not called outside of this store (use actions instead)
    // User specific mutations
    clearUser(state) {
      state.selectedUser = undefined;
    },
    // Not called outside of this store (use actions instead)
    selectUser(state, user) {
      state.selectedUser = user;
    },
    // Not called outside of this store (use actions instead)
    deviceStatus(state, deviceStatus) {
      state.deviceStatus = deviceStatus;
    },
    // Not called outside of this store (use actions instead)
    serverStatus(state, serverStatus) {
      state.serverStatus = serverStatus;
    },
    // Not called outside of this store (use actions instead)
    updateUser(state, user) {
      state.selectedUser = user;
    },
    /* Update the  draftMetaDataID for logged user which would be
       used a reference to fetch front end data */
    addDraftmetadataId(state, fileID) {
      state.selectedUser.draftMetadataIDs.push(fileID);
    },
    removeDraftmetadataIds(state, fileID) {
      const i = state.selectedUser.draftMetadataIDs.indexOf(fileID);
      if (i > -1) {
        if (!state.selectedUser.removedDraftMetadataIDs)
            Vue.set(state.selectedUser, 'removedDraftMetadataIDs', []);
        state.selectedUser.removedDraftMetadataIDs.push(state.selectedUser.draftMetadataIDs[i]);
        state.selectedUser.draftMetadataIDs.splice(i, 1);
      }
    },
    setDialog(state, data) {
      state.dialog = data;
    },
    setSnackbar(state, snackbar) {
      state.snackbar = { ...snackbar };
    },
    appIsOld(state) {
      state.appIsOld = true;
    }
  },
  actions: {
    setSnackbar({ commit }, message) {
      commit('setSnackbar', {
        visibility: true,
        text: message,
        callback: undefined,
      });
    },
    errorMessage({ commit, dispatch }, error) {
      let errorMessage = error.message || error;
      errorMessage += error.code ? ` Code: ${error.code}` : '';
      console.log(`Error: ${errorMessage}`);
      if (errorMessage == 'Invalid login') {
        dispatch('logout');
        window.setTimeout(() => {
          commit('setSnackbar', {
            visibility: true,
            text: errorMessage + '. Vennligst logg inn igjen',
            type: 'error',
            callback: undefined,
          });
        }, 2000);
      }
      commit('setSnackbar', {
        visibility: true,
        text: errorMessage,
        type: 'error',
        callback: undefined,
      });
    },
    detectDevice({ commit }) {
      const ua = navigator.userAgent;
      console.log(ua);
      const deviceStatus = {
        mobile: ua.indexOf('Mobi') !== -1,
        browser:
          ua.indexOf('Chrome') !== -1 && ua.indexOf('Safari') !== -1
            ? 'Chrome'
            : 'Safari',
      };
      commit('deviceStatus', deviceStatus);
    },
    detectAppVersion({ commit }) {
      serverService
        .request({
          route: '/api/appversion',
          method: 'GET',
          contentType: 'text/html'
        })
        .then((version) => {
          if (appVersion !== version) {
            commit('appIsOld')
            commit('setSnackbar', {
              visibility: true,
              text: 'Viva appen er en eldre versjon, og du må laste ned en ny versjon fra Appstore',
              callback: undefined,
            });
          }
        })
    },
    logout({ state, commit }) {
      commit('clearUser');
      commit('isLoggedIn', false);
      commit('isAuthorised', false);
      commit('video/clearDataUponLogout', null, { root: true });
      commit('video/abortAllUploads', null, { root: true });
      serverService
        .request({
          route: '/auth/logout',
          method: 'GET',
        })
        .then(() => {
          Router.push('/logout');
        })
        .catch(err => console.log(err));
    },
    // Used by mobile app to exchange token for session.
    // Token is attached inside communication.js
    // Token is only used if session is not available
    getLoginSession({ dispatch }, code) {
      return serverService
        .request({
          route: '/auth/token',
          method: 'GET',
          credentials: true,
          body: {},
        })
        .catch(error => {
          console.log(error);
          dispatch('logout');
        });
    },
    // Called after successful login to retieve user and mark as 'logged in'
    redirectedLogin({ state, dispatch, commit }) {
      const errorOnLogin = error => {
        commit('setSnackbar', {
          visibility: true,
          text: error,
          callback: undefined,
        });
        dispatch('logout');
      };

      const completeLogin = () => {
        return serverService
          .request({
            route: '/api/user',
            method: 'GET',
            credentials: true,
            body: {},
          })
          .then(response => {
            const user = response ? response.user : false;
            if (user) {
              commit('isLoggedIn', true);
              commit('isAuthorised', true);
              commit('activeNow');
              commit('selectUser', user);
              dispatch('setting/setPresetDatasett', user.datasett, {
                root: true,
              });
            } else {
              return errorOnLogin('User not found');
            }

            // Check for an encryptionKey, create one and save, if not found
            // This key is needed at the top level to encrypt Video metadata items
            // The entire User model should not persist in browser and be removed from browser on logout
            if (!user.encryptionKey && !state.useCordova) {
              // Generate a key, export and convert to string for storage sever-side
              return webcryptoService.generateKey().then(key => {
                webcryptoService.keyToString(key).then(exportedKey => {
                  user.encryptionKey = exportedKey;
                  dispatch('updateUser', user);
                });
              });
            }
          })
          .catch(error => {
            return errorOnLogin(error);
          });
      };
      return completeLogin();
    },
    updateUser({ commit, dispatch, rootGetters }, user) {
      user.datasett = rootGetters['setting/presetDatasett'];
      return serverService
        .request({
          route: '/api/user',
          method: 'PUT',
          credentials: true,
          body: user,
        })
        .then(u => commit('updateUser', u))
        .catch(error => {
          dispatch('errorMessage', error);
        });
    },
  },
};
