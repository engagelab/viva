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
  <div class="p-4 text-3xl md:text-3xl w-full relative h-full">
    <div class="w-full my-4 sm:my-10 xl:my-20 flex justify-center">
      <img src="@/assets/images/svg/logo_liggende.svg" />
    </div>
    <SliderItem class="mb-6 cursor-pointer" routePath="/login?page=1">{{
      t('title')
    }}</SliderItem>
    <SliderItem class="mb-6 cursor-pointer" routePath="/login?page=2">{{
      t('personvern')
    }}</SliderItem>
    <SliderItem
      v-if="!isLoggedIn"
      class="cursor-pointer text-viva-korall"
      routePath="/login?page=3"
      >{{ t('LoggIn') }}</SliderItem
    >
    <SliderItem
      v-if="isLoggedIn"
      class="mb-6 cursor-pointer"
      routePath="/videos/list"
      >{{ t('MineOpptak') }}</SliderItem
    >
    <p
      v-if="isLoggedIn"
      class="cursor-pointer text-viva-korall px-4 md:px-12"
      @click="logout()"
    >
      {{ t('LoggUt') }}
    </p>
    <div class="absolute bottom-0 xs:mb-12 sm:mb-20 p-4">
      <p class="ml-2 text-sm">{{ t('vivaService') }}</p>
      <img
        v-if="$i18n.locale == 'en'"
        alt="locale"
        class="w-64"
        src="@/assets/icons/svg/uio-english.svg"
      />
      <img
        v-else
        alt="uio logo"
        class="w-64"
        src="@/assets/icons/svg/uio.svg"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { useAppStore } from '@/store/useAppStore'
const { actions: appActions, getters: appGetters } = useAppStore()
import { defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import SliderItem from '@/components/base/SliderItem.vue'
export default defineComponent({
  components: {
    SliderItem,
  },
  setup() {
    const messages = {
      nb_NO: {
        title: 'Dette er VIVA',
        personvern: 'Personvern i opptak',
        LoggIn: 'Logg inn',
        MyRecordings: 'Mine opptak',
        LoggUt: 'Logg ut',
        vivaService: 'VIVA er en tjeneste som leveres av',
      },
      en: {
        title: 'This is VIVA',
        personvern: 'Privacy in recordings',
        LoggIn: 'Log in',
        MyRecordings: 'My recordings',
        LoggUt: 'Log out',
        vivaService: 'VIVA is a service delivered by',
      },
    }
    const { t } = useI18n({ messages, useScope: 'global' })

    return {
      t,
      isLoggedIn: appGetters.isLoggedIn,
      logout: appActions.logout,
    }
  },
})
</script>

<style scoped>
.bold {
  font-family: 'VAG Rounded Std Bold';
}
</style>
