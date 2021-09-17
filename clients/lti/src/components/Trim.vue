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
  <div class="flex m-2 flex-col">
    <label
      class="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
    >
      trim
    </label>
    <div class="flex flex-row">
      <div
        class="flex flex-row items-center rounded-full p-2 cursor-pointer bg-white shadow-md"
        :class="
          trimButtonDisabled(0)
            ? ['bg-gray-400', 'text-white']
            : ['bg-viva-korall', 'text-black']
        "
        @click="setTrim(0)"
      >
        <SVGSymbol
          class="pointer-events-none fill-current"
          applyClasses="w-4"
          width="25"
          rotation="180"
          symbol="scissor"
        ></SVGSymbol>
        <p class="ml-2 leading-none pointer-events-none">
          ⇤{{ localEDL.trim[0].toFixed(2) }}s
        </p>
      </div>
      <div
        class="flex flex-row items-center ml-2 p-2 rounded-full cursor-pointer bg-white shadow-md"
        :class="
          trimButtonDisabled(1)
            ? ['bg-gray-400', 'text-white']
            : ['bg-viva-korall', 'text-black']
        "
        @click="setTrim(1)"
      >
        <p class="mr-2 leading-none pointer-events-none">
          {{ localEDL.trim[1].toFixed(2) }}s⇥
        </p>
        <SVGSymbol
          class="pointer-events-none fill-current"
          applyClasses="w-4"
          width="25"
          rotation="0"
          symbol="scissor"
        ></SVGSymbol>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, Ref, PropType, toRefs } from 'vue'
import { EditDecriptionList } from '@/types/main'

import SVGSymbol from '@/components/base/SVGSymbol.vue'

export default defineComponent({
  components: {
    SVGSymbol,
  },
  props: {
    edl: {
      type: Object as PropType<EditDecriptionList>,
      required: true,
    },
    videoCurrentTime: {
      type: Number,
      required: true,
    },
  },
  emits: ['updated'],
  setup(props, context) {
    const { edl, videoCurrentTime } = toRefs(props)
    const localEDL: Ref<EditDecriptionList> = ref(edl)

    function trimButtonDisabled(bound: number) {
      if (bound == 0) {
        return (
          localEDL.value.trim.length > 0 &&
          videoCurrentTime.value > localEDL.value.trim[1]
        )
      }
      return (
        localEDL.value.trim.length > 0 &&
        videoCurrentTime.value < localEDL.value.trim[0]
      )
    }
    function setTrim(bound: number) {
      if (!trimButtonDisabled(bound)) {
        localEDL.value.trim[bound] = videoCurrentTime.value
        context.emit('updated', localEDL.value)
      }
    }

    return {
      trimButtonDisabled,
      setTrim,
      localEDL,
    }
  },
})
</script>

<style scoped>
.expand-enter-active {
  transition: flex 0.5s linear;
}
.expand-leave-active {
  transition: flex 0.5s linear;
}
.expand-enter,
.expand-leave-to {
  flex: 0;
}
</style>
