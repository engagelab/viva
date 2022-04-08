<!-- Copyright 2020, 2021 Richard Nesnass, Sharanya Manivasagam and Ole Smørdal

 This file is part of VIVA.

 VIVA is free software: you can redistribute it and/or modify
 it under the terms of the GNU Affero General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 GPL-3.0-only or GPL-3.0-or-later

 VIVA is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU Affero General Public License for more details.

 You should have received a copy of the GNU Affero General Public License
 along with VIVA.  If not, see http://www.gnu.org/licenses/. -->
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
      <p v-if="selectedVideo" class="p-4">
        {{ selectedVideo.status.error.errorInfo }}
      </p>
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
