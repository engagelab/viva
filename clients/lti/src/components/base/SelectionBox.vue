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
  <div class="flex flex-col max-w-sm">
    <p class="uppercase text-gray-700 text-xs font-bold pb-2">
      {{ label }}
    </p>

    <select
      class="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
      :id="elementId"
      :value="displayValue.itemName"
      @change="updateSelection"
    >
      <option value="" disabled>Choose..</option>
      <option v-for="(o, i) in options" :key="i" :value="o.itemName">
        {{ o.itemName }}
      </option>
    </select>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch, toRefs, PropType } from 'vue'
interface OptionItem {
  item: unknown
  itemName: string
}
export default defineComponent({
  name: 'SelectionBox',
  props: {
    label: {
      type: String,
      default: '',
    },
    modelValue: {
      type: Object as PropType<OptionItem>,
      default: () => ({}),
      required: true,
    },
    id: {
      type: String,
    },
    options: {
      // SelectionBox should take options as: [{ item: any, itemName: string }]
      type: Object as PropType<OptionItem[]>,
      default: () => ({}),
    },
    resetOnChoose: {
      type: Boolean,
      default: false,
    },
  },
  // Emits the selected option in its original form: { item: any, itemName: string }
  emits: ['change', 'update:modelValue'],
  setup(props, context) {
    const { modelValue, id } = toRefs(props)
    const displayValue = ref(modelValue.value)
    const elementId = id
      ? id.value
      : 'select-' + Math.floor(Math.random() * 10000000)

    watch(
      () => props.modelValue,
      (newValue) => {
        displayValue.value = newValue
      }
    )

    const updateSelection = ($event: Event) => {
      const ie = $event.target as HTMLSelectElement
      const selection: OptionItem | undefined = props.options.find(
        (o) => o.itemName === ie.value
      )
      if (selection) {
        displayValue.value = selection
        context.emit('change', selection)
        context.emit('update:modelValue', selection)
        if (props.resetOnChoose) {
          displayValue.value = { item: undefined, itemName: '' }
        }
      }
    }
    return {
      displayValue,
      updateSelection,
      elementId,
    }
  },
})
</script>

<style scoped>
select {
  -webkit-appearance: menu-item;
  -moz-appearance: menu-item;
  height: 3em;
}
</style>
