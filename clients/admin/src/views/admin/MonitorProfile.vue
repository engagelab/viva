<template>
  <div class="flex flex-row">
    <div class="pt-6 px-2 border-r-2 border-grey">
      <div v-if="theUser" class="bg-blue-200 rounded p-1">
        <p class="font-serious">
          Selected user:
          <strong class="font-playful">{{ theUser.username }}</strong>
        </p>
        <p class="font-serious">
          Projects:
          <strong class="font-playful">{{ theUser.projects.length }}</strong>
        </p>
        <p class="font-serious">
          Participants:
          <strong class="font-playful">{{
            theUser.participants.length
          }}</strong>
        </p>
      </div>
      <div class="flex flex-col pt-8 text-left px-4">
        <p class="cursor-pointer font-serious" @click="selectMyUser()">
          My user
        </p>

        <hr class="py-1" />
        <p
          v-for="(u, i) in allUsers"
          :key="i"
          class="cursor-pointer"
          :id="`p-selectuser-${u.username}`"
          @click="selectAUser(u)"
        >
          <span v-if="theUser && u._id === theUser._id">✔︎&nbsp;</span
          ><span v-else></span>
          {{ u.username }}
        </p>
      </div>
    </div>
    <div class="flex-col w-full">
      <div
        class="
          flex flex-row flex-grow
          py-4
          text-left
          px-2
          overflow-y-auto
          justify-between
        "
      >
        <div class="mb-2 font-serious">
          <h1 class="mb-2 font-serious">User Details</h1>
          <p>
            Username:
            <strong class="font-playful">{{ theUser.username }}</strong>
          </p>
          <p>
            Email: <strong class="font-playful">{{ theUser.email }}</strong>
          </p>
          <p>
            Location:
            <strong class="font-playful">{{ theUser.location.name }}</strong>
          </p>
          <p>
            Last login: <strong class="font-playful">{{ lastLogin }}</strong>
          </p>
        </div>
        <div v-if="hasAdminRole" class="flex flex-col mb-2 justify-end">
          <SelectionBox
            id="select-role"
            :label="'Role..'"
            :options="roleOptionList"
            v-model="currentUserRole"
            :resetOnChoose="false"
            @change="updateRole"
          ></SelectionBox>
          <AnswerInput
            class="m-2"
            mode="binary"
            :border="false"
            v-model="delaysDisabled"
            label="Disable delays (not stored!)"
            @change="disableDelays"
          ></AnswerInput>
        </div>
      </div>
      <div class="flex flex-col flex-grow py-4 text-left px-2 overflow-y-auto">
        <hr />

        <!-- Project Selection -->
        <div class="flex flex-col">
          <h1 class="font-serious mb-2">User's Projects</h1>
          <div class="flex flex-row w-full items-center">
            <p class="w-8 ml-6 font-serious">Active</p>
            <div class="flex flex-row w-full justify-around font-serious">
              <p>Name</p>
              <p>Intervention</p>
              <p>TSD Group</p>
            </div>
            <p class="mr-6">Controls</p>
          </div>
          <div v-for="(p, i) in userProjects" :key="i" class="flex flex-row">
            <MonitorProjectItem
              :edit="false"
              :project="p"
              :selected="p.selected"
              class="my-2 w-full"
              @selected="selectProject(p)"
            >
              <SlButton class="my-2 mr-2" @click="removeProject(i)">
                Remove
              </SlButton>
            </MonitorProjectItem>
          </div>
          <div v-if="hasAdminRole" class="flex flex-row mb-2 justify-end">
            <SelectionBox
              id="select-project"
              :label="'Add a Project..'"
              :options="projectOptionList"
              :resetOnChoose="true"
              @change="addProject"
            ></SelectionBox>
          </div>
        </div>
        <hr />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue'
import { USER_ROLE } from '@/constants'
import { dateToFormattedString } from '@/utilities'
import { User, Project, Participant } from '@/types/main'
import { useAppStore } from '@/store/useAppStore'
import { useUserStore } from '@/store/useUserStore'
import { useProjectStore } from '@/store/useProjectStore'
import MonitorProjectItem from '@/components/admin/MonitorProjectItem.vue'
import SelectionBox from '@/components/base/SelectionBox.vue'
import AnswerInput from '@/components/base/AnswerInput.vue'
import SlButton from '@/components/base/SlButton.vue'
import { useI18n } from 'vue-i18n'
const messages = {
  nb_NO: {
    dataset: 'Registrering',
  },
  en: {
    dataset: 'Registrering',
  },
}
interface RoleOptionListItem {
  itemName: string
  item: USER_ROLE
}
interface ProjectOptionListItem {
  itemName: string
  item: Project
}
interface ParticipantOptionListItem {
  itemName: string
  item: Participant
}

