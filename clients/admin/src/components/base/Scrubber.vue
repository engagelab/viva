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
  <input
    class="w-full custom"
    type="range"
    :id="name"
    :value="value"
    :min="min"
    :max="max"
    :step="step"
    @change="$emit('change', $event.target.value)"
    @input="$emit('input', $event.target.value)"
  />
</template>

<script lang="ts">
import { defineComponent } from 'vue'
export default defineComponent({
  props: {
    value: {
      type: String,
      default: '0',
    },
    min: {
      type: Number,
      default: 0,
    },
    max: {
      type: Number,
      default: 0,
    },
    step: {
      type: Number,
      default: 1,
    },
  },
  setup() {
    const name = Math.random()
    return {
      name,
    }
  },
})
</script>

<style scoped>
input {
  display: inline;
  max-width: 100%;
}
.touch {
  width: 40%;
}

.custom {
  outline: none;
  -webkit-appearance: none !important;
  height: 20px;
  border-radius: 8px;
  background: -webkit-gradient(
    linear,
    center top,
    center bottom,
    from(#cfdcdd),
    to(#dfe9ea),
    color-stop(50%, #dfe9ea)
  );
  -webkit-transition: background 450ms;
  transition: background 450ms;
}

/* Change the Slider Button Color Here */
.custom::-webkit-slider-thumb {
  -webkit-appearance: none !important;
  background: #8d8884;
  height: 30px;
  width: 30px;
  border: solid 4px #f05d5d;
  border-radius: 15px;
}

.custom::-webkit-slider-thumb:before {
  background-color: yellow;
}
</style>
