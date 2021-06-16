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
        />
        <div>{{ 'MonitorYourDatasets' }}</div>
      </div>

      <!-- <AgGridVue
        style="width: 100%; height: 50vh"
        class="ag-theme-alpine"
        :gridOptions="gridOptions"
        :columnDefs="columnDefs"
        :rowData="rowData"
        :defaultColDef="{ editable: true, sortable: true }"
        @cellClicked="cellClicked"
      >
      </AgGridVue> -->
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

// import { GridOptions, CellEvent } from '@ag-grid-community/all-modules'

export default defineComponent({
  name: 'MonitorYourDatasets',
  components: {},
  setup() {
    return {}
  },
})
</script>

<style scoped></style>
