<template>
  <div class="flex flex-row flex-wrap">
    <div class="w-full flex justify-center">{{ t('Your datasets') }}</div>
    <!-- Sidebar -->
    <div class="border-2 h-full w-1/6">
      <p>Datasets</p>
      <ul style="list-style-type: none">
        <li
          v-for="(dataset, datasetIndex) in datasets"
          :key="datasetIndex"
          class="cursor-pointer"
          @click="setSelectedDataset(dataset._id)"
        >
          {{ dataset.name }}
        </li>
      </ul>
    </div>
    <!-- Table -->
    <div class="w-5/6">
      <DatasetItem v-if="selectedDataset._id != ''"> </DatasetItem>
    </div>
    <div
      class="
        px-4
        h-10
        rounded-full
        bg-blue-500
        text-white
        hover:bg-blue-700
        font-medium
        leading-relaxed
        flex
        items-center
        justify-center
      "
      style="font-family: 'Inter-Medium', 'Inter', sans-serif"
      v-if="!showInput"
      @click="showInput = !showInput"
    >
      Add new dataset
    </div>
    <div class="flex flex-row" v-if="showInput">
      <input
        v-model="newDatasetName"
        type="String"
        class="border-2 text-center rounded-full"
        placeholder="Navn på dataset"
        @keypress="restrict($event)"
      />
      <button
        class="px-2 text-center h-6 rounded-full bg-blue-300 hover:bg-blue-500"
        @click="createDataset()"
      >
        Legg til
      </button>
      <div v-if="errorMessage" class="text-red-600">
        {{ errorMessage }}
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import {
  computed,
  ComputedRef,
  defineComponent,
  onMounted,
  ref,
  // Ref,
  // watch,
} from 'vue'
import { Dataset } from '@/types/main'
import { useDatasetStore } from '../../store/useDatasetStore'
const { actions: datasetActions, getters: datasetGetters } = useDatasetStore()
import DatasetItem from '@/components/DatasetItem.vue'
// i18n
import { useI18n } from 'vue-i18n'
const messages = {
  nb_NO: {
    'Your datasets': 'Din datasetter',
    Datasett: 'Opptak',
    Opprettet: 'Dato',
    'Antall opptak': 'Datainnsamler',
    Behandlingsansvarlig: 'Datasett',
  },
  en: {
    'Your datasets': 'Datasets',
    Datasett: 'Dataset',
    Opprettet: 'Created',
    'Antall opptak': 'Total recordings',
    Behandlingsansvarlig: 'Responsible',
  },
}

export default defineComponent({
  name: 'MonitorYourDatasets',
  components: {
    DatasetItem,
  },
  setup() {
    const { t } = useI18n({ messages })
    const showDatasets = ref(false)
    const showInput = ref(false)
    const newDatasetName = ref('')

    const errorMessage = ref('')
    const datasets: ComputedRef<Dataset[]> = computed(() =>
      Array.from(datasetGetters.datasets.value.values())
    )
    const headers = Dataset.columnDefs()
    // Fetch datasets
    onMounted(() => {
      datasetActions
        .fetchDatasets()
        .then(() => {
          showDatasets.value = true
        })
        .catch((error) => console.log(error))
    })
    // validate the dataset name for allowing only alpha numeric variable
    const restrict = (event: KeyboardEvent) => {
      console.log(String.fromCharCode(event.charCode))
      /* if (
        event.charCode === 0 ||
        (/[\wÆØÅæøå]$/g.test(String.fromCharCode(event.charCode)) &&
          newDatasetName.value.length <= 100)
      ) {
        return true
      } else {
        return event.preventDefault()
      }*/
      return event.charCode === 0 ||
        (/[\wÆØÅæøå]$/g.test(String.fromCharCode(event.charCode)) &&
          newDatasetName.value.length <= 100)
        ? true
        : event.preventDefault()
    }
    const createDataset = () => {
      datasetActions.addDataset(newDatasetName.value)
    }
    const setSelectedDataset = (datasetIndex: string) => {
      datasetActions.selectDatasetById(datasetIndex)
    }
    return {
      t,
      restrict,
      errorMessage,
      showInput,
      newDatasetName,
      datasets,
      headers,
      selectedDataset: datasetGetters.selectedDataset,
      //Methods
      createDataset,
      setSelectedDataset,
    }
  },
})
</script>

<style scoped></style>
