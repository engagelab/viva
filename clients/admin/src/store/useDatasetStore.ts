import { ref, Ref, computed, ComputedRef } from 'vue'
import {
  Dataset,
  DatasetSelection,
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

//Getters
interface Getters {
  datasets: ComputedRef<Map<string, Dataset>>
  selectedDataset: ComputedRef<DatasetState['selectedDataset']>
}
const getters = {
  get datasets(): ComputedRef<Map<string, Dataset>> {
    return computed(() => state.value.datasets)
  },
  get selectedDataset(): ComputedRef<DatasetState['selectedDataset']> {
    return computed(() => state.value.selectedDataset)
  },
}
//Actions
interface Actions {
  fetchDatasets: () => Promise<void>
  addDataset: (datasetName: string) => Promise<void>
  updateDataset: (d?: Dataset) => Promise<void>
  selectDatasetById: (datasetId: string) => void
  addSelection: (
    localSelection: { [key: string]: DatasetSelection[] } | string[],
    mode: string
  ) => void
  addConsentField: (value: string) => void
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
      body: d ? d : state.value.selectedDataset,
    }

    return apiRequest<Dataset>(payload)
      .then((dataset) => {
        const updatedDataset = new Dataset(dataset)
        state.value.datasets.set(updatedDataset._id, updatedDataset)
        actions.selectDatasetById(updatedDataset._id)
      })
      .catch((error: Error) => {
        appActions.errorMessage(error)
      })
  },
  addConsentField: function (value: string): void {
    state.value.selectedDataset.consent.value = value
    console.log(state.value.selectedDataset.consent)
  },
  selectDatasetById(datasetId: string): void {
    const d = state.value.datasets.get(datasetId)
    if (d) state.value.selectedDataset = d
  },

  addSelection(
    value: { [key: string]: DatasetSelection[] } | string[],
    mode: string
  ): void {
    if (mode == 'priority') {
      state.value.selectedDataset.selectionPriority = value as string[]
      state.value.selectedDataset.selection = {}
      // Object.assign(state.value.selectedDataset.selection, {
      //   [state.value.selectedDataset.selectionPriority[0]]: [],
      // })
    } else if (mode == 'selection') {
      state.value.selectedDataset.selection = {
        ...(value as { [key: string]: DatasetSelection[] }),
      }
    }
    actions.updateDataset()
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
