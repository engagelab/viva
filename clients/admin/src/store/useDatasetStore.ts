// Store to do dataset functions (Mostly in admin side)
/* ---- Functionaltiy to be done  ----------------
1. Display datasets
2. Create / update dataset
3. Fetch consents either using feide token or canvas token  */

import { ref, Ref, computed, ComputedRef } from 'vue'
import {
  Dataset,
  DatasetSelection,
  Video,
  APIRequestPayload,
  XHR_REQUEST_TYPE,
} from '../types/main'
import { apiRequest } from '../api/apiRequest'
import { useAppStore } from './useAppStore'
const { actions: appActions } = useAppStore()
//State
interface DatasetState {
  selectedDataset: Dataset
  datasets: Map<string, Dataset>
}
const state: Ref<DatasetState> = ref({
  selectedDataset: new Dataset(),
  datasets: new Map(),
})

interface ResponseData {
  datasets: Dataset[] | undefined
  videos: Video[] | undefined
  draftUsers: string[] | undefined
}

//----------------- Server side functions----------------//

// async function saveDataset(dataset: Dataset): Promise<Dataset> {
//   const payload: APIRequestPayload = {
//     method: XHR_REQUEST_TYPE.POST,
//     credentials: true,
//     route: '/api/dataset',
//     query: { dataset },
//   }
//   return apiRequest<Dataset>(payload)
// }

//Getters
interface Getters {
  datasets: ComputedRef<Dataset[]>
  selectedDataset: ComputedRef<DatasetState['selectedDataset']>
}
const getters = {
  get datasets(): ComputedRef<Dataset[]> {
    return computed(() => Array.from(state.value.datasets.values()))
  },
  get selectedDataset(): ComputedRef<DatasetState['selectedDataset']> {
    return computed(() => state.value.selectedDataset)
  },
}
//Actions
interface Actions {
  // datasetById: (id: string) => ComputedRef<Dataset | undefined>
  // errorMessage: (error: Error) => void
  // selectDataset: (dataset: Dataset | undefined) => void
  // selectDatasetById: (datasetId: string) => void
  // lockSelection: (d: { datasetId: string; lock: DatasetLock }) => void
  // unlockSelection: (datasetId: string) => void
  // setPresetDatasetConfig: (config: UserDatasetConfig) => void
  // addSelectionToDataset: (data: SelectionOptions) => void
  // fetchConsents: (video: Video) => void
  fetchDatasets: () => Promise<void>
  addDataset: (datasetName: string) => Promise<void>
  updateDataset: () => Promise<void>
  addSelectionPriority: (selectionPriority: string) => void
  selectDatasetById: (datasetId: string) => void
  addSelection: (selectionPriority: string, subset: DatasetSelection) => void
}

