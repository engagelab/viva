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
  DatasetSelection,
} from '../types/main'
import { apiRequest } from '../api/apiRequest'
import { useNotifyStore } from './useNotifyStore'
const { actions: notifyActions } = useNotifyStore()
//State
interface DatasetState {
  datasets: Dataset[]
  selectedDataset: Dataset | undefined
  presetDatasetConfig: UserDatasetConfig | undefined
  selectedDatasetConsents: Consent[]
}

interface SelectionOptions {
  path: string[]
  newSelectionName: string
  dataset: Dataset
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
  selectedDataset: ComputedRef<Dataset | undefined>
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
    return computed(() => state.value.selectedDatasetConsents)
  },
}
//Actions
interface Actions {
  datasetById: (id: string) => ComputedRef<Dataset | undefined>
  selectDataset: (dataset: Dataset | undefined) => void
  selectDatasetById: (datasetId: string) => void
  lockSelection: (d: { datasetId: string; lock: DatasetLock }) => void
  unlockSelection: (datasetId: string) => void
  fetchDatasets: () => Promise<void>
  setPresetDatasetConfig: (config: UserDatasetConfig) => void
  addSelectionToDataset: (data: SelectionOptions) => void
  fetchConsents: (video: Video) => void
}

const actions = {
  datasetById(id: string): ComputedRef<Dataset | undefined> {
    return computed(() =>
      state.value.datasets.find((d: Dataset) => id === d._id)
    )
  },
  selectDataset(dataset: Dataset | undefined): void {
    state.value.selectedDataset = dataset
  },
  selectDatasetById(datasetId: string): void {
    const dataset = state.value.datasets.find((s) => s._id == datasetId)
    if (dataset) state.value.selectedDataset = dataset
    else state.value.selectedDataset = undefined
  },
  lockSelection(d: { datasetId: string; lock: DatasetLock }): void {
    const pc = state.value.presetDatasetConfig
    if (pc && pc.locks[d.datasetId]) pc.locks[d.datasetId] = d.lock
  },
  unlockSelection(datasetId: string): void {
    const pc = state.value.presetDatasetConfig
    if (pc && pc.locks[datasetId]) delete pc.locks[datasetId]
  },
  fetchDatasets(): Promise<void> {
    const payload: APIRequestPayload = {
      method: XHR_REQUEST_TYPE.GET,
      route: '/api/datasets',
      credentials: true,
    }
    return apiRequest<Dataset[]>(payload)
      .then((datasets) => {
        state.value.datasets = []
        if (datasets.length > 0) {
          datasets.forEach((s) => {
            const newDataset = new Dataset(s)
            state.value.datasets.push(newDataset)
            if (
              state.value.presetDatasetConfig &&
              state.value.presetDatasetConfig.id == newDataset._id
            ) {
              state.value.selectedDataset = newDataset
            }
          })
        } else {
          notifyActions.errorMessage(new Error('No datasets found'))
        }
      })
      .catch((error: Error) => {
        notifyActions.errorMessage(error)
      })
  },
  setPresetDatasetConfig(config: UserDatasetConfig): void {
    state.value.presetDatasetConfig = config
    const d = state.value.datasets.find((ds) => ds._id === config.id)
    if (d) state.value.selectedDataset = d
  },
  addSelectionToDataset(data: SelectionOptions): void {
    const newDataset = new Dataset(data.dataset)
    let subSetToAddTo = newDataset.selection
    let key: string
    data.path.forEach((p, index) => {
      key = newDataset.selectionPriority[index]
      const subset = subSetToAddTo[key].find((item) => item.title == p)
      if (subset && subset.selection) subSetToAddTo = subset.selection
    })
    key = newDataset.selectionPriority[data.path.length]
    if (!subSetToAddTo[key]) {
      subSetToAddTo[key] = []
    }
    const newItem: DatasetSelection = {
      title: data.newSelectionName,
      selection: {},
    }
    if (data.path.length + 1 < newDataset.selectionPriority.length) {
      const nextKeyDown = newDataset.selectionPriority[data.path.length + 1]
      if (newItem.selection) newItem.selection[nextKeyDown] = []
    }
    subSetToAddTo[key].push(newItem)
    const payload: APIRequestPayload = {
      method: XHR_REQUEST_TYPE.PUT,
      credentials: true,
      route: '/api/dataset/selection',
      body: {
        _id: data.dataset._id,
        path: data.path,
        name: data.newSelectionName,
      },
    }
    apiRequest(payload).then(() => {
      if (state.value.selectedDataset) {
        state.value.selectedDataset.selection = newDataset.selection
      }
    })
  },
  fetchConsents(video: Video): void {
    // Relies on a setting being already selected
    const datasetForVideo: Dataset | undefined = state.value.datasets.find(
      (d) => d._id == video.dataset.id
    )
    const utvalg = video.dataset.selection.map((i) => `${i.keyName}:${i.title}`)
    if (datasetForVideo) {
      const payload: APIRequestPayload = {
        method: XHR_REQUEST_TYPE.GET,
        route: '/api/consents',
        query: {
          datasetId: video.dataset.id,
          utvalg,
          formId: datasetForVideo.formId,
        },
        credentials: true,
        body: undefined,
      }
      apiRequest<Consent[]>(payload)
        .then((consents: Consent[]) => {
          if (consents.length > 0) {
            state.value.selectedDatasetConsents = consents.map((c) => ({
              ...c,
              checked: false,
            }))
          } else {
            notifyActions.errorMessage(new Error('No consents found'))
          }
        })
        .catch((error: Error) => {
          notifyActions.errorMessage(error)
        })
    }
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
