<template>
  <div>
    <template
      v-if="detailMode.submode === VIDEO_DETAIL_MODE.none && selectedItemShare"
    >
      <div
        class="my-6 flex flex-row flex-wrap bg-viva-grey-400 text-viva-grey-500 rounded-xl p-6"
      >
        <div class="flex flex-col w-auto lg:w-72">
          <div
            class="relative flex bg-viva-grey-450 rounded-md justify-center items-center"
          >
            <img
              class="object-cover h-36"
              :src="`${baseUrl}/api/video/file?videoref=${selectedItemShare.item.video.details.id}&mode=thumbnail`"
              alt="video thumbnail"
            />
            <div
              class="absolute flex justify-center items-center w-full h-full"
            >
              <div
                class="flex items-center justify-center w-10 h-10 rounded-full p-3 pl-4 mr-2 border"
                @click.stop="playVideo()"
              >
                <img :src="playButtonSVG" alt="play-button" />
              </div>
            </div>
          </div>
          <div class="flex flex-col text-white pt-3">
            <p class="m-1 mb-4 text-xl max-w-xxs lg:text-2xl lg:max-w-sm">
              {{ selectedItemShare.item.dataset.name
              }}{{ selectedItemShare.item.dataset.selection }}
            </p>
            <p class="m-1 text-xs">
              By
              <span
                :style="{
                  color: stringToColour(selectedItemShare.item.owner.name),
                }"
                >{{ selectedItemShare.item.owner.name }}</span
              >
            </p>
            <p class="m-1 text-xs">
              {{ formatDate(selectedItemShare.item.video.details.created) }}
            </p>
          </div>
          <div class="flex mt-4">
            <div class="flex flex-row flex-wrap">
              <div
                v-for="(nar, index) in selectedItemShare.users"
                :key="`share-user-${index}`"
                class="flex items-center justify-center w-10 h-10 rounded-full text-white text-xs -m-1"
                :style="{
                  'background-color': stringToColour(nar.name),
                }"
              >
                {{ nar.abbreviation }}
              </div>
            </div>
          </div>
          <div class="flex flex-col mt-4">
            <p class="text-2xl text-white">
              {{ localShare.title || 'no title' }}
            </p>
            <p class="text-sm text-white">
              {{ localShare.description || 'no descritpion' }}
            </p>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
<script lang="ts">
import { defineComponent, ref, Ref, watch } from 'vue'
import { useAppStore } from '@/store/useAppStore'
import { useVideoStore } from '@/store/useVideoStore'
import {
  EditDecriptionList,
  NameAndRole,
  VideoSharing,
  ListItemShare,
} from '@/types/main'
import { stringToColour, formatDate } from '@/utilities'
import { baseUrl, VIDEO_DETAIL_MODE } from '@/constants'
import trimButtonSVG from '@/assets/icons/svg/trim.svg'
import playButtonSVG from '@/assets/icons/svg/play.svg'

const { getters: appGetters } = useAppStore()
const { getters: videoGetters, actions: videoActions } = useVideoStore()

interface NARListItem {
  itemName: string
  item: NameAndRole
}

export default defineComponent({
  name: 'Annotate',
  setup() {
    const selectedItemShare = videoGetters.selectedItemShare
    const showUsers = ref(false)
    const unsavedData = ref(false)
    const videoCurrentTime = ref(0)
    const myLTIID = appGetters.user.value.profile.ltiID
    let NARList: NARListItem[] = appGetters.canvasData.value.namesAndRoles
      .map((u) => ({ itemName: u.name, item: u }))
      .filter((u) => u.item.ltiID !== myLTIID)

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

    const resetData = (li: ListItemShare) => {
      unsavedData.value = false
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

    const updateEDL = (trim: EditDecriptionList['trim']) => {
      localShare.value.edl.trim = trim
      unsavedData.value = true
    }

    watch(
      () => selectedItemShare.value,
      (s) => {
        if (s) {
          resetData(s)
        }
      }
    )
    if (selectedItemShare.value) {
      resetData(selectedItemShare.value)
    }

    const updateShare = function () {
      if (selectedItemShare.value && unsavedData.value) {
        videoActions.updateShare(
          selectedItemShare.value.item.video.details.id,
          localShare.value
        )
        unsavedData.value = false
      }
    }

    const updateDuration = function (duration: string) {
      localShare.value.edl.trim[1] = parseFloat(duration)
    }

    const deleteShare = function () {
      if (selectedItemShare.value) {
        videoActions.deleteShare(
          selectedItemShare.value.item.video.details.id,
          localShare.value
        )
      }
    }

    const playVideo = function () {
      videoActions.detailMode(
        VIDEO_DETAIL_MODE.annotate,
        VIDEO_DETAIL_MODE.play
      )
    }

    return {
      VIDEO_DETAIL_MODE,
      baseUrl,
      myLTIID,
      selectedItemShare,
      stringToColour,
      formatDate,
      NARList,
      localShare,
      showUsers,
      updateEDL,
      updateShare,
      deleteShare,
      unsavedData,
      playVideo,
      videoCurrentTime,
      updateDuration,
      detailMode: videoGetters.detailMode,

      // assets
      trimButtonSVG,
      playButtonSVG,
    }
  },
})
</script>
