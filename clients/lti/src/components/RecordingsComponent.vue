<template>
  <div class="text-black">RUser recordings</div>
</template>
<script lang="ts">
import { defineComponent, onMounted } from 'vue'
import { useVideoStore } from '@/store/useVideoStore'

const { getters: videoGetters, actions: videoActions } = useVideoStore()
/* import Edit from '../views/pages/edit.vue' */

export default defineComponent({
  name: 'Recording list',
  components: {},
  setup() {
    onMounted(() => {
      console.log(videoGetters, videoActions)
    })

    return {}
  },
})
</script>
