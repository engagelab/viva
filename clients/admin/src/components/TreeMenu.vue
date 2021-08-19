<template>
  <div class="tree-menu">
    <!-- <div v-for="(priority, index) in theDataset.selectionPriority" :key="index"> -->
    <div v-if="nodes && selectedPriority">
      <TreeMenu
        v-for="node in nodes"
        :key="node"
        :nodes="node.selection ? node.selection : []"
        :label="node.selection ? Object.keys(node.selection)[0] : ''"
        :selectedPriority="
          node.selection
            ? theDataset.selectionPriority.find(
                (i) => i == Object.keys(node.selection)[0]
              )
            : ''
        "
      >
      </TreeMenu>

      <!-- <div v-if="selectedPriority">
         <Subset :nodes="nodes[selectedPriority]"></Subset>
        <div
          v-for="(item, itemIndex) in nodes[selectedPriority]"
          :key="itemIndex"
        >
          {{ item.title }}
        </div>
      </div>-->
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
  name: 'treeMenu',
  components: {
    // Subset,
  },
  props: {
    label: String,
    title: String,
    selectedPriority: String,
    selection: [],
    nodes: { type: Object as PropType<DatasetSelection[]>, required: true },
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
