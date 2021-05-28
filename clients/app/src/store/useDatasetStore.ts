// Store to do dataset functions (Mostly in admin side)
/* ---- Functionaltiy to be done  ----------------
1. Display datasets
2. Create / update dataset
3. Fetch consents either using feide token or canvas token  */

import { ref, Ref, computed, ComputedRef } from 'vue'
import {
  DatasetData,
  Dataset,
  APIRequestPayload,
  XHR_REQUEST_TYPE,
} from '@/types/main'
import { apiRequest } from '../api/apiRequest'
//State
interface State {
  selectedDataset: Dataset | undefined
  datasets: Map<string, Dataset>
  settings: Dataset[],
  presetDatasett: Dataset | undefined,
  selectedDatasettConsents: []
}

const state: Ref<State> = ref({
  selectedDataset: undefined,
  datasets: new Map(),
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
    query: { dataset: dataset },
  }
  return apiRequest<DatasetData>(payload)
}

//Getters
interface Getters {
  datasets: ComputedRef<Dataset[]>
  selectedDataset: ComputedRef<State['selectedDataset']>
}
const getters = {
  get datasets(): ComputedRef<Video[]> {
    return computed(() => Array.from(state.value.datasets.values()))
  },
  get selectedDataset(): ComputedRef<State['selecteddataset']> {
    return computed(() => state.value.selectedDataset)
  },
}
//Actions
interface Actions {
  getDatasets: () => Promise<void>
  updateDataset: (dataset: Dataset) => Promise<void>
}

const actions = {
  //Fetch all datasets for the user
  getDatasets: async function (): Promise<void> {
    const response = await fetchDatasets()
    const dataset = new Dataset(response)
    console.log(dataset)
    return Promise.resolve()
  },
  updateDataset: async function (dataset: Dataset): Promise<void> {
    const response = await saveDataset(dataset)
    const d = new Dataset(response)
    console.log(d)
    return Promise.resolve()
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
