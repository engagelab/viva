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
    class="m-2 relative transform ease-linear duration-75"
    :class="{
      selectedClass: selected,
      mouseDownClass: mouseIsDown,
      'rounded-xl': corners,
      'rounded-full': !corners,
    }"
    :style="{ backgroundColor: colour }"
    @mousedown="mouseIsDown = true"
    @mouseup="mouseIsDown = false"
    @touchstart="mouseIsDown = true"
    @touchend="mouseIsDown = false"
  >
    <slot />
    <div
      v-if="selected"
      class="absolute top-0 right-0 -m-2 rounded-full p-2 bg-green-highlight"
      :class="{ '-m-3': corners }"
    >
      <img
        class="w-4 h-4"
        alt="selected"
        src="@/assets/icons/svg/checked.svg"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'

export default defineComponent({
  name: 'ItemSelection',
  props: {
    selected: {
      type: Boolean,
      required: true,
    },
    colour: {
      type: String,
      required: false,
      default: '#ffffff',
    },
    corners: {
      type: Boolean,
    },
  },
  setup() {
    const mouseIsDown = ref(false)
    return {
      mouseIsDown,
    }
  },
})
</script>

<style lang="postcss" scoped>
.selectedClass {
  @apply border-4 border-green-highlight border-solid;
}
.mouseDownClass {
  @apply scale-95;
}
/* @media (min-width: 768px) {
  .selectedClass {
    @apply border-4 border-green-highlight border-solid;
  }
} */
</style>
