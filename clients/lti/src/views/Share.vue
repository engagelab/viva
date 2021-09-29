<!-- Copyright 2020, 2021 Richard Nesnass, Sharanya Manivasagam and Ole Smørdal

 This file is part of VIVA.

 VIVA is free software: you can redistribute it and/or modify
 it under the terms of the GNU Affero General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 GPL-3.0-only or GPL-3.0-or-later

 VIVA is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU Affero General Public License for more details.

 You should have received a copy of the GNU Affero General Public License
 along with VIVA.  If not, see http://www.gnu.org/licenses/. -->
<template>
  <div class="flex flex-col">
    <div class="flex flex-row justify-end p-2">
      <IconBase
        icon-name="selectNoneCross"
        class="text-white cursor-pointer"
        alt="created-sort-button"
        @click="selectNone()"
        viewBox="0 0 144.54 144.54"
        width="18"
        height="18"
        ><IconCross />
      </IconBase>
    </div>
    <template
      class="my-6"
      v-if="detailMode.submode === VIDEO_DETAIL_MODE.none && selectedItemShare"
    >
      <div
        class="flex flex-row flex-wrap bg-viva-grey-400 text-viva-grey-500 rounded-xl p-6 w-auto lg:w-192"
      >
        <div class="flex flex-col w-auto lg:w-72">
          <div
            class="relative flex bg-viva-grey-450 justify-center items-center rounded-md"
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
          <div
            v-if="
              myLTIID === localShare.creator &&
              selectedItemShare.share.annotations.length === 0
            "
            @click.stop="trimVideo()"
            class="flex flex-row items-center mt-4 text-viva-blue-800 cursor-pointer"
          >
            <div
              class="flex items-center justify-center w-10 h-10 rounded-full bg-viva-grey-450 p-2 mr-2"
            >
              <img :src="trimButtonSVG" alt="trim-button" />
            </div>
            Trim the video
          </div>
          <p></p>
        </div>
        <div class="flex flex-col flex-grow ml-4">
          <div class="flex flex-col">
            <input
              v-if="myLTIID === localShare.creator"
              class="text-2xl bg-viva-grey-400 text-white focus:bg-viva-grey-450 p-1"
              placeholder="Add a title"
              v-model="localShare.title"
              @input="() => (unsavedData = true)"
            />
            <p v-else class="text-2xl text-white">
              {{ localShare.title }}
            </p>
            <textarea
              v-if="myLTIID === localShare.creator"
              class="mt-6 w-full text-white bg-viva-grey-450 focus:ring-2 focus:ring-blue-600 p-1"
              rows="5"
              placeholder="Add a description"
              type="text"
              v-model="localShare.description"
              @input="() => (unsavedData = true)"
            />
            <p v-else class="text-sm text-white">
              {{ localShare.description }}
            </p>
          </div>
          <div class="flex flex-col mt-4">
            <p class="my-2 text-white">Shared with</p>
            <div class="m-2 max-h-36 overflow-scroll overflow-x-hidden">
              <template v-for="(nar, index) in NARList" :key="index">
                <div v-if="myLTIID === localShare.creator">
                  <input
                    class="mr-4 mb-4"
                    type="checkbox"
                    :id="`share-user-${index}`"
                    :value="nar.item.ltiID"
                    v-model="localShare.users"
                    @change="unsavedData = true"
                  />
                  <label class="mr-2" :for="`share-user-${index}`">{{
                    nar.itemName
                  }}</label>
                </div>
                <div v-else class="flex flex-row my-2 items-center">
                  <div
                    class="flex items-center justify-center w-10 h-10 rounded-full border text-xs"
                  >
                    {{ nar.item.abbreviation }}
                  </div>
                  <div class="flex flex-col">
                    <p class="ml-2">{{ nar.item.name }}</p>
                    <p
                      v-if="localShare.creator === nar.item.ltiID"
                      class="text-xs text-white"
                    >
                      owner
                    </p>
                  </div>
                </div>
              </template>
            </div>
          </div>
          <Button
            v-if="myLTIID === localShare.creator"
            class="self-end"
            :childclass="'w-32'"
            :disabled="!unsavedData"
            :backgroundcolour="'bg-viva-blue-800'"
            :textcolour="'text-white'"
            @vclick.stop="updateShare()"
          >
            Save
          </Button>
        </div>
      </div>
    </template>
    <template v-else-if="detailMode.submode === VIDEO_DETAIL_MODE.trim">
      <Player @duration="updateDuration" @trim="updateEDL" class="lg:w-192" />
    </template>
  </div>
