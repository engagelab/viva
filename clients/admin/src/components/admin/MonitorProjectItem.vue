<template>
  <div
    class="flex flex-row py-4 rounded"
    :class="[showSave ? 'bg-green-200' : 'bg-blue-200']"
  >
    <template v-if="edit">
      <SelectionBox
        id="select-appname"
        :label="'Squidex App Name'"
        :options="projectNameList"
        v-model="currentProjectName"
        class="m-2"
        @change="setProjectName"
      ></SelectionBox>

      <SelectionBox
        id="select-templatetype"
        :label="'Template Type'"
        :options="projectTypeList"
        class="m-2"
        v-model="currentProjectType"
        @change="setProjectType"
      ></SelectionBox>

      <AnswerInput
        class="m-2"
        mode="text"
        label="Intervention Name"
        :border="false"
        v-model="editableProject.interventionName"
        customSize="6"
        @input="saveActive"
      ></AnswerInput>

      <AnswerInput
        class="m-2"
        mode="text"
        label="TSD Group"
        :border="false"
        v-model="editableProject.tsdGroupName"
        customSize="6"
        @input="saveActive"
      ></AnswerInput>

      <SlButton v-if="showSave" @click="saveProject()"> Save </SlButton>
      <SlButton @click="deleteProject()"> Delete </SlButton>
    </template>
    <template v-else>
      <div class="flex flex-row w-full items-center">
        <input
          class="w-8 ml-6"
          type="radio"
          :checked="selected"
          :id="`input-selectproject-${project.projectName}`"
          @change="selectMe"
        />
        <div class="flex flex-row justify-around w-full">
          <p>
            <strong>{{ project.projectName }}</strong>
          </p>
          <p>
            <strong v-if="project.interventionName">{{
              project.interventionName
            }}</strong>
            <strong v-else><i style="color: grey">unknown</i></strong>
          </p>
          <p>
            <strong v-if="project.tsdGroup">{{ project.tsdGroup }}</strong>
            <strong v-else><i style="color: grey">unknown</i></strong>
          </p>
        </div>
        <slot />
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, ref, Ref, reactive, computed } from 'vue'
import { PROJECT_NAME, PROJECT_TYPE } from '../../constants'
import { Project } from '../../types/main'
import { useProjectStore } from '../../store/useProjectStore'
import SelectionBox from '../base/SelectionBox.vue'
import AnswerInput from '../base/AnswerInput.vue'
import SlButton from '../base/SlButton.vue'

interface ProjectNameListItem {
  itemName: string
  item: PROJECT_NAME
}
interface ProjectTypeListItem {
  itemName: string
  item: PROJECT_TYPE
}

export default defineComponent({
  name: 'MonitorProjectItem',
  components: {
    SelectionBox,
    AnswerInput,
    SlButton,
  },
  props: {
    project: {
      type: Object as PropType<Project>,
    },
    edit: {
      type: Boolean,
    },
    selected: {
      type: Boolean,
    },
  },
  setup(props, context) {
    const { actions: projectActions } = useProjectStore()
    const projectNameList = computed((): ProjectNameListItem[] => {
      return Object.values(PROJECT_NAME).map((i) => ({
        item: i,
        itemName: i,
      }))
    })
    const projectTypeList = computed((): ProjectTypeListItem[] => {
      return Object.values(PROJECT_TYPE).map((i) => ({
        item: i,
        itemName: i,
      }))
    })
    const showSave = ref(false)

    const p = new Project(props.project as Project)
    const editableProject = reactive<Project>(p)

    const currentProjectName: Ref<ProjectNameListItem> = ref({
      item: p.projectName,
      itemName: p.projectName,
    })
    const currentProjectType: Ref<ProjectTypeListItem> = ref({
      item: p.projectType,
      itemName: p.projectType,
    })

    const saveProject = async () => {
      await projectActions.updateProject(editableProject)
      showSave.value = false
    }

    const setProjectName = (value: ProjectNameListItem) => {
      editableProject.projectName = PROJECT_NAME[value.item as PROJECT_NAME]
      showSave.value = true
    }

    const setProjectType = (value: ProjectTypeListItem) => {
      editableProject.projectType = PROJECT_TYPE[value.item as PROJECT_TYPE]
      showSave.value = true
    }

    const deleteProject = async () => {
      await projectActions.deleteProject(editableProject)
      showSave.value = false
    }

    const saveActive = () => {
      showSave.value = true
    }

    const selectMe = () => {
      context.emit('selected')
    }

    return {
      // Computed
      projectNameList,
      projectTypeList,
      showSave: computed(() => showSave.value),
      editableProject,
      currentProjectName,
      currentProjectType,

      // Methods
      setProjectType,
      setProjectName,
      saveProject,
      saveActive,
      selectMe,
      deleteProject,
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
