<template>
  <div>
    <p>{{ Object.keys(selection)[0] }} :</p>

    <div
      v-for="(item, index) in selection[Object.keys(selection)[0]]"
      :key="index"
    >
      {{ item.title }}sd
      {{ item.selection }}
    </div>

    <Subset
      v-for="subset in selection[Object.keys(selection)[0]]"
      :selection="subset"
      :key="subset"
    >
    </Subset>
    <!-- <div class="tree-menu">
      <div>{{ Object.keys(selection)[0] }}</div>
      <tree-menu
        v-for="node in Object.keys(selection)[0].selection"
        :nodes="node.nodes"
        :label="node.titlel"
      >
      </tree-menu>
    </div> -->
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { DatasetSelection } from '@/types/main'

export default defineComponent({
  name: 'Subset',
  components: {},
  props: {
    selection: { type: Object as PropType<DatasetSelection>, required: true },
  },

  setup() {
    //Methods

    return {
      // Methods
    }
  },
})
</script>
