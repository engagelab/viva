<template>
  <div>
    <p>{{ nodes.title }}</p>

    re {{ nodes }}{{ nodeKey }}
    <div v-if="nodes && nodeKey">
      <Subset v-for="node in nodes" :nodes="node" :key="node"> </Subset>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { DatasetSelection } from '@/types/main'

export default defineComponent({
  name: 'Subset',
  components: {},
  props: {
    label: String,
    nodeKey: String,
    nodes: { type: Object as PropType<DatasetSelection>, required: true },
  },

  setup() {
    //Methods

    return {
      // Methods
    }
  },
})
</script>
