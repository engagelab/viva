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
import router from '@/router'
import SVGSymbol from './SVGSymbol.vue'

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
  setup(props) {
    let itemSelected = false
    const backgroundColour = computed(() => {
      return itemSelected ? 'bg-white' : ''
    })
    function clickItem(): void {
      if (!props.disabled) {
        itemSelected = true
        setTimeout(() => {
          router.push(props.routePath)
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
