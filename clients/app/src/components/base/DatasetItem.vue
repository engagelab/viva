<template>
  <div
    class="flex flex-row items-center justify-between viva-item max-w-xs"
    :class="backgroundColour"
    @click="clickItem()"
  >
    <div class="max-w-12">
      <p class="font-vagBold">
        <strong>{{ title }}</strong>
      </p>
      <p>{{ description }}</p>
    </div>
    <div class="pl-4">
      <SVGSymbol
        class="p-2 text-viva-korall fill-current cursor-pointer"
        applyClasses="w-4 md:w-8"
        rotation="0"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue'

import SVGSymbol from './SVGSymbol.vue'
import { baseUrl } from '@/constants'

export default defineComponent({
  components: {
    SVGSymbol,
  },
  props: {
    title: {
      type: String,
      default: undefined,
    },
    description: {
      type: String,
      default: undefined,
    },
    data: {
      type: Object,
      default: undefined,
    },
    keyName: {
      type: String,
      default: undefined,
    },
  },
  setup(props, context) {
    const itemSelected = ref(false)
    const backgroundColour = computed(() => {
      return itemSelected.value ? 'bg-white' : ''
    })
    function clickItem() {
      itemSelected.value = true
      setTimeout(() => {
        context.emit('slider-change', {
          data: props.data,
          keyName: props.keyName,
        })
      }, 100)
    }
    return {
      itemSelected,
      backgroundColour,
      clickItem,
      baseUrl,
    }
  },
})
</script>

<style scoped></style>
