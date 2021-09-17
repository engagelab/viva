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
  <div
    class="flex flex-col text-viva-grey-500 rounded-xl bg-viva-grey-400 my-1 overflow-hidden"
    @mouseover="hover = true"
    @mouseleave="hover = false"
  >
    <div
      class="relative flex flex-col justify-between h-96 bg-opacity-40 bg-viva-grey-300"
    >
      <div
        class="absolute top-2 right-2 flex bg-viva-grey-300 items-center justify-center w-8 h-8 z-50 rounded-full text-xs cursor-pointer"
        v-show="menu || hover"
        @click.stop="menu = !menu"
      >
        <IconBase
          icon-name="menuDots"
          class="text-white stroke-current cursor-pointer"
          alt="annotation-menu"
          viewBox="0 0 30 30"
          width="25"
          height="25"
          ><IconMenuDots />
        </IconBase>
      </div>
      <div
        class="absolute flex flex-col top-10 right-2 bg-viva-grey-300 p-2 gap-2 w-24 z-50 rounded-md text-xs text-white cursor-pointer"
        v-show="menu"
      >
        <p @click.stop="editOriginal()">Edit</p>
        <p @click.stop="newShare(listitem)">New share</p>
        <p @click.stop="deleteOriginal(listitem)">Delete</p>
      </div>
      <div
        class="absolute filter blur-sm w-full h-full bg-cover bg-center bg-no-repeat"
        :style="{
          'background-image': `url(${baseUrl}/api/video/file?videoref=${listitem.video.details.id}&mode=thumbnail)`,
        }"
      ></div>
      <div class="relative flex flex-col items-center text-white pt-3">
        <p class="m-1 text-xs">By {{ listitem.owner.name }}</p>
        <p class="m-1 text-xs">
          {{ formatDate(listitem.video.details.created) }}
        </p>
      </div>
      <div class="relative flex flex-col items-center">
        <div class="flex flex-col text-white font-extralight items-center">
          <p class="m-1 mb-4 text-xl max-w-xxs lg:text-2xl lg:max-w-sm">
            {{ listitem.dataset.name }}{{ listitem.dataset.selection }}
          </p>
          <input
            v-if="editing"
            class="text-2xl bg-viva-grey-400 text-white focus:bg-viva-grey-450 p-1"
            placeholder="Add a name"
            v-model="localVideoDetails.name"
            @input="() => (unsavedData = true)"
          />
          <p v-else class="m-1 text-xs">{{ listitem.video.details.name }}</p>
          <textarea
            v-if="editing"
            class="mt-6 w-full text-white bg-viva-grey-450 focus:ring-2 focus:ring-blue-600 p-1"
            rows="5"
            placeholder="Add a description"
            type="text"
            v-model="localVideoDetails.description"
            @input="() => (unsavedData = true)"
          />
          <p v-else class="m-1 text-xs">
            {{ listitem.video.details.description }}
          </p>
        </div>
        <div
          v-if="!editing"
          class="absolute top-0 left-0 ml-4 flex items-center justify-center w-16 h-16 rounded-full p-5 pl-6 border-white border-opacity-40 border-2"
          @click.stop="play(listitem)"
        >
          <img :src="playButtonSVG" alt="play-button" />
        </div>
      </div>
      <div class="relative flex flex-row justify-center pb-3">
        <Button
          v-if="editing"
          class="mr-2"
          :childclass="'w-32'"
          :disabled="!unsavedData"
          :backgroundcolour="'bg-viva-blue-800'"
          :textcolour="'text-white'"
          @vclick.stop="updateOriginal()"
        >
          Save
        </Button>
        <Button
          v-else
          :childclass="'w-36'"
          :backgroundcolour="'bg-viva-blue-800'"
          @vclick.stop="newShare(listitem)"
        >
          <img :src="shareButtonSVG" class="w-4 h-4" alt="share-button" />
          <p class="pl-2">New share</p>
        </Button>
        <Button
          v-if="editing"
          class="ml-2"
          :childclass="'w-32'"
          @vclick.stop="cancelEdit()"
        >
          Cancel
        </Button>
        <div
          class="absolute bottom-6 right-6 flex items-center justify-center w-10 h-10 p-3 rounded-full border-white border-opacity-40 border-2 transform transition duration-500"
          :class="{ 'rotate-180': openCard }"
          @click.stop="openCard = !openCard"
        >
          <img :src="arrowTopSVG" alt="arrow-button" />
        </div>
      </div>
    </div>
    <div
      class="transition-maxheight duration-500 ease-in-out overflow-x-hidden overflow-y-auto no-scrollbar bg-viva-grey-300"
      :class="[openCard ? 'max-h-96' : 'max-h-0']"
    >
      <VideoSharedCard
        v-for="share in listitem.shares"
        :key="share.id"
        :share="share"
        @annotate="() => $emit('annotate')"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, ref, Ref, toRefs, watch } from 'vue'
