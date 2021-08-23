<template>
  <div class="my-2 flex flex-row">
    <div class="flex flex-col">
      <Player @currenttime="(t) => (videoCurrentTime = t)" />
      <div class="flex flex-row">
        <AnswerInput
          class="m-2"
          mode="text"
          :border="false"
          :label="'Description'"
          :required="true"
          v-model="localShare.description"
          @change="unsavedData = true"
        ></AnswerInput>
        <AnswerInput
          class="m-2 w-32"
          mode="binary"
          :border="false"
          :label="'Access'"
          :required="true"
          v-model="localShare.access"
          @change="unsavedData = true"
        ></AnswerInput>
      </div>
      <Trim
        :edl="localShare.edl"
        :videoCurrentTime="videoCurrentTime"
        :videoDuration="videoDuration"
        @updated="(edl) => updateEDL(edl)"
      />
      <div class="flex flex-grow flex-col justify-end">
        <Button class="mx-2" v-if="unsavedData" @vclick="updateShare()"
          >Save</Button
        >
        <Button class="text-red-600 h-10 my-4 mx-2" @vclick="deleteShare()"
          >Delete</Button
        >
      </div>
    </div>
    <div class="flex flex-row">
      <div class="flex flex-col m-2">
        <label
          class="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
        >
          shared with
        </label>
        <div>
          <div v-for="(nar, index) in NARList" :key="index">
            <input
              class="mr-1 mb-1"
              type="checkbox"
              :id="`share-user-${index}`"
              :value="nar.item.ltiUserID"
              v-model="localShare.users"
              @change="unsavedData = true"
            />
            <label class="mr-2" :for="`share-user-${index}`">{{
              nar.itemName
            }}</label>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import { defineComponent, ref, Ref, watch } from 'vue'
import { ListItem } from '@/types/main'
import { useAppStore } from '@/store/useAppStore'
import { useVideoStore } from '@/store/useVideoStore'
import { EditDecriptionList, NameAndRole, VideoSharing } from '@/types/main'
import AnswerInput from '@/components/base/AnswerInput.vue'
import Button from '@/components/base/Button.vue'
import Trim from '@/components/Trim.vue'
const { getters: appGetters } = useAppStore()
const { getters: videoGetters, actions: videoActions } = useVideoStore()

interface NARListItem {
  itemName: string
  item: NameAndRole
}

export default defineComponent({
  components: {
    AnswerInput,
    Trim,
    Button,
  },
  setup() {
    const selectedItem = videoGetters.selectedItem
    const showUsers = ref(false)
    const unsavedData = ref(false)
    const videoCurrentTime = ref(0)
    let videoDuration = 0
    let videoID = ''
    const myLTIID = appGetters.user.value.profile.ltiUserId
    let NARList: NARListItem[] = appGetters.canvasData.value.namesAndRoles.map(
      (u) => ({ itemName: u.name, item: u })
    )
    const localShare: Ref<VideoSharing> = ref({
      _id: '',
      creator: myLTIID,
      users: [],
      access: false,
      title: '',
      description: '',
      edl: { trim: [0, 0], blur: [] },
      comments: [],
    })

    const resetData = (li: ListItem) => {
      const s = li.share
      if (s) {
        localShare.value = {
          _id: s._id || '',
          creator: s.creator,
          users: s.users,
          access: s.access,
          title: s.title,
          description: s.description,
          edl: s.edl,
          comments: s.comments,
        }
      }
    }

    const updateEDL = (edl: EditDecriptionList) => {
      localShare.value.edl = edl
      unsavedData.value = true
    }

    watch(
      () => selectedItem.value,
      (s) => {
        if (s) {
          videoID = s.video.details.id
          videoDuration = s.video.details.duration
          resetData(s)
        }
      }
    )
    if (selectedItem.value) {
      videoID = selectedItem.value.video.details.id
      resetData(selectedItem.value)
    }

    const updateShare = function () {
      videoActions.updateShare(videoID, localShare.value)
      unsavedData.value = false
    }

    const deleteShare = function () {
      videoActions.deleteShare(videoID, localShare.value)
    }

    return {
      videoDuration,
      videoCurrentTime,
      NARList,
      localShare,
      showUsers,
      updateEDL,
      updateShare,
      deleteShare,
      unsavedData,
    }
  },
})
</script>
