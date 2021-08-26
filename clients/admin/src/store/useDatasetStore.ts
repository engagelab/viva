// Store to do dataset functions (Mostly in admin side)
/* ---- Functionaltiy to be done  ----------------
1.Selection Priority
2. Add instances

*/
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
  addSelection: (localSelection: { [key: string]: DatasetSelection[] }) => void
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
      body: d ? d : state.value.selectedDataset,
    }

    return apiRequest<Dataset>(payload)
      .then((dataset) => {
        state.value.datasets.set(dataset._id, dataset)
        actions.selectDatasetById(dataset._id)
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

  addSelection(localSelection: { [key: string]: DatasetSelection[] }): void {
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

    // const recurse = (nodes: DatasetSelection[], label: string) => {
    //   nodes.forEach((node) => {
    //     if (label) console.log('Label:' + label + 'Value:' + node.title)
    //     if (node.selection)
    //       recurse(
    //         node.selection[Object.keys(node.selection)[0]],
    //         Object.keys(node.selection)[0]
    //       )
    //   })
    // }

    // recurse(
    //   state.value.selectedDataset.selection[
    //     Object.keys(state.value.selectedDataset.selection)[0]
    //   ],
    //   Object.keys(state.value.selectedDataset.selection)[0]
    // )

    // console.log(currentDataPath)
    // const path = currentDataPath.path.split('-')
    // console.log(path)
    // for (const [key, value] of Object.entries(
    //   state.value.selectedDataset.selection
    // )) {
    //   console.log(`${key}: ${value}`)
    // }
    state.value.selectedDataset.selection = { ...localSelection }
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