import moment from 'moment'
import { useI18n } from 'vue-i18n'
import { ListItem, VideoDetailsData, DialogConfig } from '../types/main'
import { baseUrl, VIDEO_DETAIL_MODE } from '@/constants'
import VideoSharedCard from '@/components/VideoSharedCard.vue'
import Button from '@/components/base/Button.vue'
import IconBase from '@/components/icons/IconBase.vue'
import IconMenuDots from '@/components/icons/IconMenuDots.vue'
import playButtonSVG from '@/assets/icons/svg/play.svg'
import shareButtonSVG from '@/assets/icons/svg/share.svg'
import arrowTopSVG from '@/assets/icons/svg/arrow_top.svg'
import { useVideoStore } from '@/store/useVideoStore'
import { useAppStore } from '@/store/useAppStore'
const { actions: videoActions } = useVideoStore()
const { actions: appActions } = useAppStore()

const messages = {
  nb_NO: {
    dialogDeleteTitle: 'Slett denne video',
    dialogDeleteText:
      'Hvis du sletter, fjernes også alle delinger, merknader, kommentarer og triminnstillinger',
    dialogDeleteConfirm: 'Slette',
    dialogDeleteCancel: 'Avbryt',
  },
  en: {
    dialogDeleteTitle: 'Delete this video',
    dialogDeleteText:
      'Deleting will also remove all shares, annotations, comments, and trim settings',
    dialogDeleteConfirm: 'Delete',
    dialogDeleteCancel: 'Cancel',
  },
}

export default defineComponent({
  name: 'VideoMyCard',
  components: {
    VideoSharedCard,
    Button,
    IconBase,
    IconMenuDots,
  },
  props: {
    listitem: { type: Object as PropType<ListItem>, required: true },
  },
  emits: ['annotate'],
  setup(props) {
    const { t } = useI18n({ messages })
    const { listitem } = toRefs(props)
    const openCard = ref(false)
    const hover = ref(false)
    const menu = ref(false)
    const editing = ref(false)
    const unsavedData = ref(false)

    const localVideoDetails: Ref<VideoDetailsData> = ref({
      name: '',
      description: '',
    })

    const resetData = (li: ListItem) => {
      unsavedData.value = false
      localVideoDetails.value = {
        name: li.video.details.name || '',
        description: li.video.details.description || '',
      }
    }

    watch(
      () => listitem.value,
      (s) => {
        if (s) {
          resetData(s)
        }
      }
    )
    if (listitem.value) resetData(listitem.value)

    function formatDate(date: Date) {
      return moment(date).format('MMM Do')
    }
    function play(li: ListItem) {
      videoActions.detailMode(VIDEO_DETAIL_MODE.play, VIDEO_DETAIL_MODE.play)
      videoActions.selectOriginal(li)
    }
    function newShare(li: ListItem) {
      menu.value = false
      videoActions.createShare(li)
      videoActions.detailMode(VIDEO_DETAIL_MODE.share, VIDEO_DETAIL_MODE.none)
      videoActions.selectOriginal(li)
    }
    function deleteOriginal(li: ListItem) {
      menu.value = false
      const dialogConfig: DialogConfig = {
        title: t('dialogDeleteTitle'),
        visible: true,
        text: t('dialogDeleteText'),
        cancel: () => appActions.setDialog(false),
        cancelText: t('dialogDeleteCancel'),
        confirm: () => {
          videoActions
            .deleteOriginal(li.video.details.id)
            .then(() => appActions.setDialog(false))
        },
        confirmText: t('dialogDeleteConfirm'),
      }
      appActions.setDialog(true, dialogConfig)
    }
    function editOriginal() {
      menu.value = false
      editing.value = true
    }
    function cancelEdit() {
      editing.value = false
    }
    function updateOriginal() {
      if (unsavedData.value && listitem.value) {
        videoActions.updateVideoDetails(
          listitem.value.video.details.id,
          localVideoDetails.value
        )
        unsavedData.value = false
        editing.value = false
      }
    }
    return {
      openCard,
      hover,
      menu,
      editing,
      unsavedData,
      editOriginal,
      deleteOriginal,
      updateOriginal,
      cancelEdit,
      formatDate,
      baseUrl,
      play,
      newShare,
      localVideoDetails,
      // assets
      playButtonSVG,
      shareButtonSVG,
      arrowTopSVG,
    }
  },
})
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style type="postcss" scoped></style>
