<template>
  <div>
    <div>
      <!-- <AnswerInput
        class="m-2 w-32"
        mode="text"
        :border="false"
        :label="'Description'"
        :required="true"
        v-model="selectedShare.description"
      ></AnswerInput> -->
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
  // onMounted,
  // watch,
  PropType,
  // toRefs,
} from 'vue'
import { useVideoStore } from '@/store/useVideoStore'
import SlButton from '@/components/base/SlButton.vue'
import { VideoSharing } from '@/types/main'
// import AnswerInput from '@/components/base/AnswerInput.vue'

const { getters: videoGetters } = useVideoStore()
export default defineComponent({
  components: {
    SlButton,
    // AnswerInput,
  },
  props: {
    selectedShare: {
      type: Object as PropType<VideoSharing>,
      required: true,
    },
  },
  setup() {
    const showUsers = ref(false)
    return {
      users: videoGetters.allUsers,
      sharedUsers: videoGetters.selectedVideo.value?.users.sharedWith,
      showUsers,
    }
  },
})
</script>
