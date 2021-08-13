<template>
  <button
    class="flex justify-center items-center py-2 bg-white rounded-full shadow-md"
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
