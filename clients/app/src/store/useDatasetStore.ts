// Store to do dataset functions (Mostly in admin side)
/* ---- Functionaltiy to be done  ----------------
1. Display datasets
2. Create / update dataset
3. Fetch consents either using feide token or canvas token  */

import { ref, Ref, computed, ComputedRef } from 'vue'
import {
  Dataset,
  Video,
  Consent,
  UserDatasetConfig,
  DatasetLock,
  APIRequestPayload,
  XHR_REQUEST_TYPE,
} from '../types/main'
import { apiRequest } from '../api/apiRequest'
import { useAppStore } from './useAppStore'
const { actions: appActions } = useAppStore()
//State
interface DatasetState {
  datasets: Dataset[]
  selectedDataset: Dataset | undefined
  presetDatasetConfig: UserDatasetConfig | undefined
  selectedDatasetConsents: Consent[]
}

interface DatasetSelection {
  _id: string
  name: string
  path: string[]
}
interface SelectionOptions {
  path: string[]
  newSelectionName: string
  datasett: Dataset
}

const state: Ref<DatasetState> = ref({
  datasets: [],
  selectedDataset: undefined,
  presetDatasetConfig: undefined,
  selectedDatasetConsents: [],
})

//Getters
interface Getters {
  datasets: ComputedRef<Dataset[]>
  selectedDataset: ComputedRef<Dataset>
  presetDatasetConfig: ComputedRef<UserDatasetConfig | undefined>
  consents: ComputedRef<Consent[]>
}
const getters = {
  get datasets(): ComputedRef<Dataset[]> {
    return computed(() => state.value.datasets)
  },
  get selectedDataset(): ComputedRef<Dataset | undefined> {
    return computed(() => state.value.selectedDataset)
  },
  get presetDatasetConfig(): ComputedRef<UserDatasetConfig | undefined> {
    return computed(() => state.value.presetDatasetConfig)
  },
  get consents(): ComputedRef<Consent[]> {
    return computed(() => state.value.selectedDatasettConsents)
  },
}
//Actions
interface Actions {
  datasetById: (id: string) => ComputedRef<Dataset>
  errorMessage: (error: Error) => void
  selectDataset: (dataset: Dataset) => void
  selectDatasetById: (datasetId: string) => void
  lockSelection: (d: { datasettId: string; lock: DatasetLock }) => void
  unlockSelection: (datasettId) => void
  fetchDatasets: () => Promise<void>
  setDatasetConfig: (config: UserDatasetConfig) => void
  addSelectionToDataset: (data: SelectionOptions) => void
  fetchConsents: (video: Video) => void
}

const actions = {
  datasetById(id: string): ComputedRef<Dataset> {
    return computed(() =>
      state.value.datasets.find((d: Dataset) => id === d._id)
    )
  },
  errorMessage(error: Error): void {
    let errorMessage = error.message || error
    errorMessage += error.code ? ` Code: ${error.code}` : ''
    console.log(`Error: ${errorMessage}`)
    appActions.setSnackbar({
      visibility: true,
      text: errorMessage,
      type: 'error',
      callback: undefined,
    })
  },
  selectDataset(dataset: Dataset): void {
    state.value.selectedDataset = dataset
  },
  selectDatasetById(datasetId: string): void {
    const dataset = state.value.datasets.find((s) => s._id == datasetId)
    if (dataset) state.value.selectedDataset = dataset
    else state.value.selectedDataset = undefined
  },
  lockSelection(d: { datasettId: string; lock: DatasetLock }): void {
    state.value.presetDatasetConfig.locks[d.datasettId] = d.lock
  },
  unlockSelection(datasettId): void {
    delete state.value.presetDatasetConfig.locks[datasettId]
  },
  fetchDatasets(): Promise<void> {
    const payload: APIRequestPayload = {
      method: XHR_REQUEST_TYPE.GET,
      route: '/api/datasets',
      credentials: true,
    }
    return apiRequest(payload)
      .then((datasets) => {
        state.value.datasets = []
        datasets.forEach((s) => {
          const newDataset = new Datasett(s)
          state.value.datasets.push(newDataset)
          if (
            state.value.presetDatasetConfig &&
            state.value.presetDatasetConfig.id == newDataset.id
          ) {
            state.value.selectedDataset = newDataset
          }
        })
      })
      .catch((error) => {
        dispatch('errorMessage', error)
      })
  },
  setDatasetConfig(config: UserDatasetConfig): void {
    state.value.presetDatasetConfig = config
    const d = state.value.datasets.find((ds) => ds._id === config.id)
    if (d) state.value.selectedDataset = d
  },
  addSelectionToDataset(data: SelectionOptions): void {
    const newDataset = new Datasett(data.datasett)
    let subSetToAddTo = newDataset.selection
    let key
    data.path.forEach((p, index) => {
      key = newDataset.selectionPriority[index]
      subSetToAddTo = subSetToAddTo[key].find((item) => item.title == p)
    })
    key = newDataset.selectionPriority[data.path.length]
    if (!subSetToAddTo[key]) {
      subSetToAddTo[key] = []
    }
    const newItem = { title: data.newSelectionName }
    if (data.path.length + 1 < newDataset.selectionPriority.length) {
      const nextKeyDown = newDataset.selectionPriority[path.length + 1]
      newItem[nextKeyDown] = []
    }
    subSetToAddTo[key].push(newItem)
    const payload: APIRequestPayload = {
      method: XHR_REQUEST_TYPE.PUT,
      credentials: true,
      route: '/api/dataset/selection',
      body: { _id: datasett.id, path, name: data.newSelectionName },
    }
    apiRequest<DatasetSelection>(payload).then(() => {
      state.value.selectedDataset.selection = newDataset.selection
    })
  },
  fetchConsents(video: Video): void {
    // Relies on a setting being already selected
    const datasetForVideo: Dataset = state.value.datasets.find(
      (d) => d._id == video.dataset.id
    )
    const payload: APIRequestPayload = {
      method: XHR_REQUEST_TYPE.GET,
      route: '/api/consents',
      params: {
        datasetId: video.dataset.id,
        utvalg: video.dataset.selection,
        formId: datasetForVideo.formId,
      },
      credentials: true,
      body: undefined,
    }
    apiRequest(payload)
      .then((consents: Consent[]) => {
        state.value.selectedDatasetConsents = consents.map((c) => ({
          ...c,
          checked: false,
        }))
      })
      .catch((error: Error) => {
        this.errorMessage(error)
      })
  },
}

// This defines the interface used externally
interface ServiceInterface {
  actions: Actions
  getters: Getters
}
export function useDatasetStore(): ServiceInterface {
  return {
    getters,
    actions,
  }
}

export type DatasetStoreType = ReturnType<typeof useDatasetStore>
