<template>
  <div class="my-2">
    <div>
      <AnswerInput
        class="m-2 w-32"
        mode="text"
        :border="false"
        :label="'Description'"
        :required="true"
        v-model="description"
      ></AnswerInput>
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
          Add share
        </SlButton>
        <div v-if="showUsers">
          <div v-for="(user, index) in users" :key="index">
            <input type="checkbox" :value="user.name" v-model="sharedUsers" />
            <label for="checkbox">{{ user.name }}</label>
          </div>
        </div>
        <SlButton
          v-if="showUsers"
          class="bg-blue-400 self-center rounded-lg"
          id="button-accept"
          @click="showUsers = false"
        >
          save share
        </SlButton>
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
    return {
      users: videoGetters.allUsers,
      sharedUsers,
      description,
      showUsers,
      
    }
  },
})
</script>
