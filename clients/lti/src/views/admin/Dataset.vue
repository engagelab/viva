<template>
  <div>
    Display all dataset
    <dataset-item></dataset-item>
  </div>
</template>
<script lang="ts">
import { defineComponent } from 'vue'
import DatasetItem from '@/components/admin/DatasetItem.vue'
export default defineComponent({
  name: 'Dataset',
  components: {
    DatasetItem,
  },
  setup() {
    return {}
  },
})
</script>
