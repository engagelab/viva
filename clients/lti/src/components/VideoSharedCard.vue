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
    class="relative flex flex-row items-center text-viva-grey-500 bg-viva-grey-400 my-1"
    @click.stop="openAnnotation(share)"
    @mouseover="hover = true"
    @mouseleave="hover = false"
  >
    <div
      class="absolute top-2 right-2 flex bg-viva-grey-300 items-center justify-center w-6 h-6 rounded-full text-xs cursor-pointer"
      v-show="(menu || hover) && myLTIID === share.creator"
      @click.stop="menu = !menu"
    >
      •••
    </div>
    <div
      class="absolute flex flex-col top-10 right-2 bg-viva-grey-300 p-2 gap-2 w-24 rounded-md text-xs text-white cursor-pointer"
      v-show="menu"
    >
      <p @click.stop="editShare(share)">Edit</p>
      <p @click.stop="deleteShare(share)">Delete</p>
    </div>
    <img
      class="object-cover h-36 p-4"
      :src="`${baseUrl}/api/video/file?videoref=${share.item.video.details.id}&mode=thumbnail`"
      alt="video thumbnail"
    />
    <div class="mx-6">
      <p class="text-white">{{ share.share.title }}</p>
      <p class="mt-1 text-xs">
        By <span class="text-white">{{ share.creatorName.name }}</span>
      </p>
      <p class="text-xs">
        {{ formatDate(share.share.created) }}
      </p>
    </div>
    <div class="flex flex-row">
      <div
        v-for="(u, i) in share.users"
        :key="`share-user-${i}`"
        :title="u.name"
        class="flex items-center justify-center w-10 h-10 rounded-full text-white text-xs -m-1"
        :style="{
          'background-color': stringToColour(u.name),
        }"
      >
        {{ u.abbreviation }}
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import moment from 'moment'
import { DialogConfig, ListItemShare } from '../types/main'
import { stringToColour } from '@/utilities'
import { baseUrl, VIDEO_DETAIL_MODE } from '@/constants'
import { useVideoStore } from '@/store/useVideoStore'
import { useAppStore } from '@/store/useAppStore'
const { getters: appGetters, actions: appActions } = useAppStore()
const { actions: videoActions } = useVideoStore()

const messages = {
  nb_NO: {
    dialogDeleteTitle: 'Slett denne delingen',
    dialogDeleteText:
      'Hvis du sletter, fjernes også alle merknader fra andre, kommentarer og triminnstillinger',
    dialogDeleteConfirm: 'Slette',
    dialogDeleteCancel: 'Avbryt',
  },
  en: {
    dialogDeleteTitle: 'Delete this share',
    dialogDeleteText:
      'Deleting will also remove all annotations from others, comments, and trim settings',
    dialogDeleteConfirm: 'Delete',
    dialogDeleteCancel: 'Cancel',
  },
}

export default defineComponent({
  name: 'videoSharedCard',
  props: {
    share: { type: Object as PropType<ListItemShare>, required: true },
  },
  emits: ['annotate'],
  setup(props, context) {
    const { t } = useI18n({ messages })
    const myLTIID = appGetters.user.value.profile.ltiID
    const hover = ref(false)
    const menu = ref(false)

    function formatDate(date: Date) {
      return moment(date).format('MMM Do H:mm')
    }

    function openAnnotation(share: ListItemShare) {
      videoActions.selectShare(share)
      context.emit('annotate')
    }

    function editShare(share: ListItemShare) {
      menu.value = false
      videoActions.selectShare(share)
      videoActions.detailMode(VIDEO_DETAIL_MODE.share, VIDEO_DETAIL_MODE.none)
    }

    function deleteShare(share: ListItemShare) {
      menu.value = false
      const dialogConfig: DialogConfig = {
        title: t('dialogDeleteTitle'),
        visible: true,
        text: t('dialogDeleteText'),
        cancel: () => appActions.setDialog(false),
        cancelText: t('dialogDeleteCancel'),
        confirm: () => {
          videoActions
            .deleteShare(share.item.video.details.id, share.share)
            .then(() => appActions.setDialog(false))
        },
        confirmText: t('dialogDeleteConfirm'),
      }
      appActions.setDialog(true, dialogConfig)
    }

    return {
      formatDate,
      stringToColour,
      hover,
      menu,
      myLTIID,
      baseUrl,
      openAnnotation,
      editShare,
      deleteShare,
    }
  },
})
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style type="postcss" scoped></style>
