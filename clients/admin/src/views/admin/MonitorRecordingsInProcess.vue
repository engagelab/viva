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
      v-for="(user, userIndex) in users"
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
import { computed, defineComponent, onMounted } from 'vue'
import { useAppStore } from '@/store/useAppStore'
import { User } from '@/types/main'

const { getters: appGetters, actions: appActions } = useAppStore()

// i18n
import { useI18n } from 'vue-i18n'
const messages = {
  nb_NO: {
    Datainnsamler: 'Datainnsamler',
    'Antall opptakk': 'Antall opptakk',
  },
  en: {
    Datainnsamler: 'Name',
    'Antall opptakk': 'Total',
  },
}

export default defineComponent({
  name: 'MonitorRecordingsInProcess',
  components: {},
  setup() {
    const headers = User.columnDefs()
    const { t } = useI18n({ messages })

    const users = computed(() => appGetters.users.value)

    onMounted(() => {
      appActions.getUsers()
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

    return { t, headers, users, toggleContent }
  },
})
</script>

<style scoped></style>
