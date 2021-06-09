<template>
  <Slider
    class="flex flex-col flex-grow min-h-0 h-full"
    :pages="pages"
    :movePageTo="pageNumber"
  />
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import Slider from '@/components/base/Slider.vue'

import page0 from './pages/main.vue'
import page1 from './pages/detteErViva.vue'
import page2 from './pages/personvernIOpptak.vue'
import page3 from './pages/loggInn.vue'

export default defineComponent({
  name: 'Landing',
  components: {
    Slider,
  },
  props: {
    pageNumber: {
      type: Number,
      default: 0,
    },
  },
  data() {
    return {
      pages: [page0, page1, page2, page3],
    }
  },
})
</script>

<style scoped></style>
