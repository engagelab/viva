<template>
  <div class="tree-menu">
    <!-- <div v-for="(priority, index) in theDataset.selectionPriority" :key="index"> -->
    <div v-if="nodes && selectedPriority">
      {{ label }}

      <tree-menu
        v-for="node in nodes[selectedPriority]"
        :key="node"
        :nodes="node.selection"
        :label="node.title"
        :selectedPriority="
          node.selection
            ? theDataset.selectionPriority.find(
                (i) => i == Object.keys(node.selection)[0]
              )
            : ''
        "
      >
      </tree-menu>

      {{ selectedPriority }}:
      <div v-if="selectedPriority">
        <!-- <Subset :nodes="nodes[selectedPriority]"></Subset> -->
        <div
          v-for="(item, itemIndex) in nodes[selectedPriority]"
          :key="itemIndex"
        >
          {{ item.title }}
        </div>
      </div>
    </div>
    <!-- </div> -->
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, PropType } from 'vue'
import { useDatasetStore } from '@/store/useDatasetStore'
import { DatasetSelection } from '@/types/main'
// import Subset from '@/components/subset.vue'
// import { DatasetSelection } from '@/types/main'
// interface selection {
//   [key: string]: DatasetSelection[]
// }
export default defineComponent({
  name: 'tree-menu',
  components: {
    // Subset,
  },
  props: {
    label: String,
    selectedPriority: String,
    selection: [],
    nodes: { type: Object as PropType<DatasetSelection>, required: true },
  },
  setup() {
    const { getters: datasetGetters } = useDatasetStore()

    const d = datasetGetters.selectedDataset
    const theDataset = ref(d)
    let Pindex = ref(1)
    //Methods

    return {
      theDataset,
      Pindex,
      // Methods
    }
  },
})
</script>
