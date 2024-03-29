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
  <div class="flex flex-col">
    <label
      class="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
      :class="{ 'pl-4': border }"
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
        @keyup.enter="enterKey"
      />
    </template>
    <template
      v-if="
        mode == 'text' ||
        mode === 'password' ||
        mode === 'phonenumber' ||
        mode === 'otc'
      "
    >
      <div
        class="w-full bg-white flex items-center p-4"
        :class="{
          'rounded-full shadow-inner': border,
          'invalid-value': !isValid,
        }"
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
          :type="
            mode == 'password'
              ? 'password'
              : mode == 'phonenumber'
              ? 'number'
              : 'text'
          "
          :id="elementId"
          :autocomplete="mode === 'otc' ? 'one-time-code' : ''"
          v-model="selectedValue"
          @input="valueInput"
          @keyup.enter="enterKey"
        />
      </div>
    </template>
    <template v-if="mode === 'textarea'">
      <textarea
        class="w-full"
        :id="elementId"
        :rows="rows"
        :placeholder="placeholder"
        v-model="selectedValue"
        @input="valueInput"
        @keyup.enter="enterKey"
      />
    </template>
    <template v-if="mode == 'email'">
      <div
        class="w-full bg-white flex items-center p-4"
        :class="{
          'rounded-full shadow-inner': border,
          'invalid-value': !isValid,
        }"
      >
        <input
          class="
            mr-1
            mb-1
            w-full
            px-1
            placeholder-black placeholder-opacity-25
            bg-transparent
          "
          :placeholder="placeholder"
          type="email"
          :id="elementId"
          v-model="selectedValue"
          @input="valueInput"
          @keyup.enter="enterKey"
        />
      </div>
    </template>
    <template v-if="mode == 'multiChoice'">
      <div class="flex flex-col" :id="elementId">
        <div
          v-for="o in options"
          :key="`${elementId}-option-${o.itemName.replace(/\s/g, '')}`"
          class="py-1"
        >
          <input
            class="mr-1 mb-1"
            type="checkbox"
            :id="`${elementId}-option-${o.itemName.replace(/\s/g, '')}`"
            :value="o.item"
            v-model="selectedMultiChoice"
            @change="valueInput"
          />
          <label
            class="mr-2"
            :for="`${elementId}-option-${o.itemName.replace(/\s/g, '')}`"
            >{{ o.itemName }}</label
          >
        </div>
      </div>
    </template>
    <template v-if="mode == 'singleChoice'">
      <div class="flex flex-col ml-2" :id="elementId">
        <div
          v-for="o in options"
          :key="`${elementId}-option-${o.itemName.replace(/\s/g, '')}`"
        >
          <input
            class="mr-1 mb-1"
            type="radio"
            :id="`${elementId}-option-${o.itemName.replace(/\s/g, '')}`"
            :value="o.item"
            v-model="selectedValue"
            @change="valueInput"
          />
          <label
            class="mr-2"
            :for="`${elementId}-option-${o.itemName.replace(/\s/g, '')}`"
            >{{ o.itemName }}</label
          >
        </div>
      </div>
    </template>
    <template v-if="mode == 'conditional'">
      <div class="flex flex-col py-1" :id="elementId">
        <div
          v-for="(o, i) in options"
          :key="`${elementId}-option-${o.itemName.replace(/\s/g, '')}`"
        >
          <input
            class="mr-1 mb-1"
            type="radio"
            :id="`${elementId}-option-${o.itemName.replace(/\s/g, '')}`"
            :value="o.item"
            v-model="selectedValue"
            @change="valueInput"
          />
          <label
            class="mr-2"
            :for="`${elementId}-option-${o.itemName.replace(/\s/g, '')}`"
            >{{ o.itemName }}</label
          >
          <AnswerInput
            v-if="selectedValue === o.item"
            class="pl-4"
            mode="multiChoice"
            :id="`${elementId}-cond-option-${o.itemName.replace(/\s/g, '')}`"
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
import { defineComponent, ref, toRefs, Ref, watch, PropType } from 'vue'
import { useI18n } from 'vue-i18n'

interface OptionItem {
  itemName: string
  item: unknown
}
const messages = {
  nb_NO: {
    invalidEntry: 'ugyldig verdi',
  },
  en: {
    invalidEntry: 'invalid value',
  },
}
export default defineComponent({
  name: 'AnswerInput',
  props: {
    modelValue: {
      type: [String, Boolean, Number],
      required: true,
    },
    id: {
      type: String,
    },
    mode: {
      type: String,
      default: 'binary',
    },
    required: {
      type: Boolean,
      default: false,
    },
    options: {
      type: Array as PropType<OptionItem[]>,
      default: () => [],
    },
    label: {
      type: String,
      default: '',
    },
    rows: {
      type: Number,
      default: 5,
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
      default: false,
    },
  },
  emits: ['change', 'update:modelValue', 'update:valid', 'enterkey'],
  setup(props, context) {
    const { mode, modelValue, id } = toRefs(props)
    const { t } = useI18n({ messages })
    const selectedValue: Ref<string> = modelValue
      ? ref(String(modelValue.value))
      : ref('')
    const selectedMultiChoice = ref([])
    const isValid = ref(true)
    const emailRegex = new RegExp(
      /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/
    )
    const noWhitespacesRegex = new RegExp(/^(?!.*\s)/)
    const elementId = id
      ? id.value
      : 'ai-id-' + Math.floor(Math.random() * 10000000)

    const enterKey = () => {
      context.emit('enterkey')
    }

    watch(modelValue, (newValue) => {
      selectedValue.value = String(newValue)
      if (!selectedValue.value) isValid.value = true
    })

    const valueInput = ($event: InputEvent): void => {
      const ie = $event.target as HTMLInputElement
      $event.stopImmediatePropagation()
      let value
      switch (mode.value) {
        case 'text':
          value = ie.value
          isValid.value =
            !props.required || (typeof value === 'string' && !!value)
          break
        case 'phonenumber':
          // Accept only numbers for phone, remove non digit
          value = Number(ie.value)
          isValid.value =
            !props.required ||
            (!!ie.value &&
              ie.value.length == 8 &&
              Number.isFinite(value) &&
              value > -1)
          if (Number.isNaN(value)) value = t('invalidEntry')
          break
        case 'password':
          value = ie.value
          isValid.value =
            !props.required || noWhitespacesRegex.test(value as string)
          break
        case 'email':
          value = ie.value
          isValid.value = !props.required || emailRegex.test(value as string)
          break
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
      context.emit('update:valid', isValid.value) // Vue3 supports multiple v-model using naming - indicates the current entry is valid
      context.emit('change', value) // Also possible to listen for this change event if not using v-model
    }

    return {
      selectedValue,
      selectedMultiChoice,
      elementId,

      isValid,
      valueInput,
      enterKey,
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
.invalid-value {
  @apply bg-red-600 bg-opacity-30;
}
input {
  background-color: rgba(0, 0, 0, 0);
}
label {
  @apply pointer-events-none;
}

/* Chrome, Safari, Edge, Opera */
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* Firefox */
input[type='number'] {
  -moz-appearance: textfield;
}
</style>
