<template>
  <div class="mt-4 bg-blue-400 h-screen">
    <div
      class="flex flex-col mt-36 text-xl grid grid-rows-1 justify-items-center"
    >
      <h1>{{ t('heading') }}</h1>
      <div class="flex m-4 space-x-4 mt-48">
        <Button
          class="mx-2 text-l bg-white hover:bg-blue-500 rounded-lg"
          @click="login('uio')"
        >
          {{ t('login') }}</Button
        >
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import Button from '@/components/base/Button.vue'
import { baseUrl } from '@/constants'
import { useI18n } from 'vue-i18n'
const messages = {
  nb_NO: {
    heading: 'Viva Administration',
    login: ' Login with Feide',
  },
  en: {
    heading: 'Viva Administration',
    login: ' Login with Feide',
  },
}

export default defineComponent({
  name: 'Landing',
  components: {
    Button,
  },
  setup() {
    const { t } = useI18n({ messages })
    const login = (organization: string) => {
      let feideLoginUrl = `${baseUrl}/auth/dataporten/login?organization=${organization}&device=webApp&client=admin`
      window.location.href = feideLoginUrl
    }

    return {
      t,
      login,
    }
  },
})
</script>

<style scoped></style>
