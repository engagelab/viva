// Store to do dataset functions (Mostly in admin side)
/* ---- Functionaltiy to be done  ----------------
1. Display datasets
2. Create / update dataset
3. Fetch consents either using feide token or canvas token  */

import { ref, Ref, computed, ComputedRef } from 'vue'
import {
  Dataset,
  DatasetSelection,
  DataPath,
  // Video,
  APIRequestPayload,
  XHR_REQUEST_TYPE,
  DatasetStorage,
  // DataportenGroupsData,
  // DataportenGroups,
} from '../types/main'
import { apiRequest } from '../api/apiRequest'
import { useAppStore } from './useAppStore'
import { VIDEO_STORAGE_TYPES } from '../constants'
const { actions: appActions } = useAppStore()
//State
interface DatasetState {
  selectedDataset: Dataset
  datasets: Map<string, Dataset>
  // dataportenGroups: Map<string, DataportenGroups>
}
const state: Ref<DatasetState> = ref({
  selectedDataset: new Dataset(),
  datasets: new Map(),
  // dataportenGroups: new Map(),
})

//Getters
interface Getters {
  datasets: ComputedRef<Map<string, Dataset>>
  selectedDataset: ComputedRef<DatasetState['selectedDataset']>
  // dataportenGroups:ComputedRef<Map<string,DataportenGroups>
}
const getters = {
  get datasets(): ComputedRef<Map<string, Dataset>> {
    // return computed(() => Array.from(state.value.datasets.values()))
    return computed(() => state.value.datasets)
  },
  get selectedDataset(): ComputedRef<DatasetState['selectedDataset']> {
    return computed(() => state.value.selectedDataset)
  },

  // get dataportenGroups(): ComputedRef<Map<string, DataportenGroups>> {
  //   return computed(() => state.value.dataportenGroups)
  // },
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
  // fetchDataportenGroups: () => Promise<void>
  addDataset: (datasetName: string) => Promise<void>
  updateDataset: (d?: Dataset) => Promise<void>
  addSelectionPriority: (selectionPriority: string) => void
  addStorageFields: (
    storageId: string,
    value: string | DatasetStorage,
    mode: string
  ) => void
  selectDatasetById: (datasetId: string) => void
  addSelection: (currentDataPath: DataPath) => void
}

const actions = {
  //Fetch all datasets for the user
  fetchDatasets(): Promise<void> {
    const payload: APIRequestPayload = {
      method: XHR_REQUEST_TYPE.GET,
      route: '/api/datasets',
      credentials: true,
    }
    return apiRequest<Dataset[]>(payload)
      .then((datasets) => {
        if (datasets) {
          datasets.forEach((s) => {
            const newDataset = new Dataset(s)
            state.value.datasets.set(newDataset._id, newDataset)
          })
        }
      })
      .catch((error: Error) => {
        appActions.errorMessage(error)
      })
  },
  // // Fetch all dataporten groups for the user
  // fetchDataportenGroups(): Promise<void> {
  //   const payload: APIRequestPayload = {
  //     method: XHR_REQUEST_TYPE.GET,
  //     route: '/api/dataset/dataportengroups',
  //     credentials: true,
  //   }
  //   return apiRequest<DataportenGroups[]>(payload)
  //     .then((dataportenGroups) => {
  //       if (dataportenGroups) {
  //         dataportenGroups.forEach((s) => {
  //           const newDataportenGroups = new DataportenGroups(s)
  //           state.value.dataportenGroups.set(newDataportenGroups.id, newDataportenGroups)
  //         })
  //       }
  //     })
  //     .catch((error: Error) => {
  //       appActions.errorMessage(error)
  //     })
  // },
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
  // Save given or selected dataset
  updateDataset: async function (d?: Dataset): Promise<void> {
    const payload: APIRequestPayload = {
      method: XHR_REQUEST_TYPE.PUT,
      credentials: true,
      route: '/api/dataset',
      body: d || state.value.selectedDataset,
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
  addStorageFields: function (
    storageId: string,
    value: string | DatasetStorage,
    mode: string
  ): void {
    if (mode == 'new') {
      state.value.selectedDataset?.storages.push(value as DatasetStorage)
      actions.updateDataset()
    } else {
      state.value.selectedDataset?.storages.filter((storage) => {
        if (storage._id == storageId) {
          // storage.file[mode].push(value)
          switch (mode) {
            case 'name':
              storage.file.name.push(value as string)
              break
            case 'path':
              storage.file.path.push(value as string)
              break
            case 'kind':
              storage.kind = value as VIDEO_STORAGE_TYPES
              break
            case 'groupId':
              storage.groupId = value as string
              break
          }
        }
      })
    }
  },

  selectDatasetById(datasetId: string): void {
    if (state.value.datasets.get(datasetId))
      state.value.selectedDataset = state.value.datasets.get(
        datasetId
      ) as Dataset
  },

  addSelection(currentDataPath: DataPath): void {
    // if (state.value.selectedDataset) {
    //   const selection = state.value.selectedDataset.selection
    //     ? state.value.selectedDataset.selection
    //     : {}

    //   selection[selectionPriority] == undefined
    //     ? (selection[selectionPriority] = [subset])
    //     : selection[selectionPriority].push(subset)

    //   state.value.selectedDataset.selection = { ...selection }
    //   console.log(state.value.selectedDataset)
    // }

    const recurse = (nodes: DatasetSelection[], label: string) => {
      nodes.forEach((node) => {
        if (label) console.log('Label:' + label + 'Value:' + node.title)
        if (node.selection)
          recurse(
            node.selection[Object.keys(node.selection)[0]],
            Object.keys(node.selection)[0]
          )
      })
    }

    recurse(
      state.value.selectedDataset.selection[
        Object.keys(state.value.selectedDataset.selection)[0]
      ],
      Object.keys(state.value.selectedDataset.selection)[0]
    )

    console.log(currentDataPath)
    const path = currentDataPath.path.split('-')
    console.log(path)
    for (const [key, value] of Object.entries(
      state.value.selectedDataset.selection
    )) {
      console.log(`${key}: ${value}`)
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
