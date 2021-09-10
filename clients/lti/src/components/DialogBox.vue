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
