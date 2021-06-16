<template>
  <div class="flex flex-col max-w-sm m-2">
    <p class="uppercase text-gray-700 text-xs font-bold pb-2">
      {{ label }}
    </p>

    <select
      class="
        block
        w-full
        py-2
        px-3
        border border-gray-300
        bg-white
        rounded-md
        shadow-sm
        focus:outline-none focus:ring-indigo-500 focus:border-indigo-500
        sm:text-sm
      "
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
      type: Array as PropType<OptionItem[]>,
      default: () => [],
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
