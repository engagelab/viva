<template>
  <div class="flex flex-row items-center justify-between viva-item max-w-xs">
    <div v-if="!editing" class="flex flex-row items-center">
      <p>{{ initialName }}</p>
      <div @click="editNewitem()">
        <SVGSymbol
          v-if="!initialName"
          class="p-2 text-viva-korall fill-current cursor-pointer"
          applyClasses="w-4 md:w-4"
          rotation="0"
          symbol="addNew"
        />
        <SVGSymbol
          v-else
          class="p-2 text-viva-korall fill-current cursor-pointer"
          applyClasses="w-4 md:w-4"
          rotation="0"
          symbol="edit"
        />
      </div>
    </div>
    <div v-else class="flex">
      <Input @input="(newValue) => (name = newValue)" v-model="name" />
      <div class="pl-4" @click="removeNewitem()">
        <SVGSymbol
          class="p-2 text-viva-korall fill-current cursor-pointer"
          applyClasses="w-4 md:w-4"
          rotation="0"
          symbol="remove"
        />
      </div>
      <div class="pl-4" @click="addNewitem()" v-if="name != ''">
        <SVGSymbol
          class="p-2 text-viva-korall fill-current cursor-pointer"
          applyClasses="w-4 md:w-4"
          rotation="0"
          symbol="accept"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, toRefs } from 'vue'
import SVGSymbol from './SVGSymbol.vue'
import Input from './Input.vue'

export default defineComponent({
  components: {
    SVGSymbol,
    Input,
  },
  props: {
    initialName: {
      type: String,
      default: '',
    },
    filter: {
      type: String,
      default: '\\W',
    },
  },
  setup(props, context) {
    const { initialName, filter } = toRefs(props)
    const name = ref('')
    const editing = ref(false)
    if (initialName.value) {
      name.value = initialName.value
    }
    function editNewitem() {
      if (initialName.value) {
        name.value = initialName.value
      }
      editing.value = true
    }
    function removeNewitem() {
      name.value = initialName.value || ''
      editing.value = false
    }
    function addNewitem() {
      let regex
      regex = new RegExp(filter.value, 'g')
      const newName = name.value.replace(regex, '')
      context.emit('new-text', newName)
      removeNewitem()
    }

    return {
      editing,
      name,

      editNewitem,
      removeNewitem,
      addNewitem,
    }
  },
})
</script>
