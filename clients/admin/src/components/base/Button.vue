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
  <button
    class="
      flex
      justify-center
      items-center
      py-2
      bg-white
      rounded-full
      shadow-md
    "
    :class="{ 'text-gray-400': disabled }"
    :style="{ width: customWidth }"
    @click="click"
  >
    <span v-if="text" class="text-xl">{{ text }}</span>
    <slot></slot>
    <img
      class="w-24"
      v-if="logo == 'feide'"
      src="../../assets/icons/svg/feide.svg"
    />
    <img
      class="pl-2 w-24"
      v-if="logo == 'google'"
      src="../../assets/icons/svg/google_drive.svg"
    />
    <img
      class="w-24"
      v-if="logo == 'canvas'"
      src="../../assets/icons/svg/canvas.svg"
    />
  </button>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  props: {
    logo: {
      type: String,
      default: '',
    },
    text: {
      type: String,
      default: '',
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    customWidth: {
      type: String,
      default: '14rem',
    },
  },
  emits: ['vclick'],
  setup(props, context) {
    function click($event: Event) {
      if (!props.disabled) {
        context.emit('vclick', $event)
      }
    }
    return {
      click,
    }
  },
})
</script>

<style scoped></style>
