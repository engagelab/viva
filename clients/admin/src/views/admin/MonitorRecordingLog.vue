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
        <div>{{ t('MonitorRecordingLog') }}</div>
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
        <div class="recording-title text-lg">Metadata about recording</div>
        <div class="">
          <p class="text-red-500">video details</p>
          <div>Name: {{ selectedRow.details.name }}</div>
          <div>Owner : {{ selectedRow.shared.owner }}</div>
          <div>Category: {{ selectedRow.details.category }}</div>
          <div>Created: {{ selectedRow.details.created }}</div>
          <div>Duration: {{ `${selectedRow.details.duration} Seconds` }}</div>
          <div>EDL: {{ selectedRow.details.edl }}</div>
          <div>Description : {{ selectedRow.details.description }}</div>
          <div class="mt-2">
            <p class="text-red-500">Dataset Info:</p>
            <div>DatasetName:{{ selectedRow.dataset }}</div>
            <div>Selection: {{ selectedRow.selection }}</div>
          </div>
          <div class="mt-2">
            <p class="text-red-500">Consenters:</p>
            <div
              v-for="(consenter, index) in selectedRow.consenters"
              :key="index"
            >
              Consenters: {{ consenter }}
            </div>
          </div>
          <div class="mt-2">
            <p class="text-red-500">Storages:</p>
            <div v-for="(storage, index) in selectedRow.storages" :key="index">
              {{ storage.kind }}-{{ storage.path }}
            </div>
          </div>
        </div>
        <div class="mx-2">
          <p class="text-red-500">Shares</p>
          <div
            class="mt-2"
            v-for="(share, shareIndex) in selectedRow.shared.sharing"
            :key="shareIndex"
          >
            <p>
              <span class="text-red-500">></span> Description:{{
                share.description
              }}
            </p>
            <p>EDL:{{ share.edl.trim }}</p>
            Users:
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
    MonitorRecordingLog: 'Logger',
    Opptak: 'Opptak',
    Dato: 'Dato',
    Datainnsamler: 'Datainnsamler',
    Datasett: 'Datasett',
  },
  en: {
    MonitorRecordingLog: 'Recording Log',
    Opptak: 'Recording',
    Dato: 'Date',
    Datainnsamler: 'Person',
    Datasett: 'Dataset',
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
