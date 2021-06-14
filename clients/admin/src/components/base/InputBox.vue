<template>
  <div class="px-3 mb-6 md:mb-0">
    <label
      class="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
      for="grid-state"
    >
      {{ name }}
    </label>
    <div class="relative">
      <input class="p-1" @input="onInput" :value="value" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
export default defineComponent({
  name: 'InputBox',
  props: {
    name: {
      type: String,
      default: '',
    },
    value: {
      type: String,
    },
  },

  methods: {
    onInput($event: InputEvent) {
      const ie = $event.target as HTMLInputElement
      console.log(ie)
      this.$emit('input', ie.value)
    },
  },
})
</script>

<style scoped></style>