</template>
<script lang="ts">
import { defineComponent, ref, Ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/store/useAppStore'
import { useVideoStore } from '@/store/useVideoStore'
import {
  EditDecriptionList,
  NameAndRole,
  VideoSharing,
  ListItemShare,
} from '@/types/main'
import { baseUrl, VIDEO_DETAIL_MODE } from '@/constants'
import Player from '@/views/Player.vue'
import Button from '@/components/base/Button.vue'
import trimButtonSVG from '@/assets/icons/svg/trim.svg'
import playButtonSVG from '@/assets/icons/svg/play.svg'
import IconBase from '@/components/icons/IconBase.vue'
import IconCross from '@/components/icons/IconCross.vue'

const { getters: appGetters } = useAppStore()
const { getters: videoGetters, actions: videoActions } = useVideoStore()

const messages = {
  nb_NO: {
    myVideos: 'Videoer min',
    sharedVideos: 'Delt med meg',
  },
  en: {
    myVideos: 'My Videos',
    sharedVideos: 'Shared to me',
  },
}

interface NARListItem {
  itemName: string
  item: NameAndRole
}

export default defineComponent({
  name: 'Share',
  components: {
    Button,
    Player,
    IconBase,
    IconCross,
  },
  setup() {
    const { t } = useI18n({ messages })
    const selectedItemShare = videoGetters.selectedItemShare
    const showUsers = ref(false)
    const unsavedData = ref(false)
    const myLTIID = appGetters.user.value.profile.ltiID
    let NARList: NARListItem[] = appGetters.canvasData.value.namesAndRoles
      .map((u) => ({ itemName: u.name, item: u }))
      .filter((u) => u.item.ltiID !== myLTIID)
    const localShare: Ref<VideoSharing> = ref({
      _id: '',
      creator: myLTIID,
      created: new Date(),
      users: [],
      access: false,
      title: '',
      description: '',
      edl: { trim: [0, 0], blur: [] },
      annotations: [],
      comments: [],
      updateFromShare: VideoSharing.prototype.updateFromShare,
    })

    const resetData = (li: ListItemShare) => {
      unsavedData.value = false
      const s = li.share
      if (s) {
        localShare.value = {
          _id: s._id || '',
          creator: s.creator,
          created: s.created,
          users: s.users,
          access: s.access,
          title: s.title,
          description: s.description,
          edl: s.edl,
          annotations: s.annotations,
          comments: s.comments,
          updateFromShare: VideoSharing.prototype.updateFromShare,
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
    if (selectedItemShare.value) resetData(selectedItemShare.value)

    const updateShare = function () {
      if (unsavedData.value && selectedItemShare.value) {
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

    const trimVideo = function () {
      videoActions.detailMode(VIDEO_DETAIL_MODE.share, VIDEO_DETAIL_MODE.trim)
    }
    const playVideo = function () {
      videoActions.detailMode(VIDEO_DETAIL_MODE.share, VIDEO_DETAIL_MODE.play)
    }

    return {
      t,
      VIDEO_DETAIL_MODE,
      baseUrl,
      myLTIID,
      selectedItemShare,
      NARList,
      localShare,
      showUsers,
      updateEDL,
      updateShare,
      deleteShare,
      unsavedData,
      trimVideo,
      playVideo,
      updateDuration,
      detailMode: videoGetters.detailMode,
      selectNone: videoActions.selectNone,

      // assets
      trimButtonSVG,
      playButtonSVG,
    }
  },
})
</script>
