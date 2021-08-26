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
import { computed, defineComponent, ref, watch, PropType, Ref } from 'vue'

import { useDatasetStore } from '@/store/useDatasetStore'
import { DatasetSelection } from '@/types/main'
import Subset from './Subset.vue'

export default defineComponent({
  name: 'SelectionItem',
  components: {
    Subset,
  },
  props: {
    localSelectionPriority: {
      type: Array as PropType<string[]>,
      required: true,
    },
  },

  setup(props) {
    const { getters: datasetGetters } = useDatasetStore()
    const d = datasetGetters.selectedDataset
    let currentSelectionPriority = ref('')

    const localSelection: Ref<{ [key: string]: DatasetSelection[] }> = ref(
      d.value.selection
    )

    function reloadData() {
      localSelection.value = d.value.selection
    }
    const InitialSelectionPriority = computed(() => {
      return localSelection.value
        ? props.localSelectionPriority.find(
            (i) => i == Object.keys(localSelection.value)[0]
          )
        : ''
    })
    //Methods
    const setCurrentSelectionPriority = (selectionPriority: string) => {
      let index: number =
        props.localSelectionPriority.indexOf(selectionPriority)
      if (index > -1) {
        currentSelectionPriority.value = props.localSelectionPriority[index + 1]
      } else currentSelectionPriority.value = props.localSelectionPriority[0]
    }
    watch(
      () => d.value,
      () => reloadData()
    )
    reloadData()
    return {
      localSelection,
      currentSelectionPriority,
      InitialSelectionPriority,
      // Methods
      setCurrentSelectionPriority,
    }
  },
})
</script>
