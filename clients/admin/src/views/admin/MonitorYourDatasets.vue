<!-- Copyright 2020, 2021 Richard Nesnass, Sharanya Manivasagam and Ole Smørdal

 This file is part of VIVA.

 VIVA is free software: you can redistribute it and/or modify
 it under the terms of the GNU Affero General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 GPL-3.0-only or GPL-3.0-or-later

 VIVA is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU Affero General Public License for more details.

 You should have received a copy of the GNU Affero General Public License
 along with VIVA.  If not, see http://www.gnu.org/licenses/. -->
<template>
  <div class="flex flex-col">
    <div class="flex flex-row flex-wrap mb-4">
      <!-- Sidebar -->
      <div class="h-full w-1/4">
        <h2 class="font-bold">{{ t('datasets') }}</h2>
        <ul class="mt-2" style="list-style-type: none">
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
      <div class="w-3/4">
        <DatasetItem v-if="selectedDataset._id != ''"> </DatasetItem>
      </div>
    </div>
    <div class="flex flex-row mt-8">
      <Button v-if="!showInput" @vclick="showInput = !showInput">
        {{ t('create') }}
      </Button>
      <div class="flex flex-row" v-if="showInput">
        <input
          v-model="newDatasetName"
          type="String"
          class="border-2 text-center"
          placeholder="Navn på datasett"
          @keypress="restrict($event)"
        />
        <Button class="ml-4 text-white bg-blue-600" @vclick="createDataset()">
          Create
        </Button>
        <div v-if="errorMessage" class="text-red-600">
          {{ errorMessage }}
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, ComputedRef, defineComponent, onMounted, ref } from 'vue'
import { Dataset } from '@/types/main'
import { useDatasetStore } from '../../store/useDatasetStore'
const { actions: datasetActions, getters: datasetGetters } = useDatasetStore()
import DatasetItem from '@/components/DatasetItem.vue'
import Button from '@/components/base/Button.vue'

import { useI18n } from 'vue-i18n'
const messages = {
  nb_NO: {
    datasets: 'Datasets',
    create: 'Create new dataset',
  },
  en: {
    datasets: 'Datasets',
    create: 'Create new dataset',
  },
}

export default defineComponent({
  name: 'MonitorYourDatasets',
  components: {
    DatasetItem,
    Button,
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
      return event.charCode === 0 ||
        (/[\wÆØÅæøå]$/g.test(String.fromCharCode(event.charCode)) &&
          newDatasetName.value.length <= 100)
        ? true
        : event.preventDefault()
    }
    const createDataset = () => {
      datasetActions.addDataset(newDatasetName.value)
      showInput.value = false
    }
    const setSelectedDataset = (datasetID: string) => {
      datasetActions.selectDatasetById(datasetID)
      showInput.value = false
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
