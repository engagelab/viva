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
