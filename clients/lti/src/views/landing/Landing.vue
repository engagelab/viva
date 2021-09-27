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
    class="relative flex md:flex-row flex-col h-full justify-center bg-blue-button"
  >
    Fetch videos from s3 bucket
    <p class="absolute bottom-0 right-0 text-xs m-2">Welcome</p>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  computed,
  onMounted,
  ref,
  Ref,
  onBeforeUnmount,
} from 'vue'

import moment from 'moment'
import { useAppStore } from '@/store/useAppStore'
import { LocalUser } from '@/types/main'
import { useVideoStore } from '@/store/useVideoStore'
const jwtExpiryConstant = process.env.VUE_APP_JWT_EXPIRY || '0'
const jwtExpiry = Number.parseInt(jwtExpiryConstant)

interface LocalUserWithExpiry extends LocalUser {
  expiresIn: Ref<string>
  valid: Ref<boolean>
}

export default defineComponent({
  name: 'Login',
  setup() {
    const { getters: appGetters } = useAppStore()
    const { actions: videoActions } = useVideoStore()
    const mode = ref('login')
    const pinCode = ref('')
    const showTestLogin = ref(false)
    const selectedUser = ref()
    const localUsers = Object.values(appGetters.persistedLocalUsers.value)
    const localUsersWithExpiry: LocalUserWithExpiry[] = localUsers.map(
      (lu) => ({
        ...lu,
        expiresIn: ref(''),
        valid: ref(false),
      })
    )
    onMounted(() => {
      // Fetch video and video Metadata
      videoActions.getVideoMetadata().catch((err) => {
        console.log(err)
      })
    })

    function momentFormat(date: Date) {
      return moment(date).format('ddd, hA')
    }

    showTestLogin.value = true

    function selectUser(u: LocalUser) {
      localUsers.forEach((lu) => (lu.selected = false))
      u.selected = true
      selectedUser.value = u
      mode.value = 'pp'
    }

    const calculateCountdown = () => {
      const dateNow = new Date()
      localUsersWithExpiry.forEach((lu: LocalUserWithExpiry) => {
        const countdown =
          jwtExpiry - moment(dateNow).diff(lu.lastLogin, 'seconds')
        lu.expiresIn.value = moment.duration(countdown, 'seconds').humanize()
        lu.valid.value = countdown > 0
      })
    }
    calculateCountdown()
    const countDownInterval = setInterval(() => {
      calculateCountdown()
    }, 10000)
    onBeforeUnmount(() => {
      clearInterval(countDownInterval)
    })

    const filteredLocalUsersWithExpiry = computed(() =>
      localUsersWithExpiry.filter((u) => u.valid.value)
    )

    return {
      status: appGetters.status,
      filteredLocalUsersWithExpiry,
      momentFormat,
      showTestLogin,

      selectUser,
      pinCode,
      mode,
      selectedUser,
    }
  },
})
</script>

<i18n>
{
  "no": {
  },
  "en": {
  }
}
</i18n>

<style scoped></style>
