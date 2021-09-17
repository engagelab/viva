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
