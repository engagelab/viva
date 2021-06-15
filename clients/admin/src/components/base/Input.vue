<template>
  <div class="flex p-2 bg-white rounded-md">
    <div v-if="type == 'text'" class="flex flex-row flex-1">
      <label v-if="label" :for="name" class="flex-grow-0 mr-4"
        >{{ label }}:</label
      >
      <div class="flex flex-1">
        <input
          type="text"
          class="min-w-0 flex-1"
          :id="name"
          :name="name"
          :value="value"
          @change="$emit('change', $event.target.value)"
          @input="$emit('input', $event.target.value)"
          @blur="iOSScrollFix()"
        />
      </div>
    </div>
    <div v-if="type == 'checkbox'">
      <label :for="name">{{ label }}</label>
      <input
        type="checkbox"
        :id="name"
        :name="name"
        :checked="value"
        @input="$emit('input', $event.target.value)"
      />
    </div>
    <div v-if="type == 'textarea'" class="flex-1 p-4">
      <textarea
        class="w-full"
        :rows="rows"
        :id="name"
        :name="name"
        :value="value"
        :placeholder="placeholder"
        @change="$emit('change', $event.target.value)"
        @input="$emit('input', $event.target.value)"
        @blur="iOSScrollFix()"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
export default defineComponent({
  model: {
    prop: 'value',
    event: 'input',
  },
  props: {
    value: {
      type: String,
      default: '',
    },
    label: {
      type: String,
      default: '',
    },
    type: {
      type: String, // 'text' or 'checkbox' or 'textarea'
      default: 'text',
    },
    rows: {
      type: String,
      default: '1',
    },
    placeholder: {
      type: String,
      default: '',
    },
  },
  setup() {
    const name = Math.random()
    const iOSScrollFix = () => {
      window.scrollBy(0, 0)
    }
    return {
      name,
      iOSScrollFix,
    }
  },
})
</script>

<style scoped>
input {
  display: inline;
  max-width: 100%;
}
</style>