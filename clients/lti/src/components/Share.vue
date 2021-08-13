<template>
  <div class="my-2 flex flex-row">
    <div class="flex flex-col">
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
        <Button class="mx-2" v-if="unsavedData" @vclick="save()">Save</Button>
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
import { defineComponent, ref, Ref, PropType, watch, toRefs } from 'vue'
import { useAppStore } from '@/store/useAppStore'
import { EditDecriptionList, NameAndRole, VideoSharing } from '@/types/main'
import AnswerInput from '@/components/base/AnswerInput.vue'
import Button from '@/components/base/Button.vue'
import Trim from './Trim.vue'
const { getters: appGetters } = useAppStore()

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
  props: {
    share: {
      type: Object as PropType<VideoSharing>,
      required: true,
    },
    videoCurrentTime: {
      type: Number,
      required: true,
    },
    videoDuration: {
      type: Number,
      required: true,
    },
  },
  emits: ['updated', 'deleted'],
  setup(props, context) {
    const { share } = toRefs(props)
    const showUsers = ref(false)
    const unsavedData = ref(false)
    let NARList: NARListItem[] = appGetters.canvasData.value.namesAndRoles.map(
      (u) => ({ itemName: u.name, item: u })
    )
    const localShare: Ref<VideoSharing> = ref({
      _id: '',
      users: [],
      access: false,
      description: '',
      edl: { trim: [0, 0], blur: [] },
    })

    const resetData = (s: VideoSharing) => {
      localShare.value = {
        _id: s._id || '',
        users: s.users,
        access: s.access,
        description: s.description,
        edl: s.edl,
      }
    }

    const updateEDL = (edl: EditDecriptionList) => {
      localShare.value.edl = edl
      unsavedData.value = true
    }

    watch(
      () => share.value,
      (s) => resetData(s)
    )
    resetData(share.value)

    const save = function () {
      context.emit('updated', localShare.value)
      unsavedData.value = false
    }

    const deleteShare = function () {
      context.emit('deleted')
    }

    return {
      NARList,
      localShare,
      showUsers,
      updateEDL,
      save,
      deleteShare,
      unsavedData,
    }
  },
})
</script>
