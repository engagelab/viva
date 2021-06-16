<template>
  <div class="flex flex-row flex-wrap">
    <div class="w-full flex justify-center">{{ t('Your datasets') }}</div>
    <!-- Sidebar -->
    <div class="border-2 h-full w-1/6"></div>
    <!-- Table -->
    <div></div>
    <table class="w-5/6">
      <!-- Headers -->
      <tr>
        <th v-for="(header, headerIndex) in headers" :key="headerIndex">
          {{ header.headerName }}
        </th>
      </tr>
      <tr v-for="(dataset, datasetIndex) in datasets" :key="datasetIndex">
        <td>{{ dataset.name }}</td>
        <td>{{ dataset.created }}</td>
        <td>{{ dataset }}</td>
        <td>{{ dataset.users.owner }}</td>
      </tr>
    </table>
  </div>
</template>

<script lang="ts">
import { computed, ComputedRef, defineComponent, onMounted, ref } from 'vue'
import { Dataset } from '@/types/main'
import { useDatasetStore } from '../../store/useDatasetStore'
const { actions: datasetActions, getters: datasetGetters } = useDatasetStore()

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
    'Your datasets': 'Din datasetter',
    Datasett: 'Dataset',
    Opprettet: 'Created',
    'Antall opptak': 'Total recordings',
    Behandlingsansvarlig: 'Responsible',
  },
}

export default defineComponent({
  name: 'MonitorYourDatasets',
  components: {},
  setup() {
    const { t } = useI18n({ messages })
    const showDatasets = ref(false)

    const datasets: ComputedRef<Dataset[]> = computed(
      () => datasetGetters.datasets.value
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
    return { t, datasets, headers }
  },
})
</script>

<style scoped>
table {
  font-family: arial, sans-serif;
  border-collapse: collapse;
}

td,
th {
  border: 1px solid #dddddd;
  text-align: left;
  padding: 8px;
}

tr:nth-child(even) {
  background-color: #dddddd;
}
</style>
