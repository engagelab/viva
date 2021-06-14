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
