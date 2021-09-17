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
  <div class="flex flex-col cursor-default relative h-full">
    <div class="flex flex-col p-4">
      <ul class="flex">
        <router-link to="/monitor/recordingLog">
          <li
            class="
              -mb-px
              mr-1
              bg-white
              inline-block
              py-2
              px-4
              text-blue-500
              hover:text-blue-800
              font-semibold
            "
            :class="{ tabSelected: selectedTab === 'recordingLog' }"
            @click="selectTab('recordingLog', 'recordingLog')"
          >
            {{ 'Recording log' }}
          </li>
        </router-link>
        <router-link to="/monitor/yourDatasets">
          <li
            class="
              -mb-px
              mr-1
              bg-white
              inline-block
              py-2
              px-4
              text-blue-500
              hover:text-blue-800
              font-semibold
            "
            :class="{ tabSelected: selectedTab === 'yourDatasets' }"
            @click="selectTab('yourDatasets', 'yourDatasets')"
          >
            {{ 'Your Datasets' }}
          </li>
        </router-link>
        <router-link to="/monitor/recordingsInProcess">
          <li
            class="
              -mb-px
              mr-1
              bg-white
              inline-block
              py-2
              px-4
              text-blue-500
              hover:text-blue-800
              font-semibold
            "
            :class="{ tabSelected: selectedTab === 'recordingsInProcess' }"
            @click="selectTab('recordingsInProcess', 'recordingsInProcess')"
          >
            {{ 'Recordings in process' }}
          </li>
        </router-link>
      </ul>
    </div>

    <div class="flex flex-col p-4 flex-grow">
      <router-view></router-view>
    </div>
    <div class="absolute top-0 right-0 m-4">
      <a
        class="
          bg-white
          inline-block
          py-2
          px-4
          text-green-600
          hover:text-blue-800
          font-semibold
          cursor-pointer
        "
        id="button-return"
        @click="restart()"
        >Return</a
      >
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import router from '../../router'
import { useI18n } from 'vue-i18n'
const messages = {
  nb_NO: {
    dataset: 'Registrering',
  },
  en: {
    dataset: 'Registrering',
  },
}
export default defineComponent({
  name: 'Monitor',
  setup() {
    const selectedTab = ref('recordingLog')
    const selectedSubTab = ref('profile')
    const { t } = useI18n({ messages })
    const selectTab = (main: string, secondary: string) => {
      selectedTab.value = main
      selectedSubTab.value = secondary
    }

    const restart = () => {
      router.push(`/`)
    }

    return {
      selectedTab,
      selectedSubTab,
      t,
      // Methods
      restart,
      selectTab,
    }
  },
})
</script>

<style scoped lang="postcss">
.tabSelected {
  @apply border-l border-t border-r border-b-0 rounded-t text-blue-800;
}

@import '../../../node_modules/ag-grid-community/dist/styles/ag-grid.css';
@import '../../../node_modules/ag-grid-community/dist/styles/ag-theme-alpine.css';
</style>
