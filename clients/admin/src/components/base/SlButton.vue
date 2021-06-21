<template>
  <button
    class="
      flex
      justify-center
      items-center
      select-none
      font-semibold
      py-2
      px-4
      focus:outline-none
      rounded-full
      h-12
      max-w-xs
    "
    :class="[
      textClass,
      extraClasses,
      disabled ? 'bg-gray-600' : backgroundClass,
      disabled ? 'text-gray-400' : textClass,
      border ? 'border border-black' : '',
    ]"
  >
    <span v-if="text">{{ text }}</span>
    <slot></slot>
    <img
      class="w-24"
      alt="feide logo"
      v-if="logo == 'feide'"
      src="../../assets/icons/svg/feide.svg"
    />
    <svg
      v-if="logo != ''"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 144.2 69.6"
      class="fill-current w-12"
    >
      <path
        v-if="logo === 'rightArrow'"
        d="M3.5,31.3h127.3L105.4,6c-1.4-1.4-1.4-3.6,0-4.9c1.4-1.4,3.6-1.4,4.9,0l33.8,33.8l-33.8,33.8c-0.7,0.7-1.6,1-2.5,1
	s-1.8-0.3-2.5-1c-1.4-1.4-1.4-3.6,0-4.9l25.3-25.3H3.5c-1.9,0-3.5-1.6-3.5-3.5C0,32.9,1.6,31.3,3.5,31.3z"
      />
      <path
        v-if="logo === 'leftArrow'"
        d="M140.7,31.3H13.4L38.7,6c1.4-1.4,1.4-3.6,0-4.9c-1.4-1.4-3.6-1.4-4.9,0L0,34.8l33.8,33.8c0.7,0.7,1.6,1,2.5,1s1.8-0.3,2.5-1
	c1.4-1.4,1.4-3.6,0-4.9L13.4,38.3h127.3c1.9,0,3.5-1.6,3.5-3.5S142.6,31.3,140.7,31.3z"
      />
    </svg>
  </button>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
export default defineComponent({
  name: 'SlButton',
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
    },
    extraClasses: {
      type: String,
      default: '',
    },
    backgroundClass: {
      type: String,
      default: 'bg-blue-button',
    },
    textClass: {
      type: String,
      default: 'text-white',
    },
    border: {
      type: Boolean,
      default: false,
    },
  },
  setup() {
    return {}
  },
})
</script>

<style lang="postcss" scoped>
.slButton:hover {
  @apply bg-blue-700;
}
</style>
