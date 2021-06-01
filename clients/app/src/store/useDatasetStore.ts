// Store to do dataset functions (Mostly in admin side)
/* ---- Functionaltiy to be done  ----------------
1. Display datasets
2. Create / update dataset
3. Fetch consents either using feide token or canvas token  */

import { ref, Ref, computed, ComputedRef } from 'vue'
import {
  DatasetData,
  Dataset,
  Video,
  Consent,
  APIRequestPayload,
  XHR_REQUEST_TYPE,
} from '../types/main'
import { apiRequest } from '../api/apiRequest'
import { useVideoStore } from './useVideoStore'
import { useAppStore } from './useAppStore'
const { getters: videoGetters, actions: videoActions } = useVideoStore()
const { getters: appGetters, actions: appActions } = useAppStore()
//State
interface DatasetState {
  datasets: Dataset[]
  selectedDataset: Dataset | undefined
  presetDataset: Dataset | undefined
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
  selectedDataset: undefined,
  datasets: [],
  presetDataset: undefined,
  selectedDatasettConsents: [],
})

//----------------- Server side functions----------------//

async function fetchDatasets(): Promise<DatasetData> {
  const payload: APIRequestPayload = {
    method: XHR_REQUEST_TYPE.GET,
    credentials: true,
    route: '/api/dataset',
  }
  return apiRequest<DatasetData>(payload)
}

async function saveDataset(dataset: Dataset): Promise<DatasetData> {
  const payload: APIRequestPayload = {
    method: XHR_REQUEST_TYPE.POST,
    credentials: true,
    route: '/api/dataset',
    body: dataset,
  }
  return apiRequest<DatasetData>(payload)
}

//Getters
interface Getters {
  datasets: ComputedRef<Dataset[]>
  selectedDataset: ComputedRef<State['selectedDataset']>
}
const getters = {
  get datasets(): ComputedRef<Dataset[]> {
    return computed(() => state.value.datasets)
  },
  get selectedDataset(): ComputedRef<Dataset> {
    return computed(() => state.value.selectedDataset)
  },
  get presetDataset(): ComputedRef<Dataset> {
    return computed(() => state.value.selectedDataset)
  },
  get consents(): ComputedRef<Dataset> {
    return computed(() => state.value.selectedDatasettConsents)
  },
}
//Actions
interface Actions {
  datasetById: (id: string) => ComputedRef<Dataset>
  errorMessage: (error: Error) => void
  selectDataset: (dataset: Dataset) => void
  selectDatasetById: (datasetId: string) => void
  fetchDatasets: () => Promise<void>
  setPresetDataset: (id: string) => void
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
    appActions.setSnackbar(errorMessage)
  },
  selectDataset(dataset: Dataset): void {
    state.value.selectedDataset = dataset
  },
  selectDatasetById(datasetId: string): void {
    const dataset = state.value.datasets.find((s) => s._id == datasetId)
    if (dataset) state.value.selectedDataset = dataset
    else state.value.selectedDataset = undefined
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
            state.value.presetDatasett &&
            state.value.presetDatasett.id == newDataset.id
          ) {
            state.value.selectedDataset = newDataset
          }
        })
      })
      .catch((error) => {
        dispatch('errorMessage', error)
      })
  },
  setPresetDataset(id: string): void {
    const d = state.value.datasets.find((ds) => ds._id === id)
    if (d) {
      state.value.selectedDataset = d
      state.value.presetDataset = d
    }
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
