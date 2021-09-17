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
    class="flex flex-row items-center justify-between px-4 md:px-12"
    :class="backgroundColour"
    @click="clickItem()"
  >
    <div class="max-w-24">
      <slot></slot>
    </div>
    <div class="pl-4">
      <SVGSymbol
        class="p-2 fill-current"
        :class="disabled ? 'text-gray-400' : 'text-viva-korall'"
        applyClasses="w-4 md:w-8"
        rotation="0"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue'
import router from '@/router'
import SVGSymbol from './SVGSymbol.vue'

export default defineComponent({
  components: {
    SVGSymbol,
  },
  props: {
    routePath: {
      type: String,
      default: '',
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    let itemSelected = false
    const backgroundColour = computed(() => {
      return itemSelected ? 'bg-white' : ''
    })
    function clickItem(): void {
      if (!props.disabled) {
        itemSelected = true
        setTimeout(() => {
          router.push(props.routePath)
        }, 100)
      }
    }
    return {
      itemSelected: false,
      backgroundColour,
      clickItem,
    }
  },
})
</script>

<style scoped></style>
