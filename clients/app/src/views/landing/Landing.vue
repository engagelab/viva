<template>
  <Slider
    class="flex flex-col flex-grow min-h-0 h-full"
    :pages="rawPages"
    :movePageTo="page"
  />
</template>

<script lang="ts">
import { defineComponent, markRaw } from 'vue'
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
    page: {
      type: String,
      default: '0',
    },
  },
  data() {
    const rawPages = [
      markRaw(page0),
      markRaw(page1),
      markRaw(page2),
      markRaw(page3),
    ]
    return {
      rawPages,
    }
  },
})
</script>

<style scoped></style>
