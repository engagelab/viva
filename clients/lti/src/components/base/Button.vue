<template>
  <button
    class="flex justify-center items-center py-2 rounded-full shadow-md"
    :class="[
      textcolour,
      backgroundcolour && !disabled ? backgroundcolour : '',
      disabled ? 'text-gray-400 bg-viva-grey-450' : '',
      childclass ? childclass : 'w-56',
    ]"
    @click="click"
  >
    <slot></slot>
    <img
      class="w-24"
      v-if="logo == 'feide'"
      src="../../assets/icons/svg/feide.svg"
      alt="feide logo"
    />
    <img
      class="w-24"
      v-if="logo == 'canvas'"
      src="../../assets/icons/svg/canvas.svg"
      alt="canvas logo"
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
    childclass: {
      type: String,
    },
    textcolour: {
      type: String,
      default: 'text-white',
    },
    backgroundcolour: {
      type: String,
    },
    disabled: {
      type: Boolean,
      default: false,
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
