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
