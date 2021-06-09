<template>
  <div
    class="flex flex-row items-center justify-between px-4 md:px-12"
    :class="backgroundColour"
    @click="clickItem()"
  >
    <div class="max-w-24">
      <slot></slot>
    </div>
    <div class="pl-4">
      <SVGSymbol
        class="p-2 fill-current"
        :class="disabled ? 'text-gray-400' : 'text-viva-korall'"
        applyClasses="w-4 md:w-8"
        rotation="0"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue'
import SVGSymbol from './SVGSymbol'

export default defineComponent({
  components: {
    SVGSymbol,
  },
  props: {
    routePath: {
      type: String,
      default: '',
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  setup() {
    const backgroundColour = computed(() => {
      return this.itemSelected ? 'bg-white' : ''
    })
    function clickItem() {
      if (!this.disabled) {
        this.itemSelected = true
        setTimeout(() => {
          this.$router.push(this.routePath)
        }, 100)
      }
    }
    return {
      itemSelected: false,
      backgroundColour,
      clickItem,
    }
  },
})
</script>

<style scoped></style>
