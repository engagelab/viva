<template>
  <div class="mt-4 bg-blue-400 h-screen">
    <div
      class="flex flex-col mt-36 text-xl grid grid-rows-1 justify-items-center"
    >
      Viva Admin
      <div class="flex m-4 space-x-4">
        <div
          class="mx-2 text-l bg-blue-400 hover:bg-blue-500 rounded-lg"
          @click="login('canvas')"
        >
          <p class="mx-2">Canvas Login</p>
        </div>
        <div
          class="mx-2 text-l bg-blue-400 hover:bg-blue-500 rounded-lg"
          @click="login('feide')"
        >
          <p class="mx-2">Feide Login</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { baseUrl } from '@/constants'
// import { useAppStore } from '../../store/useAppStore'
export default defineComponent({
  name: 'Landing',
  setup() {
    // const { actions: appActions } = useAppStore()
    const login = (mode: string) => {
      if (mode == 'canvas') {
        let canvasLoginUrl = `${baseUrl}/auth/canvas/login/user`
        canvasLoginUrl += '?device=webApp&client=admin'
        window.location.href = canvasLoginUrl
        // appActions.canvasLogin()
      } else if (mode == 'feide') {
        let feideLoginUrl = `${baseUrl}/auth/dataporten/login`
        feideLoginUrl += '?device=webApp&client=admin'
        window.location.href = feideLoginUrl
      }
    }

    return {
      login,
    }
  },
})
</script>

<style scoped></style>
