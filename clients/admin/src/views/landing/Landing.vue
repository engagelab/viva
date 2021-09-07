<template>
  <div class="mt-4 bg-blue-400 h-screen">
    <div
      class="flex flex-col mt-36 text-xl grid grid-rows-1 justify-items-center"
    >
      <h1>i18n Viva Administration</h1>
      <div class="flex m-4 space-x-4 mt-48">
        <Button
          class="mx-2 text-l bg-white hover:bg-blue-500 rounded-lg"
          @click="login('uio')"
          >i18n Login with Feide</Button
        >
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import Button from '@/components/base/Button.vue'
import { baseUrl } from '@/constants'
export default defineComponent({
  name: 'Landing',
  components: {
    Button,
  },
  setup() {
    const login = (organization: string) => {
      let feideLoginUrl = `${baseUrl}/auth/dataporten/login?organization=${organization}&device=webApp&client=admin`
      window.location.href = feideLoginUrl
    }

    return {
      login,
    }
  },
})
</script>

<style scoped></style>
