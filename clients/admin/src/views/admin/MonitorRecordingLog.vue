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
  <div class="flex flex-row">
    <!-- Table Content -->
    <div class="w-full">
      <div class="w-1/2 flex justify-center relative">
        <input
          type="text"
          id="wardtable-filter-text-box"
          placeholder="Filter..."
          class="border-2 absolute left-0"
          v-model="searchField"
          @input="onWardTableSearchTextChanged"
        />
        <div>{{ t('monitorRecordingLog') }}</div>
      </div>

      <AgGridVue
        style="width: 100%; height: 50vh"
        class="ag-theme-alpine"
        :gridOptions="gridOptions"
        :columnDefs="columnDefs"
        :rowData="rowData"
        :defaultColDef="{ editable: false, sortable: true }"
        @cellClicked="cellClicked"
      >
      </AgGridVue>

      <!-- Row details -->
      <div
        v-if="selectedRow"
        class="grid grid-rows-1 border-2 rounded-md bg-gray-300 p-4 mt-4"
      >
        <div class="recording-title text-lg">{{ t('metadata') }}</div>
        <div class="">
          <p class="text-red-500">video details</p>
          <div>{{ t('name') }}: {{ selectedRow.details.name }}</div>
          <div>{{ t('owner') }} : {{ selectedRow.shared.owner }}</div>
          <div>{{ t('category') }}: {{ selectedRow.details.category }}</div>
          <div>{{ t('created') }} : {{ selectedRow.details.created }}</div>
          <div>
            {{ t('duration') }} :
            {{ `${selectedRow.details.duration} Seconds` }}
          </div>
          <div>{{ t('edl') }}: {{ selectedRow.details.edl }}</div>
          <div>
            {{ t('description') }} : {{ selectedRow.details.description }}
          </div>
          <div class="mt-2">
            <p class="text-red-500">{{ t('datasetInfo') }}:</p>
            <div>{{ t('datasetName') }}:{{ selectedRow.dataset }}</div>
            <div>{{ t('consenters') }}: {{ selectedRow.selection }}</div>
          </div>
          <div class="mt-2">
            <p class="text-red-500">{{ t('consenters') }}:</p>
            <div
              v-for="(consenter, index) in selectedRow.consenters"
              :key="index"
            >
              {{ t('consenters') }} : {{ consenter }}
            </div>
          </div>
          <div class="mt-2">
            <p class="text-red-500">{{ t('storages') }}:</p>
            <div v-for="(storage, index) in selectedRow.storages" :key="index">
              {{ storage.kind }}-{{ storage.path }}
            </div>
          </div>
        </div>
        <div class="mx-2">
          <p class="text-red-500">{{ t('shares') }}</p>
          <div
            class="mt-2"
            v-for="(share, shareIndex) in selectedRow.shared.sharing"
            :key="shareIndex"
          >
            <p>
              <span class="text-red-500">></span> {{ t('description') }}:{{
                share.description
              }}
            </p>
            <p>{{ t('edl') }}:{{ share.edl.trim }}</p>
            {{ t('users') }}:
            <p v-for="(user, index) in share.users" :key="index">{{ user }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, computed } from 'vue'
import { AgGridVue } from 'ag-grid-vue3'
import { GridOptions, CellEvent } from '@ag-grid-community/all-modules'

// Class and Interface
import { Video } from '@/types/main'

// Stores
import { useVideoStore } from '@/store/useVideoStore'
const { actions: videoActions, getters: videoGetters } = useVideoStore()

// i18n
import { useI18n } from 'vue-i18n'
const messages = {
  nb_NO: {
    monitorRecordingLog: 'Opptakslogg',
    opptak: 'Opptak',
    datainnsamler: 'Datainnsamler',
    name: 'Navn',
    category: '',
    created: '',
    duration: '',
    edl: '',
    consenters: '',
    selection: '',
    datasetName: '',
    datasetInfo: '',
    storages: '',
    shares: '',
    description: '',
    users: '',
    metadata: '',
  },
  en: {
    nonitorRecordingLog: 'Recording Log',
    opptak: 'Recording',
    datainnsamler: 'Data collector',
    name: 'Name',
    category: 'Category',
    created: 'Created',
    duration: 'Duration',
    edl: 'EDL',
    consenters: 'Consenters',
    selection: 'Selection',
    datasetName: 'Dataset name',
    datasetInfo: 'Dataset info',
    storages: 'Storages',
    shares: 'Shares',
    description: 'Description',
    users: 'Users',
    metadata: 'Metadata about recording',
  },
}

export default defineComponent({
  name: 'MonitorRecordingsInProcess',
  components: {
    AgGridVue,
  },
  setup() {
    const { t } = useI18n({ messages })
    const gridOptions: GridOptions = {
      /*  suppressScrollOnNewData: true, */
    }

    onMounted(() => {
      videoActions.fetchMetadata().then(() => {
        console.log(rowData)
      })
    })

    const searchField = ref('')
    const selectedRow = ref()

    // Convert video when fetched

    const columnDefs = Video.columnDefs()
    const rowData = computed(() =>
      videoGetters.allVideos.value.map((v) => v.asTableData)
    )

    // Filter all columns based on the text
    // If one of the columns contain the text, the table will show them
    const onWardTableSearchTextChanged = () => {
      gridOptions.api?.setQuickFilter(searchField.value)
    }

    // Handle Table Events
    const cellClicked = (event: CellEvent) => {
      selectedRow.value = event.data
      console.log(selectedRow.value)
    }

    return {
      columnDefs,
      gridOptions,
      searchField,
      selectedRow,
      t,
      // computed
      rowData,

      // Table events
      cellClicked,

      // View
      onWardTableSearchTextChanged,
    }
  },
})
</script>

<style scoped></style>
