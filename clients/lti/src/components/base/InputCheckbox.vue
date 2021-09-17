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
    <label :for="name" class="mr-4">
      {{ label }}
      <input type="checkbox" :id="name" :name="name" v-model="input" />
    </label>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { validate } from '../../composition/useInputValidator'

export default defineComponent({
  name: 'InputCheckbox',
  props: {
    value: {
      type: String,
      default: '',
    },
    label: {
      type: String,
      default: '',
    },
  },
  setup(props, { emit }) {
    const name = Math.random()
    const { input /* , errors */ } = validate(
      props.value,
      [], // Add validators to the array e.g. [minLength(3)]
      (value) => emit('input', value)
    )
    return {
      name,
      input,
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
