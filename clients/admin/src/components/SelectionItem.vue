<template>
  <!-- Component handles selection instances  -->
  <div>
    <div>
      <Subset
        v-if="localSelection"
        :title="Object.keys(localSelection)[0]"
        :label="Object.keys(localSelection)[0]"
        :nodes="localSelection[Object.keys(localSelection)[0]]"
        :depth="0"
        :path="''"
        :newInstancePath="''"
      ></Subset>
    </div>
  </div>
</template>
<script lang="ts">
import { defineComponent, ref, watch, Ref } from 'vue'

import { useDatasetStore } from '@/store/useDatasetStore'
import { DatasetSelection } from '@/types/main'
import Subset from './Subset.vue'

export default defineComponent({
  name: 'SelectionItem',
  components: {
    Subset,
  },

  setup() {
    const { getters: datasetGetters } = useDatasetStore()
    const d = datasetGetters.selectedDataset
    const localSelectionPriority: Ref<string[]> = ref(d.value.selectionPriority)

    let currentSelectionPriority = ref('')

    const localSelection: Ref<{ [key: string]: DatasetSelection[] }> = ref(
      d.value.selection
    )

    function reloadData() {
      localSelectionPriority.value = [...d.value.selectionPriority]
      localSelection.value = d.value.selection
    }

    //Methods
    const setCurrentSelectionPriority = (selectionPriority: string) => {
      let index: number =
        localSelectionPriority.value.indexOf(selectionPriority)
      if (index > -1) {
        currentSelectionPriority.value = localSelectionPriority.value[index + 1]
      } else currentSelectionPriority.value = localSelectionPriority.value[0]
    }
    watch(
      () => d.value,
      () => reloadData()
    )
    reloadData()
    return {
      localSelection,
      currentSelectionPriority,
      localSelectionPriority,
      // Methods
      setCurrentSelectionPriority,
    }
  },
})
</script>
