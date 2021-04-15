/*
 Copyright 2018 Richard Nesnass and Sharanya Manivasagam
*/
import { serverService } from '../../api/communication'
import Vue from 'vue'
import Datasett from './Dataset'

export default {
  // Setting,
  namespaced: true,
  state: {
    settings: [],
    selectedDatasett: undefined,
    presetDatasett: undefined,
    selectedDatasettConsents: []
  },
  getters: {
    selectedDatasett: state => state.selectedDatasett,
    settings: state => state.settings,
    presetDatasett: state => state.presetDatasett,
    settingById: state => id => state.settings.find(s => s.id == id),
    selectedDatasetInfo: state => {
      const utvalg = state.presetDatasett.utvalg.map(
        utvalg => `${utvalg.keyName}:${utvalg.title}`
      )
      return {
        name: state.selectedDatasett.navn,
        utvalg,
        id: state.selectedDatasett.id
      }
    },
    consents: state => state.selectedDatasettConsents
  },
  mutations: {
    selectDatasett (state, setting) {
      state.selectedDatasett = setting
    },
    clearSettings (state) {
      state.settings = []
    },
    addSetting (state, setting) {
      state.settings.push(setting)
    },
    setUtvalg (state, inputAttribute) {
      Vue.set(state.utvalg123, 'utvalg', inputAttribute)
    },
    setPresetDatasett (state, preset) {
      state.presetDatasett = preset
    },
    updateDatasett (state, datasett) {
      const index = state.settings.findIndex(s => s.id == datasett.id)
      Vue.set(state.settings, index, datasett)
      state.selectedDatasett = datasett
    },
    replaceConsents (state, consents) {
      state.selectedDatasettConsents = consents
    },
    lockUtvalg (state, { datasettId, utvalg }) {
      state.presetDatasett.locks[datasettId] = { date: Date.now(), utvalg }
    },
    unlockUtvalg (state, datasettId) {
      delete state.presetDatasett.locks[datasettId]
    }
  },
  actions: {
    errorMessage ({ commit }, error) {
      let errorMessage = error.message || error
      errorMessage += error.code ? ` Code: ${error.code}` : ''
      console.log(`Error: ${errorMessage}`)
      commit(
        'general/setSnackbar',
        {
          visibility: true,
          text: errorMessage,
          type: 'error',
          callback: undefined
        },
        { root: true }
      )
    },
    selectDatasett ({ commit }, setting) {
      commit('selectDatasett', setting)
    },
    selectSettingById ({ state, commit }, settingId) {
      const setting = state.settings.find(s => s.id == settingId)
      if (setting) {
        commit('selectDatasett', setting)
      } else {
        commit('selectDatasett', undefined)
      }
    },
    fetchSettings ({ state, commit, dispatch }) {
      return serverService
        .request({
          route: '/api/settings',
          method: 'GET',
          credentials: true,
          body: {}
        })
        .then(settings => {
          commit('clearSettings')
          settings.forEach(s => {
            const newSetting = new Datasett(s)
            commit('addSetting', newSetting)
            if (
              state.presetDatasett &&
              state.presetDatasett.id == newSetting.id
            ) {
              commit('selectDatasett', newSetting)
            }
          })
        })
        .catch(error => {
          dispatch('errorMessage', error)
        })
    },
    updateDatasett ({ dispatch }, utvalgUpdate) {
      return serverService
        .request({
          route: '/api/setting',
          method: 'PUT',
          credentials: true,
          body: utvalgUpdate
        })
        .catch(error => {
          dispatch('errorMessage', error)
        })
    },
    setPresetDatasett ({ dispatch, commit }, dataset) {
      if (dataset) {
        dispatch('selectSettingById', dataset.id)
      }
      if (!dataset.locks) dataset.locks = {}
      commit('setPresetDatasett', dataset)
    },
    addUtvalgToDatasett (
      { state, dispatch, commit },
      { path, newUtvalgName, datasett }
    ) {
      const newDataset = new Datasett(datasett)
      let subSetToAddTo = newDataset.utvalg
      let key
      path.forEach((p, index) => {
        key = newDataset.utvalgtPriority[index]
        subSetToAddTo = subSetToAddTo[key].find(item => item.title == p)
      })
      key = newDataset.utvalgtPriority[path.length]
      if (!subSetToAddTo[key]) {
        subSetToAddTo[key] = []
      }
      const item = { title: newUtvalgName }
      if (path.length + 1 < newDataset.utvalgtPriority.length) {
        const nextKeyDown = newDataset.utvalgtPriority[path.length + 1]
        item[nextKeyDown] = []
      }
      subSetToAddTo[key].push(item)
      commit('updateDatasett', newDataset)
      dispatch('updateDatasett', { id: datasett.id, path, name: newUtvalgName })
    },
    fetchConsents ({ state, commit, dispatch }, video) {
      // Relies on a setting being already selected
      const settingForVideo = state.settings.find(s => s.id == video.settingId)
      serverService
        .request({
          route: '/api/consents',
          method: 'GET',
          params: {
            datasettId: video.settingId,
            formId: settingForVideo.formId,
            utvalg: video.datasetInfo.utvalg
          },
          credentials: true,
          body: undefined
        })
        .then(consents => {
          if (consents.message) {
            dispatch(
              'errorMessage',
              'Error fetching consents from TSD: ' + consents.message
            )
          } else {
            commit(
              'replaceConsents',
              consents.map(c => ({ ...c, checked: false }))
            )
          }
        })
        .catch(error => {
          dispatch('errorMessage', error)
        })
    }
  }
}
