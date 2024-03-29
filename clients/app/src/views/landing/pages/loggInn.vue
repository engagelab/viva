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
  <div>
    <div class="p-4">
      <p class="text-3xl text-viva-korall mb-3">
        {{ isLoggedIn ? t('loggedIn') : t('loggedOut') }}
      </p>
      <div class="flex flex-row justify-right">
        <Button
          v-if="!isLoggedIn && browserOk"
          class="m-4 focus:outline-none"
          @click="login('uio')"
          >{{ t('loggedOut') }}</Button
        >
        <!--Button
          v-if="!isLoggedIn && browserOk && !appIsOld"
          logo="canvas"
          class="m-4 focus:outline-none"
          @click="login('canvas', 'canvas')"
        /-->
        <Button v-if="isLoggedIn" class="m-4" @vclick="listView()">{{
          t('MineOpptak')
        }}</Button>
        <Button
          v-if="isLoggedIn"
          class="text-viva-korall m-4"
          @vclick="logout()"
          >{{ t('LoggUt') }}</Button
        >
      </div>
      <p class="m-2 text-red-600 font-bold" v-if="!browserOk">
        {{ t('browserNotOk') }}
      </p>
      <p class="m-2 text-red-600 font-bold" v-if="appIsOld">
        {{ t('appIsOld') }}
      </p>
      <p class="text-viva-lilla text-sm mb-1">{{ t('GoogleSuite') }}</p>
      <p class="text-viva-lilla text-sm">{{ t('UseOfGoogle') }}</p>
      <p class="text-xs mt-2">v{{ appVersion }}</p>
      <!--div class="flex flex-row justify-end">
        <Button class="m-2" customWidth="110px" @vclick="giSamtykke()">
          <p class="text-xs">{{ t('GiSamtykke') }}</p>
        </Button>
      </div-->
    </div>
    <div class="flex flex-row w-full justify-between">
      <div class="pl-16" @click="$emit('slider-back')">
        <SVGSymbol
          class="fill-current text-viva-korall"
          applyClasses="w-4 md:w-8"
          rotation="180"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue'
import router from '@/router'
import { baseUrl, appVersion } from '@/constants'
import { useAppStore } from '@/store/useAppStore'
const { actions: appActions, getters: appGetters } = useAppStore()
import { useI18n } from 'vue-i18n'

import SVGSymbol from '@/components/base/SVGSymbol.vue'
import Button from '@/components/base/Button.vue'

export default defineComponent({
  components: {
    SVGSymbol,
    Button,
  },
  setup() {
    const messages = {
      nb_NO: {
        loggedIn: 'Du er logget inn',
        loggedOut: 'Logg inn',
        MineOpptak: 'Mine opptak',
        LoggUt: 'Logg ut',
        GoogleSuite:
          'Du kan lagre opptak som faller inn i informasjonsklasse begrenset (gule data) på Google Drive med UiO innlogging. Det er behandlingsansvarlig for det datasettet du velger, som bestemmer hvor opptak kan lagres.',
        UseOfGoogle:
          'For å kunne ta i bruk UiO Google Drive, må du samtykke til vilkårene for bruk av G Suite for Education (med UiO innlogging). Det kan være du allerede har gitt dette samtykket, og da trenger du selvsagt ikke gi det på nytt. I tillegg må du gi VIVA lov til å lagre opptak på din UiO Google Drive konto på dine vegne. Dette får du spørsmål om første gang du skal lagre et opptak.',
        AutoriserVIVA: 'Autoriser VIVA for G Suite',
        GiSamtykke: 'Gi samtykke til GSuite',
        browserNotOk: 'VIVA krever Google Chrome nettleser',
        appIsOld:
          'Viva appen er en eldre versjon, du må laste ned den ny versjonen fra Appstore',
      },
      en: {
        loggedIn: 'You are logged in',
        loggedOut: 'Log in',
        MineOpptak: 'My recordings',
        LoggUt: 'Log out',
        GoogleSuite:
          'You may store recordings that are classified as restricted (yellow) using G Suite for Education with a UiO log in. It is the data controller for the data set you choose who descides where recordings may be stored.',
        UseOfGoogle:
          'You have to consent to the terms of use for G Suite for Education (with UiO log in) before you may use this service. You may already have consented. In addition you have to permit VIVA to store recodings in your G Suite Drive on your behalf. You will be asked about this upon your first storage of a recording.',
        AutoriserVIVA: 'Authorize VIVA for GSuite',
        GiSamtykke: 'Give consent to GSuite',
        browserNotOk: 'VIVA must be used with Google Chrome browser',
        appIsOld:
          'Your VIVA app is an older version, please download the latest version from the app store',
      },
    }
    let count = 0
    const { t } = useI18n({ messages })
    const useCordova = appGetters.useCordova.value
    const browserOk = computed(() => {
      const AndroidButNotChromeBrowser =
        /^(?=.*?Android)((?!Gecko\) Chrome).)*$/gi
      const browserNotOk = AndroidButNotChromeBrowser.test(navigator.userAgent)
      return !browserNotOk || useCordova
    })

    function login(organization: string): void {
      let feideLoginUrl = `${baseUrl}/auth/dataporten/login?organization=${organization}`
      if (useCordova) {
        count++
        console.log(`Login count: ${count}`)
        feideLoginUrl += '&client=mobileApp'
        window.OAuth(
          feideLoginUrl,
          'oauth:dataporten',
          'allowInlineMediaPlayback=yes,toolbar=no'
        )
      } else {
        feideLoginUrl += '&client=webApp'
        window.location.href = feideLoginUrl
      }
    }
    function listView() {
      router.push('/videos/list')
    }
    function giSamtykke() {
      // Calling OAuth without 'oauth:' name will open the system browser
      if (useCordova) {
        window.OAuth(
          'https://www.uio.no/tjenester/it/lagring-samarbeid/gsuite/',
          '_system',
          'location=yes'
        )
      } else {
        const a = document.createElement('a')
        a.setAttribute('target', '_blank')
        a.setAttribute(
          'href',
          'https://www.uio.no/tjenester/it/lagring-samarbeid/gsuite/'
        )
        a.dispatchEvent(
          new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true,
          })
        )
      }
    }
    return {
      t,
      appVersion,
      browserOk,
      isLoggedIn: appGetters.isLoggedIn,
      appIsOld: appGetters.appIsOld,
      logout: appActions.logout,

      login,
      listView,
      giSamtykke,
    }
  },
})
</script>

<style scoped>
.bold {
  font-family: 'VAG Rounded Std Bold';
}
</style>