const actions = {
  //Fetch all datasets for the user
  fetchDatasets(): Promise<void> {
    const payload: APIRequestPayload = {
      method: XHR_REQUEST_TYPE.GET,
      route: '/api/datasets',
      credentials: true,
    }
    return apiRequest<ResponseData>(payload)
      .then((data) => {
        if (data.datasets && data.datasets.length !== 0) {
          data.datasets.forEach((s) => {
            const newDataset = s as Dataset
            state.value.datasets.set(newDataset._id, newDataset)
          })
        }
      })
      .catch((error: Error) => {
        appActions.errorMessage(error)
      })
  },
  //To create a new dataset
  addDataset(datasetName: string): Promise<void> {
    const payload: APIRequestPayload = {
      method: XHR_REQUEST_TYPE.POST,
      credentials: true,
      route: '/api/dataset',
      body: { name: datasetName },
    }
    return apiRequest<Dataset>(payload)
      .then((dataset) => {
        state.value.datasets.set(dataset._id, dataset)
      })
      .catch((error: Error) => {
        appActions.errorMessage(error)
      })
  },
  // Save selected dataset
  updateDataset: async function (): Promise<void> {
    const payload: APIRequestPayload = {
      method: XHR_REQUEST_TYPE.PUT,
      credentials: true,
      route: '/api/dataset',
      body: state.value.selectedDataset,
    }
    return apiRequest<Dataset>(payload)
      .then((dataset) => {
        state.value.datasets.set(dataset._id, dataset)
      })
      .catch((error: Error) => {
        appActions.errorMessage(error)
      })
  },
  addSelectionPriority: function (selectionPriority: string): void {
    state.value.selectedDataset?.selectionPriority.push(selectionPriority)
  },
  selectDatasetById(datasetId: string): void {
    if (state.value.datasets.get(datasetId))
      state.value.selectedDataset = state.value.datasets.get(
        datasetId
      ) as Dataset
  },

  addSelection(selectionPriority: string, subset: DatasetSelection): void {
    if (state.value.selectedDataset) {
      const selection = state.value.selectedDataset.selection
        ? state.value.selectedDataset.selection
        : {}

      selection[selectionPriority] == undefined
        ? (selection[selectionPriority] = [subset])
        : selection[selectionPriority].push(subset)

      state.value.selectedDataset.selection = { ...selection }
      console.log(state.value.selectedDataset)
    }
  },
  // datasetById(id: string): ComputedRef<Dataset | undefined> {
  //   return computed(() =>
  //     state.value.datasets.find((d: Dataset) => id === d._id)
  //   )
  // },
  // errorMessage(error: Error): void {
  //   const errorMessage = error.message || error
  //   console.log(`Error: ${errorMessage}`)
  //   appActions.setSnackbar({
  //     visibility: true,
  //     text: errorMessage.toString(),
  //     type: 'error',
  //     callback: undefined,
  //   })
  // },
  // selectDataset(dataset: Dataset | undefined): void {
  //   state.value.selectedDataset = dataset
  // },
  // selectDatasetById(datasetId: string): void {
  //   const dataset = state.value.datasets.find((s) => s._id == datasetId)
  //   if (dataset) state.value.selectedDataset = dataset
  //   else state.value.selectedDataset = undefined
  // },
  // lockSelection(d: { datasetId: string; lock: DatasetLock }): void {
  //   const pc = state.value.presetDatasetConfig
  //   if (pc && pc.locks[d.datasetId]) pc.locks[d.datasetId] = d.lock
  // },
  // unlockSelection(datasetId: string): void {
  //   const pc = state.value.presetDatasetConfig
  //   if (pc && pc.locks[datasetId]) delete pc.locks[datasetId]
  // },

  // setPresetDatasetConfig(config: UserDatasetConfig): void {
  //   state.value.presetDatasetConfig = config
  //   const d = state.value.datasets.find((ds) => ds._id === config.id)
  //   if (d) state.value.selectedDataset = d
  // },
  // addSelectionToDataset(data: SelectionOptions): void {
  //   const newDataset = new Dataset(data.dataset)
  //   let subSetToAddTo = newDataset.selection
  //   let key: string
  //   data.path.forEach((p, index) => {
  //     key = newDataset.selectionPriority[index]
  //     const subset = subSetToAddTo[key].find((item) => item.title == p)
  //     if (subset && subset.selection) subSetToAddTo = subset.selection
  //   })
  //   key = newDataset.selectionPriority[data.path.length]
  //   if (!subSetToAddTo[key]) {
  //     subSetToAddTo[key] = []
  //   }
  //   const newItem: DatasetSelection = {
  //     title: data.newSelectionName,
  //     selection: {},
  //   }
  //   if (data.path.length + 1 < newDataset.selectionPriority.length) {
  //     const nextKeyDown = newDataset.selectionPriority[data.path.length + 1]
  //     if (newItem.selection) newItem.selection[nextKeyDown] = []
  //   }
  //   subSetToAddTo[key].push(newItem)
  //   const payload: APIRequestPayload = {
  //     method: XHR_REQUEST_TYPE.PUT,
  //     credentials: true,
  //     route: '/api/dataset/selection',
  //     body: {
  //       _id: data.dataset._id,
  //       path: data.path,
  //       name: data.newSelectionName,
  //     },
  //   }
  //   apiRequest(payload).then(() => {
  //     if (state.value.selectedDataset) {
  //       state.value.selectedDataset.selection = newDataset.selection
  //     }
  //   })
  // },
  // fetchConsents(video: Video): void {
  //   // Relies on a setting being already selected
  //   const datasetForVideo: Dataset | undefined = state.value.datasets.find(
  //     (d) => d._id == video.dataset.id
  //   )
  //   const utvalg = video.dataset.selection.map((i) => `${i.keyName}:${i.title}`)
  //   if (datasetForVideo) {
  //     const payload: APIRequestPayload = {
  //       method: XHR_REQUEST_TYPE.GET,
  //       route: '/api/consents',
  //       query: {
  //         datasetId: video.dataset.id,
  //         utvalg,
  //         formId: datasetForVideo.formId,
  //       },
  //       credentials: true,
  //       body: undefined,
  //     }
  //     apiRequest<Consent[]>(payload)
  //       .then((consents: Consent[]) => {
  //         state.value.selectedDatasetConsents = consents.map((c) => ({
  //           ...c,
  //           checked: false,
  //         }))
  //       })
  //       .catch((error: Error) => {
  //         this.errorMessage(error)
  //       })
  //   }
  // },
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
