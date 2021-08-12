<template>
  <div class="my-2">
    <div class="grid grid-cols-3">
      <AnswerInput
        class="m-2 w-32"
        mode="text"
        :border="false"
        :label="'Description'"
        :required="true"
        v-model="description"
      ></AnswerInput>
      <AnswerInput
        class="m-2 w-32"
        mode="binary"
        :border="false"
        :label="'Access'"
        :required="true"
        v-model="access"
      ></AnswerInput>
      <div class="flex flex-row space-x-2">
        <div>Trim</div>
        <!-- <SlButton
          v-if="!showUsers"
          class="bg-blue-400 self-center rounded-lg"
          id="button-accept"
          @click="addTrim"
        >
          +Add trim
        </SlButton> -->

        <div class="py-3 w-3/6 grid grid-cols-2">
          <AnswerInput
            class="mr-2 w-16 py-0"
            mode="text"
            :border="false"
            :label="'Start'"
            :required="true"
            v-model="trim[0]"
          ></AnswerInput>

          <AnswerInput
            class="ml-2 w-16"
            mode="text"
            :border="false"
            :label="'end'"
            :required="true"
            v-model="trim[1]"
          ></AnswerInput>
        </div>
      </div>
    </div>
    <div class="grid grid-cols-2">
      <div>
        <p>Shared owners</p>
        <div v-for="(user, index) in selectedShare.users" :key="index">
          {{ user }}
        </div>
      </div>
      <div>
        <SlButton
          v-if="!showUsers"
          class="bg-blue-400 self-center rounded-lg"
          id="button-accept"
          @click="showUsers = true"
        >
          show users
        </SlButton>
        <SlButton
          v-if="showUsers"
          class="bg-blue-400 self-center rounded-lg"
          id="button-accept"
          @click="showUsers = false"
        >
          *
        </SlButton>
        <div v-if="showUsers">
          <div v-for="(user, index) in users" :key="index">
            <input type="checkbox" :value="user.name" v-model="sharedUsers" />
            <label for="checkbox">{{ user.name }}</label>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import {
  defineComponent,
  ref,
  // computed,
  // props,
  // onMounted,
  watch,
  PropType,
  // toRefs,
} from 'vue'
import { useVideoStore } from '@/store/useVideoStore'
import SlButton from '@/components/base/SlButton.vue'
import { VideoSharing } from '@/types/main'
import AnswerInput from '@/components/base/AnswerInput.vue'
const { actions: videoActions, getters: videoGetters } = useVideoStore()

export default defineComponent({
  components: {
    SlButton,
    AnswerInput,
  },
  props: {
    selectedShare: {
      type: Object as PropType<VideoSharing>,
      required: true,
    },
  },
  setup(props) {
    const showUsers = ref(false)
    const description = ref(props.selectedShare.description)
    const sharedUsers = ref(props.selectedShare.users)
    const access = ref(props.selectedShare.access)
    // const start = ref(props.selectedShare.edl.trim[0])
    // const end = ref(props.selectedShare.edl.trim[1])
    const trim = ref(props.selectedShare.edl.trim)
    const addDescription = (value: string) => {
      if (value)
        videoActions.addGroupShareInfo(
          props.selectedShare,
          value,
          'description'
        )
    }
    const addUser = (value: string[]) => {
      if (value)
        videoActions.addGroupShareInfo(props.selectedShare, value, 'user')
    }
    const addAccess = (value: boolean) => {
      if (value)
        videoActions.addGroupShareInfo(props.selectedShare, value, 'access')
    }
    const addTrim = (value: number[]) => {
      console.log(value)
      videoActions.addGroupShareInfo(props.selectedShare, value, 'trim')
    }

    watch(
      () => description.value,
      (newValue: string) => {
        if (newValue) addDescription(newValue)
      }
    )
    watch(
      () => sharedUsers.value,
      (newValue: string[]) => {
        if (newValue) addUser(newValue)
      }
    )
    watch(
      () => access.value,
      (newValue: boolean) => {
        if (newValue) addAccess(newValue)
      }
    )

    watch(
      () => trim.value,
      (newValue: number[]) => {
        if (newValue) addTrim(newValue)
      }
    )
    return {
      users: videoGetters.allUsers,
      access,
      sharedUsers,
      description,
      showUsers,
      trim,
      //Methods
      addTrim,
    }
  },
})
</script>
