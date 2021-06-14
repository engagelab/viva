<template>
  <div class="flex flex-col p-4 justify-center items-center h-screen">
    <p v-if="status.loading">Loading...</p>
    <p v-if="user.projects.length == 0">No interventions found</p>
    <SlButton
      v-if="hasMonitorRole"
      class="m-4 focus:outline-none"
      @click="monitor()"
      >Monitor</SlButton
    >
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue'
import router from '../../router'
import { USER_ROLE } from '../../constants'
import { LocalUser } from '../../types/main'
import { useAppStore } from '../../store/useAppStore'
import { useUserStore } from '../../store/useUserStore'
import { useProjectStore } from '../../store/useProjectStore'
import SlButton from '@/components/base/SlButton.vue'

// This component completes setup of the app after login
export default defineComponent({
  name: 'AfterLogin',
  components: {
    SlButton,
  },
  setup() {
    const { getters: appGetters } = useAppStore()
    const { actions: projectActions } = useProjectStore()
    const { getters: userGetters, actions: userActions } = useUserStore()
    const currentLocalUser: LocalUser | undefined =
      appGetters.currentLocalUser.value

    // This should re-calculate when the user is loaded
    const hasMonitorRole = computed(() =>
      userActions.hasMinimumRole(userGetters.myUser.value, USER_ROLE.monitor)
    )

    // We have just fulfilled Sync sequence Stage A - Login. Moving on to the next sync steps..
    // NOTE: Refer to docs/syncing.md

    // Sync sequence Stage B. Load Data from server and/or disk
    const getData = (): Promise<void> => {
      let userPromise: Promise<void>
      if (currentLocalUser) {
        userActions.setCordovaPath(currentLocalUser._id)
        userPromise = userActions.loadUser() // Load user from local disk
      } else {
        // Load user from server, select it (including user.participants) then save it locally
        userPromise = userActions.getMyUser().then(() => {
          const user = userGetters.myUser.value
          projectActions.clearProjects()
          user.projects.forEach((p) => projectActions.addProject(p))
          return userActions.saveUser()
        })
      }
      return userPromise.then(() => {
        // Get and Set the user's current Project from User store to where it's needed in other areas
        const project = userGetters.selectedUserProject.value
        if (project) {
          projectActions.selectProject(project)
        }
      })
    }

    getData()
      .then(() => {
        router.push('/participants')
      })
      .catch(() => router.push('/'))

    return {
      // Computed
      status: appGetters.status,
      user: userGetters.selectedUser,
      hasMonitorRole,

      // Methods
      monitor: () => router.push('/monitor'),
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
