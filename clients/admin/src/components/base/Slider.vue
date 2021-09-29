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
  <div>
    <transition
      name="slide-fade"
      :leave-to-class="leaveToClass"
      :enter-class="enterClass"
      mode="out-in"
    >
      <component
        :is="selectedPage"
        :stateFromParent="stateToChildren"
        @slider-back="sliderBack"
        v-bind="$attrs"
      />
    </transition>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  onMounted,
  watch,
  ref,
  PropType,
  Ref,
  toRefs,
} from 'vue'
import router from '@/router'
export default defineComponent({
  props: {
    pages: {
      type: Object as PropType<number[]>,
      required: true,
    },
    movePageTo: {
      type: String,
      default: '0',
    },
    stateToChildren: {
      type: Object,
      default: () => ({}),
    },
  },
  setup(props) {
    const selectedPage = ref(0)
    const { movePageTo, pages } = toRefs(props)
    const previousPages: Ref<number[]> = ref([])
    const leaveToClass = ref('slide-fade-leave-to-right')
    const enterClass = ref('slide-fade-enter-right')
    onMounted(() => {
      const page = parseInt(movePageTo.value) || 0
      selectedPage.value = props.pages.length > 0 ? props.pages[page] : 0
    })
    watch(
      () => movePageTo.value,
      (nextPage) => {
        const currentPageNumber = pages.value.indexOf(selectedPage.value)
        const nextPageNumber = parseInt(nextPage)
        const direction = currentPageNumber < nextPageNumber ? 'left' : 'right'
        enterClass.value = `slide-fade-enter-${direction}`
        leaveToClass.value = `slide-fade-leave-to-${direction}`
        selectedPage.value = props.pages[nextPageNumber]
        if (nextPageNumber === 0) {
          previousPages.value.length = 0
        } else if (nextPageNumber > currentPageNumber) {
          previousPages.value.push(currentPageNumber)
        }
      }
    )
    function sliderBack() {
      const nextPageNumber = previousPages.value.pop() || 0
      router.push(`/login?page=${nextPageNumber}`)
    }

    return {
      selectedPage,
      previousPages: [],
      leaveToClass,
      enterClass,
      sliderBack,
    }
  },
})
</script>

<style scoped>
input {
  display: inline;
  max-width: 100%;
}
.slide-fade-enter-active {
  transition: all 0.3s linear;
}
.slide-fade-leave-active {
  transition: all 0.3s linear;
}
.slide-fade-enter-right {
  transform: translateX(-100px);
  opacity: 0;
  position: absolute;
}
.slide-fade-leave-to-right {
  transform: translateX(100px);
  opacity: 0;
}
.slide-fade-enter-left {
  transform: translateX(100px);
  opacity: 0;
  position: absolute;
}
.slide-fade-leave-to-left {
  transform: translateX(-100px);
  opacity: 0;
}
</style>
