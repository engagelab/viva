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
  <div v-if="dialog.visible" class="absolute w-full p-4">
    <div
      class="
        relative
        .inset-x-0.top-auto
        m-auto
        mt-32
        flex flex-col
        p-2
        bg-viva-beige
        rounded
        shadow
      "
    >
      <p class="text-xl text-viva-korall text-center mt-2">
        {{ dialog.data.titleText }}
      </p>
      <p class="mt-4 text-center">{{ dialog.data.messageText }}</p>
      <div v-if="dialog" class="flex justify-around mt-6 mb-3">
        <Button
          @vclick="dialog.doneCallback(true)"
          :text="dialog.data.confirmText"
          :customWidth="'8rem'"
        />
        <Button
          @vclick="dialog.doneCallback(false)"
          :text="dialog.data.cancelText"
          :customWidth="'8rem'"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import Button from '@/components/base/Button.vue'
import { useNotifyStore } from '@/store/useNotifyStore'
const { getters: notifyGetters } = useNotifyStore()
export default defineComponent({
  name: 'dialog-box',
  components: {
    Button,
  },
  setup() {
    const dialog = notifyGetters.dialog
    return {
      dialog,
    }
  },
})
</script>
