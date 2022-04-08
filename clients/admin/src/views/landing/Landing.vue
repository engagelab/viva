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
  <div class="bg-blue-400 h-screen">
    <div class="flex flex-col mt-36 text-xl place-items-center">
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