export default defineComponent({
  name: 'MonitorProfile',
  components: {
    MonitorProjectItem,
    SelectionBox,
    SlButton,
    AnswerInput,
  },
  setup() {
    const { t } = useI18n({ messages })
    const { getters: appGetters, actions: appActions } = useAppStore()
    const { getters: userGetters, actions: userActions } = useUserStore()
    const { getters: projectGetters, actions: projectActions } =
      useProjectStore()
    const u = new User(userGetters.selectedUser.value)
    const theUser = ref(u)
    const currentUserRole = ref({
      item: u.role,
      itemName: u.role,
    })
    const showSave = ref(false)
    const delaysDisabled = ref(false)
    delaysDisabled.value = appGetters.disableDelays.value

    const saveUser = () => {
      return userActions
        .updateUser(theUser.value)
        .then(() => (showSave.value = false))
    }

    const hasAdminRole = computed(() =>
      userActions.hasMinimumRole(userGetters.myUser.value, USER_ROLE.admin)
    )

    const selectAUser = (u: User) => {
      userActions.selectUser(u)
      theUser.value = new User(userGetters.selectedUser.value)
      currentUserRole.value.item = theUser.value.role
      currentUserRole.value.itemName = theUser.value.role
      setProjectToCurrentUserProject()
    }
    const selectMyUser = () => {
      selectAUser(userGetters.myUser.value)
    }
    const lastLogin = computed(() => {
      if (userGetters.selectedUser.value.lastLogin)
        return dateToFormattedString(userGetters.selectedUser.value.lastLogin)
      else return 'Unknown'
    })
    // -------------- Role -----------------
    const roleOptionList = computed((): RoleOptionListItem[] => {
      return Object.values(USER_ROLE).map((r) => ({ item: r, itemName: r }))
    })

    const updateRole = (role: RoleOptionListItem) => {
      theUser.value.role = role.item
      saveUser()
    }
    // -------------- Projects --------------
    const setProjectToCurrentUserProject = () => {
      const currentProject = projectActions.projectById(
        theUser.value.currentProjectId
      )
      if (currentProject) projectActions.selectProject(currentProject)
    }

    projectActions.getProjects().then(() => {
      setProjectToCurrentUserProject()
    })

    const projectOptionList = computed((): ProjectOptionListItem[] => {
      return projectGetters.projects.value
        .filter((p: Project) => {
          return !theUser.value.projects.some((up: Project) => p._id === up._id)
        })
        .map((p) => ({ item: p, itemName: p.projectName }))
    })

    const addProject = (value: ProjectOptionListItem) => {
      if (value.item) {
        theUser.value.projects.push(value.item)
        saveUser()
      }
    }

    const selectProject = (p: Project) => {
      theUser.value.currentProjectId = p._id
      projectActions.selectProject(p)
      saveUser().then(() => projectActions.overrideCMS())
    }

    const removeProject = async (index: number) => {
      theUser.value.projects.splice(index, 1)
      saveUser()
    }

    const userProjects = computed(() => {
      const ps = projectGetters.projects.value.filter((p) =>
        theUser.value.projects.some((tp) => tp._id === p._id)
      )
      ps.forEach((p) => {
        if (p._id === theUser.value.currentProjectId) p.selected = true
        else p.selected = false
      })
      return ps
    })

    // -------------- Participants --------------
    const addParticipantToUser = (value: ParticipantOptionListItem) => {
      theUser.value.participants.push(value.item)
      saveUser()
    }

    const removeParticipant = async (index: number) => {
      theUser.value.participants.splice(index, 1)
      saveUser()
    }

    const selectedProject = projectGetters.selectedProject

    const disableDelays = (value: boolean) => {
      appActions.setDisableDelays(value)
    }

    // Request data to populate the Monitor views
    userActions
      .getAllUsers()
      .then(() => userActions.selectUser(userGetters.myUser.value))

    return {
      t,
      // Computed
      status: appGetters.status,
      allUsers: userGetters.allUsers,
      theUser,
      currentUserRole,
      hasAdminRole,
      showSave,
      projectOptionList,
      roleOptionList,
      userProjects,
      updateRole,
      lastLogin,
      selectedProject,

      // Methods
      addProject,
      saveUser,
      selectProject,
      selectAUser,
      selectMyUser,
      removeProject,
      addParticipantToUser,
      removeParticipant,
      disableDelays,
      delaysDisabled,
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
