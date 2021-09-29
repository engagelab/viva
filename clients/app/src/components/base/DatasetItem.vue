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
  <div
    class="flex flex-row items-center justify-between viva-item max-w-xs"
    :class="backgroundColour"
    @click="clickItem()"
  >
    <div class="max-w-12">
      <p class="font-vagBold">
        <strong>{{ title }}</strong>
      </p>
      <p>{{ description }}</p>
    </div>
    <div class="pl-4">
      <SVGSymbol
        class="p-2 text-viva-korall fill-current cursor-pointer"
        applyClasses="w-4 md:w-8"
        rotation="0"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue'

import SVGSymbol from './SVGSymbol.vue'
import { baseUrl } from '@/constants'

export default defineComponent({
  components: {
    SVGSymbol,
  },
  props: {
    title: {
      type: String,
      default: undefined,
    },
    description: {
      type: String,
      default: undefined,
    },
    data: {
      type: Object,
      default: undefined,
    },
    keyName: {
      type: String,
      default: undefined,
    },
  },
  setup(props, context) {
    const itemSelected = ref(false)
    const backgroundColour = computed(() => {
      return itemSelected.value ? 'bg-white' : ''
    })
    function clickItem() {
      itemSelected.value = true
      setTimeout(() => {
        context.emit('slider-change', {
          data: props.data,
          keyName: props.keyName,
        })
      }, 100)
    }
    return {
      itemSelected,
      backgroundColour,
      clickItem,
      baseUrl,
    }
  },
})
</script>

<style scoped></style>
