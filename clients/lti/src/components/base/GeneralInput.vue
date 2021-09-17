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
  <div class="flex p-2 bg-white rounded-md">
    <div v-if="type == 'text'" class="flex flex-row flex-1">
      <label v-if="label" :for="name" class="flex-grow-0 mr-4"
        >{{ label }}:</label
      >
      <div class="flex flex-1">
        <input
          type="text"
          class="min-w-0 flex-1"
          :id="name"
          :name="name"
          :value="value"
          @change="onInput"
          @input="onInput"
          @blur="iOSScrollFix()"
        />
      </div>
    </div>
    <div v-if="type == 'checkbox'">
      <label :for="name" class="mr-4">{{ label }}</label>
      <input
        type="checkbox"
        :id="name"
        :name="name"
        :checked="checked"
        @change="onInput"
      />
    </div>
    <div v-if="type == 'textarea'" class="flex-1 p-4">
      <textarea
        class="w-full"
        :rows="rows"
        :id="name"
        :name="name"
        :value="value"
        :placeholder="placeholder"
        @change="onInput"
        @input="onInput"
        @blur="iOSScrollFix()"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
export default defineComponent({
  name: 'Login',
  model: {
    prop: 'value',
    event: 'input',
  },
  props: {
    value: {
      type: String,
      default: '',
    },
    label: {
      type: String,
      default: '',
    },
    type: {
      type: String, // 'text' or 'checkbox' or 'textarea'
      default: 'text',
    },
    rows: {
      type: String,
      default: '1',
    },
    placeholder: {
      type: String,
      default: '',
    },
  },
  setup(props, { emit }) {
    const name = Math.random()
    const checked = ref(false)

    function iOSScrollFix(): void {
      window.scrollBy(0, 0)
    }
    function onInput($event: InputEvent) {
      const ie = $event.target as HTMLInputElement
      emit('input', ie.value)
    }
    return {
      name,
      onInput,
      checked,
      iOSScrollFix,
    }
  },
})
</script>

<style scoped>
input {
  display: inline;
  max-width: 100%;
}
</style>
