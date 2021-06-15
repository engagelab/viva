<template>
  <div class="flex flex-col cursor-default relative h-screen">
    <div class="flex flex-col p-4">
      <ul class="flex border-b">
        <router-link to="/monitor/dataset">
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
            @click="selectTab('users', 'profile')"
          >
            <!-- :class="{ tabSelected: selectedTab === 'users' }" -->
            Dataset
          </li>
        </router-link>
        <router-link to="/monitor/videologs">
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
            @click="selectTab('projects', 'projects')"
          >
            <!-- :class="{ tabSelected: selectedTab === 'projects' }" -->
            VideoLogs
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
import { defineComponent /*, ref, computed*/ } from 'vue'
// import router from '../../router'
// import { USER_ROLE } from '../../constants'
// import { useUserStore } from '../../store/useUserStore'

export default defineComponent({
  name: 'Monitor',
  setup() {
    // const { actions: userActions, getters: userGetters } = useUserStore()

    // const selectedTab = ref('users')
    // const selectedSubTab = ref('profile')

    // const selectTab = (main: string, secondary: string) => {
    //   selectedTab.value = main
    //   selectedSubTab.value = secondary
    // }

    // const restart = () => {
    //   const project = userGetters.selectedUserProject
    //   if (project) router.push(`/login`)
    // }

    /*Computed functions */
    // const hasAdminRole = computed(() =>
    //   userActions.hasMinimumRole(userGetters.myUser.value, USER_ROLE.admin)
    // )
    // const hasMonitorRole = computed(() =>
    //   userActions.hasMinimumRole(userGetters.myUser.value, USER_ROLE.monitor)
    // )

    return {
      // Computed
      // selectedUser: userGetters.selectedUser,
      // hasAdminRole,
      // hasMonitorRole,
      // selectedTab,
      // selectedSubTab,
      // Methods
      // restart,
      // selectTab,
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

<style scoped lang="postcss">
.tabSelected {
  @apply border-l border-t border-r border-b-0 rounded-t text-blue-800;
}
</style>
