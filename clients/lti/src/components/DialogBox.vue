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
  <div
    class="my-6 flex flex-row flex-wrap bg-viva-grey-400 text-viva-grey-500 rounded-3xl p-6 w-auto"
  >
    <div class="flex flex-col items-center text-white max-w-md">
      <p class="text-2xl font-medium">{{ dialogConfig.title }}</p>
      <p class="m-2">{{ dialogConfig.text }}</p>
      <div class="flex flex-row w-full justify-around mt-4">
        <Button
          @click="dialogConfig.confirm"
          :backgroundcolour="'bg-white'"
          :textcolour="'text-black'"
          :childclass="'h-12 w-32'"
          >{{ dialogConfig.confirmText }}</Button
        >
        <Button
          @click="dialogConfig.cancel"
          :backgroundcolour="'bg-viva-blue-800'"
          :textcolour="'text-white'"
          :childclass="'h-12 w-32'"
          >{{ dialogConfig.cancelText }}</Button
        >
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { useAppStore } from '@/store/useAppStore'
import Button from './base/Button.vue'
const { getters: appGetters } = useAppStore()

export default defineComponent({
  name: 'DialogBox',
  components: {
    Button,
  },
  setup() {
    return {
      dialogConfig: appGetters.dialogConfig,
    }
  },
})
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style type="postcss" scoped></style>
