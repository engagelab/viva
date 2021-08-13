<template>
  <div class="flex flex-col">
    <label
      class="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
      :class="{ 'pl-8': border }"
      :for="elementId"
    >
      {{ label }}
    </label>
    <p class="text-xs max-w-sm">{{ description }}</p>
    <template v-if="mode == 'binary'">
      <div class="flex flex-row items-center">
        <input
          class="mr-1 mb-1"
          type="radio"
          :id="elementId"
          :value="true"
          v-model="selectedValue"
          @change="valueInput"
        />
        <label class="mr-2" for="yes">ja</label>
      </div>
      <div class="flex flex-row items-center">
        <input
          class="mr-1 mb-1"
          type="radio"
          :id="elementId"
          :value="false"
          v-model="selectedValue"
          @change="valueInput"
        />
        <label class="mr-1" for="no">nei</label>
      </div>
    </template>
    <template v-if="mode == 'url'">
      <input
        type="url"
        :id="elementId"
        placeholder="https://eksempel.com"
        pattern="https://.*"
        size="30"
        required
        v-model="selectedValue"
        @input="valueInput"
      />
    </template>
    <template v-if="mode == 'text'">
      <div
        class="w-full bg-white flex items-center p-4"
        :class="{ 'rounded-full shadow-inner': border }"
      >
        <input
          class="w-full px-1 border-gray-300 focus:ring-2 focus:ring-blue-600"
          :class="{ 'border-b': underline }"
          :style="{
            width: `${customSize ? customSize + 'rem' : 'inherit'}`,
            height: `${parseInt(customSize) / 6}rem`,
            'font-size': `${parseInt(customSize) / 10}rem`,
          }"
          :placeholder="placeholder"
          type="text"
          :id="elementId"
          v-model="selectedValue"
          @input="valueInput"
        />
      </div>
    </template>
    <template v-if="mode == 'email'">
      <div
        class="w-full bg-white flex items-center p-4"
        :class="{
          'rounded-full shadow-inner': border,
          'invalid-email': !validEmail,
        }"
      >
        <input
          class="mr-1 mb-1 w-full px-1 placeholder-black placeholder-opacity-25 bg-transparent"
          :placeholder="placeholder"
          type="email"
          :id="elementId"
          v-model="selectedValue"
          @input="valueInput"
        />
      </div>
    </template>
    <template v-if="mode == 'multiChoice'">
      <div class="flex flex-col" :id="elementId">
        <div v-for="o in options" :key="o.id" class="py-1">
          <input
            class="mr-1 mb-1"
            type="checkbox"
            :id="`${elementId}-option-${o.title.replace(/\s/g, '')}`"
            :value="o.title"
            v-model="selectedMultiChoice"
            @change="valueInput"
          />
          <label
            class="mr-2"
            :for="`${elementId}-option-${o.title.replace(/\s/g, '')}`"
            >{{ o.title }}</label
          >
        </div>
      </div>
    </template>
    <template v-if="mode == 'singleChoice'">
      <div class="flex flex-col ml-2" :id="elementId">
        <div v-for="o in options" :key="o.id">
          <input
            class="mr-1 mb-1"
            type="radio"
            :id="`${elementId}-option-${o.title.replace(/\s/g, '')}`"
            :value="o.title"
            v-model="selectedValue"
            @change="valueInput"
          />
          <label
            class="mr-2"
            :for="`${elementId}-option-${o.title.replace(/\s/g, '')}`"
            >{{ o.title }}</label
          >
        </div>
      </div>
    </template>
    <template v-if="mode == 'conditional'">
      <div class="flex flex-col py-1" :id="elementId">
        <div v-for="(o, i) in options" :key="o.id">
          <input
            class="mr-1 mb-1"
            type="radio"
            :id="`${elementId}-option-${o.title.replace(/\s/g, '')}`"
            :value="o.title"
            v-model="selectedValue"
            @change="valueInput"
          />
          <label
            class="mr-2"
            :for="`${elementId}-option-${o.title.replace(/\s/g, '')}`"
            >{{ o.title }}</label
          >
          <AnswerInput
            v-if="selectedValue === o.title"
            class="pl-4"
            mode="multiChoice"
            :id="`${elementId}-option-${o.title.replace(/\s/g, '')}`"
            v-model="selectedMultiChoice"
            @input="valueInput"
            :options="conditionals[i].options"
          />
        </div>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  toRefs,
  Ref,
  watch,
  computed,
  PropType,
} from 'vue'
interface OptionItem {
  id: string
  title: string
}
export default defineComponent({
  name: 'AnswerInput',
  props: {
    modelValue: {
      type: [String, Boolean],
      required: true,
    },
    id: {
      type: String,
    },
    mode: {
      type: String,
      default: 'binary',
    },
    options: {
      type: Array as PropType<OptionItem[]>,
      default: () => [],
    },
    label: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
    conditionals: {
      type: Object,
      default: () => ({}),
    },
    placeholder: {
      type: String,
      default: '',
    },
    // Use for scaling the input size for text input
    customSize: {
      type: String,
      default: '',
    },
    border: {
      type: Boolean,
      default: true,
    },
    underline: {
      type: Boolean,
      default: true,
    },
  },
  setup(props, context) {
    const { mode, modelValue, id } = toRefs(props)
    const selectedValue: Ref<string> = modelValue
      ? ref(String(modelValue.value))
      : ref('')
    const selectedMultiChoice = ref([])
    const elementId = id
      ? id.value
      : 'ai-id-' + Math.floor(Math.random() * 10000000)

    watch(
      () => props.modelValue,
      (newValue) => {
        selectedValue.value = String(newValue)
      }
    )

    const validEmail = computed(() => {
      const regex = new RegExp(
        /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/
      )
      return regex.test(selectedValue.value as string)
    })

    const valueInput = ($event: InputEvent): void => {
      const ie = $event.target as HTMLInputElement
      $event.stopImmediatePropagation()
      let value
      switch (mode.value) {
        case 'binary':
          value = ie.value === 'true'
          break
        case 'multiChoice':
          value = selectedMultiChoice.value
          break
        case 'conditional':
          value = {
            level1: selectedValue.value,
            level2: selectedMultiChoice.value,
          }
          break
        default:
          value = ie.value
      }
      context.emit('update:modelValue', value) // If using v-model on this element, this is the updated value
      context.emit('change', value) // Also possible to listen for this change event if not using v-model
    }

    return {
      selectedValue,
      selectedMultiChoice,
      elementId,

      validEmail,
      valueInput,
    }
  },
})
</script>

<style lang="postcss" scoped>
.inputQ {
  @apply mr-1 whitespace-nowrap;
}
.valid-email {
  @apply bg-green-400;
}
.invalid-email {
  @apply bg-red-600 bg-opacity-30;
}
label {
  @apply pointer-events-none;
}
</style>
