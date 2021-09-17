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
  <div>
    <div
      v-if="selectedItemShare"
      class="my-6 flex flex-row flex-wrap bg-viva-grey-300 text-viva-grey-500 rounded-xl w-full"
    >
      <div
        class="flex flex-col transition-width duration-500 ease-in-out"
        :class="[showAnnotations ? 'w-2/3' : 'w-full']"
      >
        <div class="w-auto relative">
          <Button
            class="absolute top-2 right-2 z-10"
            :childclass="'w-10 h-10'"
            :textcolour="'text-white'"
            @vclick.stop="() => (showAnnotations = !showAnnotations)"
          >
            <img
              :src="annotateButtonSVG"
              class="w-5 h-5"
              alt="annotate-button"
            />
          </Button>
          <Player @currenttimetrimmed="(time) => (currentPlayerTime = time)" />
        </div>
        <div class="flex flex-col text-white p-6">
          <div class="flex flex-row w-full justify-between">
            <p class="m-1 mb-4 text-xl max-w-xxs lg:text-2xl lg:max-w-sm">
              {{ selectedItemShare.item.dataset.name
              }}{{ selectedItemShare.item.dataset.selection }}
            </p>
            <Button
              v-if="myLTIID === selectedItemShare.share.creator"
              :childclass="'w-24 h-10'"
              :backgroundcolour="'bg-viva-grey-450'"
              :textcolour="'text-white'"
              @vclick.stop="editShare()"
            >
              Edit
            </Button>
          </div>
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
          <div class="flex flex-row flex-wrap pt-4">
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
          <div class="flex flex-col pt-4">
            <p class="text-2xl text-white">
              {{ selectedItemShare.share.title || 'no title' }}
            </p>
            <p class="text-sm text-white">
              {{ selectedItemShare.share.description || 'no descritpion' }}
            </p>
          </div>
        </div>
      </div>
      <div
        class="flex flex-col transition-width duration-500 ease-in-out"
        :class="[showAnnotations ? 'w-1/3' : 'w-0']"
      >
        <div
          class="bg-viva-grey-400 text-viva-grey-350 rounded-xl ml-2 flex flex-col"
          style="max-height: 50vh"
          v-if="showAnnotations"
        >
          <div class="flex flex-row justify-between px-4 pt-4 text-white">
            <p>Annotations</p>
            <div class="flex flex-row">
              <icon-base
                icon-name="sortByVideoDate"
                class="ml-2 stroke-current cursor-pointer"
                :class="[sortByCreated ? 'text-yellow-500' : 'text-white']"
                alt="created-sort-button"
                @click="sortBy('creationtime')"
                viewBox="0 0 68.37 68.37"
                width="24"
                height="24"
                ><icon-sort-date />
              </icon-base>
              <icon-base
                icon-name="sortByVideoTime"
                class="ml-2 stroke-current cursor-pointer"
                :class="[sortByCreated ? 'text-white' : 'text-yellow-500']"
                alt="video-sort-button"
                @click="sortBy('videotime')"
                viewBox="0 0 68.37 68.37"
                width="24"
                height="24"
                ><icon-sort-play />
              </icon-base>
            </div>
          </div>
          <input
            class="m-3 p-3 bg-viva-grey-450 text-white text-xs focus:bg-viva-grey-450 rounded-full"
            placeholder="Write a comment"
            v-model="annotationText"
            @keyup.enter="addAnnotation()"
          />
          <div class="no-scrollbar overflow-y-auto flex flex-col flex-grow">
            <AnnotationCard
              class="mx-3"
              v-for="a in annotations"
              :key="a._id"
              :annotation="a"
              :upperBound="upperBound"
              @updated="updateAnnotation"
              @deleted="deleteAnnotation"
              @newcomment="newAnnotationComment"
            />
          </div>
        </div>
      </div>
    </div>
    <!-- Comments panel -->
    <div
      class="bg-viva-grey-400 flex flex-col h-full p-4 no-scrollbar overflow-y-auto"
      v-if="selectedItemShare"
    >
      <div class="flex flex-col w-full justify-end">
        <div class="flex flex-row w-full">
          <div
            class="flex items-center justify-center w-10 h-10 rounded-full text-white text-xs"
            :style="{
              'background-color': stringToColour(nameAndRole(myLTIID).name),
            }"
          >
            {{ nameAndRole(myLTIID).abbreviation }}
          </div>
          <div
            class="flex flex-grow ml-4 w-auto rounded-2xl bg-viva-grey-430 p-4"
          >
            <textarea
              type="text"
              class="w-full bg-transparent text-white"
              placeholder="Write a comment"
              v-model="commentText"
            />
          </div>
        </div>
        <div class="flex flex-row m-2 w-full justify-end p-2">
          <Button
            :childclass="'w-24 h-10'"
            :backgroundcolour="'bg-viva-blue-800'"
            :textcolour="'text-white'"
            @vclick.stop="saveComment()"
          >
            Publish
          </Button>
        </div>
      </div>
      <div
        v-for="(s, i) in selectedItemShare.share.comments"
        :key="`share-comment-${i}`"
        class="flex flex-col"
      >
        <div class="flex flex-row items-center text-xs mt-4">
          <div
            class="flex items-center justify-center w-10 h-10 rounded-full text-white"
            :style="{
              'background-color': stringToColour(nameAndRole(s.creator).name),
            }"
          >
            {{ nameAndRole(s.creator).abbreviation }}
          </div>
          <p
            class="font-serious font-medium h-4 ml-4"
            :style="{
              color: stringToColour(nameAndRole(s.creator).name),
            }"
          >
            {{ nameAndRole(s.creator).name }}
          </p>
          <p class="leading-4 text-viva-grey-500">
            &nbsp;•&nbsp;{{ formatCreationDate(s.created) }}
          </p>
        </div>
        <div class="flex flex-row items-center text-xs text-white mt-4">
          <p>{{ s.text }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import { defineComponent, ref, ComputedRef, computed } from 'vue'
import moment from 'moment'
import { useAppStore } from '@/store/useAppStore'
import { useVideoStore } from '@/store/useVideoStore'
import { Annotation, AnnotationComment, ShareComment } from '@/types/main'
import { stringToColour, formatDate } from '@/utilities'
import { baseUrl, VIDEO_DETAIL_MODE } from '@/constants'
import trimButtonSVG from '@/assets/icons/svg/trim.svg'
import playButtonSVG from '@/assets/icons/svg/play.svg'
import annotateButtonSVG from '@/assets/icons/svg/annotate.svg'
import SortByCreationTimeSVG from '@/assets/icons/svg/sort-date.svg'
import sortByVideoTimeSVG from '@/assets/icons/svg/sort-play.svg'
import Player from '@/views/Player.vue'
import AnnotationCard from '@/components/AnnotationCard.vue'
import Button from '@/components/base/Button.vue'

import IconBase from '@/components/icons/IconBase.vue'
import IconSortPlay from '@/components/icons/IconSortPlay.vue'
import IconSortDate from '@/components/icons/IconSortDate.vue'

const { getters: appGetters, actions: appActions } = useAppStore()
const { getters: videoGetters, actions: videoActions } = useVideoStore()

export default defineComponent({
  name: 'Annotate',
  components: {
    Button,
    Player,
    AnnotationCard,
    IconBase,
    IconSortPlay,
    IconSortDate,
  },
  setup() {
    const selectedItemShare = videoGetters.selectedItemShare
    const showUsers = ref(false)
    const showAnnotations = ref(false)
    const currentPlayerTime = ref(0)
    const sortByCreated = ref(false)
    const annotationText = ref('')
    const commentText = ref('')
    const upperBound = ref(selectedItemShare.value?.share.edl.trim[1] || 0)
    const videoCurrentTime = ref(0)
    const myLTIID = appGetters.user.value.profile.ltiID

    function editShare() {
      if (selectedItemShare.value) {
        videoActions.selectShare(selectedItemShare.value)
        videoActions.detailMode(VIDEO_DETAIL_MODE.share, VIDEO_DETAIL_MODE.none)
      }
    }

    function formatCreationDate(date: Date) {
      return moment(date).format('MMM Do Y - H:mm')
    }

    const addAnnotation = function () {
      const newAnnotation: Annotation = {
        created: new Date(),
        creator: myLTIID,
        text: annotationText.value,
        time: [currentPlayerTime.value],
        comments: [],
        nowActive: false,
      }
      if (selectedItemShare.value)
        videoActions.createAnnotation(selectedItemShare.value, newAnnotation)
      annotationText.value = ''
    }

    const saveComment = function () {
      if (selectedItemShare.value) {
        const comment: ShareComment = {
          created: new Date(),
          creator: myLTIID,
          text: commentText.value,
        }
        videoActions.createComment(selectedItemShare.value, comment)
        commentText.value = ''
      }
    }

    const sortBy = function (type: string) {
      sortByCreated.value = type === 'creationtime'
    }

    const updateAnnotation = function (a: Annotation) {
      if (selectedItemShare.value)
        videoActions.updateAnnotation(selectedItemShare.value, a)
    }

    const deleteAnnotation = function (a: Annotation) {
      if (selectedItemShare.value)
        videoActions.deleteAnnotation(selectedItemShare.value, a)
    }

    const newAnnotationComment = function (data: {
      c: AnnotationComment
      a: Annotation
    }) {
      if (selectedItemShare.value)
        videoActions.createAnnotationComment(
          selectedItemShare.value,
          data.a,
          data.c
        )
    }

    // if 'sortByCreated' sort by creation date, otherwise by video time
    function compareAnnotations(a: Annotation, b: Annotation) {
      const aTime = sortByCreated.value ? a.created.getTime() : a.time[0]
      const bTime = sortByCreated.value ? b.created.getTime() : b.time[0]
      if (aTime < bTime) return -1
      if (aTime > bTime) return 1
      return 0
    }

    const annotations: ComputedRef<Annotation[]> = computed(() => {
      const t1DisplayPeriod = 5 // Seconds
      const ans = selectedItemShare.value?.share.annotations || []
      return (
        ans
          // Remove annotations that are before the current video time
          // For single-time entries, allow several seconds for display (t1DisplayPeriod)
          // If sorting by 'created' instead return the whole list
          .filter((a) => {
            const endTime = a.time[1] ? a.time[1] : a.time[0] + t1DisplayPeriod
            return sortByCreated.value
              ? true
              : endTime > currentPlayerTime.value
          })
          // Sort based on either creation date or video time
          .sort(compareAnnotations)
          // Highlight annotation if the current time is within annotation timeframe
          .map((a) => {
            const t = currentPlayerTime.value
            const tDiff = t - a.time[0]
            a.nowActive =
              !sortByCreated.value &&
              ((a.time[1] && a.time[1] > t && a.time[0] <= t) ||
                (tDiff <= t1DisplayPeriod && tDiff >= 0))
            return a
          })
      )
    })

    return {
      VIDEO_DETAIL_MODE,
      baseUrl,
      myLTIID,
      upperBound,
      selectedItemShare,
      stringToColour,
      formatDate,
      annotations,
      annotationText,
      commentText,
      showUsers,
      showAnnotations,
      editShare,
      saveComment,
      currentPlayerTime,
      addAnnotation,
      updateAnnotation,
      deleteAnnotation,
      newAnnotationComment,
      videoCurrentTime,
      detailMode: videoGetters.detailMode,
      sortBy,
      sortByCreated,
      nameAndRole: appActions.nameAndRole,
      formatCreationDate,

      // assets
      trimButtonSVG,
      playButtonSVG,
      annotateButtonSVG,
      SortByCreationTimeSVG,
      sortByVideoTimeSVG,
    }
  },
})
</script>
