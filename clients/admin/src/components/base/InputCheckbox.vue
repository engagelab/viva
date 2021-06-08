<template>
  <div class="flex p-2 bg-white rounded-md">
    <label :for="name" class="mr-4">
      {{ label }}
      <input type="checkbox" :id="name" :name="name" v-model="input" />
    </label>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { validate } from '../../composition/useInputValidator'

export default defineComponent({
  name: 'InputCheckbox',
  props: {
    value: {
      type: String,
      default: '',
    },
    label: {
      type: String,
      default: '',
    },
  },
  setup(props, { emit }) {
    const name = Math.random()
    const { input /* , errors */ } = validate(
      props.value,
      [], // Add validators to the array e.g. [minLength(3)]
      (value) => emit('input', value)
    )
    return {
      name,
      input,
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
