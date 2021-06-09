<template>
  <div class="flex flex-col flex-grow min-h-0">
    <div class="flex flex-row justify-between p-4">
      <SVGSymbol
        class="text-viva-korall fill-current self-start p-2"
        applyClasses="w-4 md:w-8"
        @click="back()"
        width="25"
        rotation="180"
      ></SVGSymbol>
    </div>
    <div>
      <p class="p-4">{{ selectedVideo.errorInfo }}</p>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import router from '@/router'
import SVGSymbol from '@/components/base/SVGSymbol.vue'
import { useVideoStore } from '@/store/useVideoStore'
const { getters: videoGetters } = useVideoStore()
export default defineComponent({
  components: {
    SVGSymbol,
  },
  setup() {
    function back() {
      router.push('/videos/list')
    }
    return {
      back,
      selectedVideo: videoGetters.selectedVideo,
    }
  },
})
</script>
<style scoped></style>
