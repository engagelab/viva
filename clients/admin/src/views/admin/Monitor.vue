<template>
  <div class="flex flex-col cursor-default relative h-screen">
    <div class="flex flex-col p-4">
      <ul class="flex border-b">
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

    <div class="flex flex-col p-4 flex-grow-0">
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

export default defineComponent({
  name: 'Monitor',
  setup() {
    const selectedTab = ref('recordingLog')
    const selectedSubTab = ref('profile')

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
