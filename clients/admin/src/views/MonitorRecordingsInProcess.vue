<template>
  <div class="flex flex-row flex-wrap">
    <!-- Headers -->
    <div
      class="w-1/2 flex justify-center"
      v-for="(header, headerIndex) in headers"
      :key="headerIndex"
    >
      {{ t(header) }}
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'
import { User } from '@/types/main'

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

    const users = computed(() => [])
    /**
     * Find out how to fetch users
     * Name - user.profile.username
     * Total - user.videos.draftIDs.length
     */

    return { t, headers, users }
  },
})
</script>

<style scoped></style>
