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
  <div class="flex flex-row flex-wrap select-none">
    <!-- Headers -->
    <div
      class="w-1/2 flex justify-center"
      v-for="(header, headerIndex) in headers"
      :key="headerIndex"
    >
      {{ t(header) }}
    </div>
    <div
      class="w-full flex flex-wrap justify-center"
      v-for="(user, userIndex) in usersDrafts"
      :key="userIndex"
    >
      <div class="w-full flex cursor-pointer" @click="toggleContent(userIndex)">
        <span class="w-1/2 text-center">{{ user.name }}</span>
        <span class="w-1/2 text-center">{{ user.videos.length }}</span>
      </div>
      <div :id="'user-content-' + userIndex" class="hidden">
        <div
          class="text-center"
          v-for="(video, videoIndex) in user.videos"
          :key="videoIndex"
        >
          {{ video }}
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted } from 'vue'
import { useAppStore } from '@/store/useAppStore'
import { User } from '@/types/main'

const { getters: appGetters, actions: appActions } = useAppStore()

// i18n
import { useI18n } from 'vue-i18n'
const messages = {
  nb_NO: {
    Datainnsamler: 'Datainnsamler',
    'Antall opptakk': 'Antall opptak',
  },
  en: {
    Datainnsamler: 'Data collector',
    'Antall opptakk': 'Number of recordings',
  },
}

export default defineComponent({
  name: 'MonitorRecordingsInProcess',
  components: {},
  setup() {
    const headers = User.columnDefs()
    const { t } = useI18n({ messages })

    onMounted(() => {
      appActions.getUsersDrafts()
    })

    const toggleContent = (userIndex: number) => {
      const content = document.getElementById('user-content-' + userIndex)
      if (content) {
        if (content.style.display == 'none') content.style.display = 'block'
        else content.style.display = 'none'
      }
    }
    /**
     * Find out how to fetch users
     * Name - user.profile.username
     * Total - user.videos.draftIDs.length
     */

    return { t, headers, usersDrafts: appGetters.usersDrafts, toggleContent }
  },
})
</script>

<style scoped></style>
