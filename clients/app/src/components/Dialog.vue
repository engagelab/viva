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
          @click="dialog.doneCallback(true)"
          :text="dialog.data.confirmText"
          :customWidth="'8rem'"
        />
        <Button
          @click="dialog.doneCallback(false)"
          :text="dialog.data.cancelText"
          :customWidth="'8rem'"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { useAppStore } from '@/store/useAppStore'
const { getters: appGetters } = useAppStore()
export default defineComponent({
  setup() {
    const dialog = appGetters.dialog
    return {
      dialog,
    }
  },
})
</script>
