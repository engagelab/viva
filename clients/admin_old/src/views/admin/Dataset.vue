<template>
  <div>
    Display all datasets

    <SlButton class="m-4" @click="showDatasetItem = !showDatasetItem"
      >Add dataset</SlButton
    >
    <div v-if="showDatasetItem">
      <dataset-item></dataset-item>
    </div>
  </div>
</template>
<script lang="ts">
import { defineComponent, ref } from 'vue'
import DatasetItem from '@/components/admin/DatasetItem.vue'
export default defineComponent({
  name: 'Dataset',
  components: {
    DatasetItem,
  },
  setup() {
    let showDatasetItem = ref('false')
    return {
      showDatasetItem,
    }
  },
})
</script>
