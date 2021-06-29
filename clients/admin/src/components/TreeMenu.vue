<template>
  <div class="tree-menu">
    <div>
      {{ label }}
      <div v-for="(node, nodeIndex) in nodes" :key="nodeIndex">
        {{ node.title }}
        {{ node.selection }}
      </div>
    </div>
    <div v-for="(priority, index) in theDataset.selectionPriority" :key="index">
      <div v-if="nodes">
        <tree-menu
          v-for="node in nodes"
          :key="node"
          :nodes="node.selection"
          :label="node ? theDataset.selectionPriority[index + 1] : ''"
        >
        </tree-menu>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, PropType } from 'vue'
import { useDatasetStore } from '@/store/useDatasetStore'
import { DatasetSelection } from '@/types/main'

// import { DatasetSelection } from '@/types/main'
// interface selection {
//   [key: string]: DatasetSelection[]
// }
export default defineComponent({
  name: 'tree-menu',
  components: {},
  props: {
    label: String,
    selection: [],
    nodes: { type: Array as PropType<DatasetSelection[]>, required: true },
  },
  setup() {
    const { getters: datasetGetters } = useDatasetStore()

    const d = datasetGetters.selectedDataset
    const theDataset = ref(d)
    //Methods

    return {
      theDataset,
      // Methods
    }
  },
})
</script>
