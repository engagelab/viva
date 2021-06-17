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
        {{ rowData }}
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
    const rowData = computed(() => videoGetters.allVideos.value)

    // Filter all columns based on the text
    // If one of the columns contain the text, the table will show them
    const onWardTableSearchTextChanged = () => {
      gridOptions.api?.setQuickFilter(searchField.value)
    }

    // Handle Table Events
    const cellClicked = (event: CellEvent) => {
      selectedRow.value = event
    }

    return {
      columnDefs,
      gridOptions,
      searchField,
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