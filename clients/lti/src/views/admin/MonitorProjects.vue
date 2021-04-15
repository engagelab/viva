<template>
  <div>
    <div class="flex flex-col flex-grow text-left">
      <div>
        <h1 class="font-bold">All Available Projects</h1>
        <p>
          Connect
          <a
            class="text-blue-500"
            href="https://cms.engagelab.uiocloud.no"
            target="none"
            >Squidex</a
          >
          projects to interventions here
        </p>
        <div v-for="(p, i) in projects" :key="i">
          <MonitorProjectItem
            :edit="true"
            :project="p"
            class="my-2"
          ></MonitorProjectItem>
        </div>
        <SlButton class="my-2" @click="addProject()">Add</SlButton>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { useAppStore } from '../../store/useAppStore'
import { useProjectStore } from '../../store/useProjectStore'
import MonitorProjectItem from '@/components/admin/MonitorProjectItem.vue'
import SlButton from '@/components/base/SlButton.vue'

export default defineComponent({
  name: 'MonitorProjects',
  components: {
    MonitorProjectItem,
    SlButton,
  },
  setup() {
    const { getters: appGetters } = useAppStore()
    const {
      getters: projectGetters,
      actions: projectActions,
    } = useProjectStore()

    const addProject = () => {
      projectActions.createProject()
    }

    projectActions.getProjects()

    return {
      // Computed
      status: appGetters.status,
      projects: projectGetters.projects,

      // Methods
      addProject,
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
