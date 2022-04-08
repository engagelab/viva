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
    class="flex flex-col mx-auto relative h-screen bg-viva-beige"
    id="app"
    @click="activeNow()"
  >
    <router-view />
    <Snackbar />
    <Dialog />
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted } from 'vue'
import { idleTimeout } from '@/constants'
import { useAppStore } from '@/store/useAppStore'
import { useVideoStore } from '@/store/useVideoStore'
const { actions: appActions, getters: appGetters } = useAppStore()
const { getters: videoGetters } = useVideoStore()

import Snackbar from './components/Snackbar.vue'
import Dialog from './components/Dialog.vue'

export default defineComponent({
  components: {
    Snackbar,
    Dialog,
  },
  name: 'App',
  setup() {
    // Listen for changes to app foreground / background
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        const idleTime = Math.floor(
          (new Date().getTime() - appGetters.lastActive.value) / 1000
        )
        const isLoggedIn = appGetters.isLoggedIn.value
        const recordingNow = videoGetters.recordingNow.value
        appActions.activeNow()

        // Log out if the user has been idle for too long
        if (isLoggedIn && idleTime > idleTimeout && !recordingNow) {
          appActions.logout()
        }
      } else if (document.visibilityState === 'hidden') {
        appActions.activeNow()
      }
    })

    onMounted(() => {
      appActions.detectDevice()
      appActions.detectAppVersion()
    })

    return {
      activeNow: appActions.activeNow,
    }
  },
})
</script>

<style></style>
