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
    class="relative flex flex-row items-center text-viva-grey-500 my-1"
    @mouseover="hover = true"
    @mouseleave="hover = false"
  >
    <div class="flex flex-col flex-grow">
      <!-- User and Menu -->
      <div class="relative flex flex-row items-end w-full h-6 px-3">
        <p
          class="font-serious font-medium text-xs h-4"
          :style="{
            color: stringToColour(nameAndRole.name),
          }"
        >
          {{ nameAndRole.name }}
        </p>
        <div
          class="absolute top-0 right-0 flex bg-viva-grey-300 z-50 cursor-pointer rounded-full"
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
          class="absolute flex flex-col top-6 right-1 bg-viva-grey-300 p-2 gap-2 w-24 z-50 rounded-md text-xs text-white cursor-pointer"
          v-show="menu"
        >
          <p @click.stop="newComment()">Comment</p>
          <div
            v-if="myLTIID === annotation.creator"
            class="flex flex-col gap-2"
          >
            <p @click.stop="editMainText()">Edit</p>
            <p @click.stop="editEndTime()">Timeframe</p>
            <p @click.stop="deleteAnnotation()">Delete</p>
          </div>
        </div>
      </div>
      <!-- Main Annotation Bubble -->
      <div class="flex flex-col flex-grow rounded-2xl bg-viva-grey-430 mt-0.5">
        <div class="flex flex-row p-2">
          <!-- Start Time -->
          <div
            class="p-1 pl-2 flex items-center justify-center text-white font-serious font-medium bg-viva-grey-425 rounded-2xl rounded-r-none cursor-pointer"
          >
            <input
              v-if="editingStartTime"
              ref="startTimeInputRef"
              class="bg-viva-grey-400 text-white text-xsv bg-viva-grey-450 w-14"
              :class="[incorrectStartTime ? 'text-red-600' : '']"
              v-model="localStartTime"
              @keyup.enter="validateTime(true)"
            />
            <p
              v-else
              class="text-xsv"
              :class="[annotation.nowActive ? 'text-yellow-500' : 'text-white']"
              @click="editStartTime()"
            >
              {{ formatTime(annotation.time[0], 0) }}
            </p>
          </div>
          <!-- End Time -->
          <div
            class="p-1 ml-0.5 pr-2 flex items-center justify-center text-white font-serious font-medium bg-viva-grey-425 rounded-2xl rounded-l-none cursor-pointer"
          >
            <input
              v-show="editingEndTime"
              ref="endTimeInputRef"
              class="bg-viva-grey-400 text-white text-xsv bg-viva-grey-450 w-14"
              :class="[incorrectEndTime ? 'text-red-600' : '']"
              v-model="localEndTime"
              @keyup.enter="validateTime(true)"
            />
            <div
              v-show="!editingEndTime"
              class="flex flex-col items-center"
              @click="editEndTime()"
            >
              <p
                class="text-xsv"
                :class="[
                  annotation.nowActive ? 'text-yellow-500' : 'text-white',
                ]"
                v-if="annotation.time[1]"
              >
                {{ formatTime(annotation.time[1], 0) }}
              </p>
              <IconBase
                v-else
                icon-name="iconPlus"
                class="text-white stroke-current cursor-pointer"
                alt="edit-endtime"
                viewBox="0 10 180 170"
                width="12"
                height="12"
                ><IconPlus />
              </IconBase>
            </div>
          </div>
        </div>
        <!-- Main Annotation Text -->
        <div class="text-white text-xs font-serious mt-1 cursor-pointer px-3">
          <textarea
            v-if="myLTIID === annotation.creator"
            ref="textInputRef"
            type="text"
            class="w-full bg-transparent"
            :class="[annotation.nowActive ? 'text-yellow-500' : 'text-white']"
            placeholder="Add a description"
            v-model="localAnnotation.text"
            @click="editMainText()"
            @blur="saveText('mainText')"
          />
          <p v-else>
            {{ annotation.text }}
          </p>
        </div>
        <div class="flex flex-row justify-between items-end text-xxs p-2">
          <p
            v-if="editingMainText"
            class="text-white font-serious bg-viva-grey-425 rounded-md cursor-pointer p-1"
            @click="saveText('mainText')"
          >
            save
          </p>
          <p v-else></p>
          <p class="leading-4">
            {{ formatCreationDate(annotation.created) }}
          </p>
        </div>
      </div>

      <!-- Comment Bubbles -->
      <div
        v-for="(comment, i) in allComments"
        :key="`${annotation._id}-comment-${i}`"
        class="flex flex-col flex-grow ml-2"
      >
        <div class="relative flex flex-row items-end w-full px-3">
          <p class="font-serious font-medium text-xs text-white mt-2">
            <span
              class="h-4"
              :style="{ color: stringToColour(nameAndRole.name) }"
            >
              {{ nameAndRole.name }}
            </span>
            <span class="h-4">&nbsp;{{ t('commented') }}</span>
          </p>
        </div>
        <div class="flex flex-col flex-grow rounded-2xl bg-viva-grey-430 mt-1">
          <div class="text-white text-xs font-serious mt-1 cursor-pointer px-3">
            <textarea
              v-if="
                myLTIID === comment.creator &&
                editingComment &&
                i === allComments.length - 1
              "
              ref="commentInputRef"
              type="text"
              class="w-full bg-transparent mt-1"
              placeholder="Add a comment"
              v-model="localComment.text"
            />
            <p v-else>
              {{ comment.text }}
            </p>
          </div>
          <div class="flex flex-row justify-between items-end text-xxs p-2">
            <p
              v-if="editingComment && i === allComments.length - 1"
              class="text-white font-serious bg-viva-grey-425 rounded-md cursor-pointer p-1"
              @click="saveText('commentText')"
            >
              save
            </p>
            <p v-else></p>
            <p class="leading-4">{{ formatCreationDate(comment.created) }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import {
  PropType,
  ComputedRef,
  Ref,
  ref,
  computed,
  toRefs,
  watch,
  nextTick,
  defineComponent,
} from 'vue'
import { useI18n } from 'vue-i18n'
import moment from 'moment'
import { Annotation, AnnotationComment, DialogConfig } from '../types/main'
import { stringToColour, formatTime, formattedTimeToSeconds } from '@/utilities'
import { baseUrl } from '@/constants'
import plusButtonSVG from '@/assets/icons/svg/plus.svg'
import { useAppStore } from '@/store/useAppStore'

import IconBase from '@/components/icons/IconBase.vue'
import IconMenuDots from '@/components/icons/IconMenuDots.vue'
import IconPlus from '@/components/icons/IconPlus.vue'

const { getters: appGetters, actions: appActions } = useAppStore()

const messages = {
  nb_NO: {
    dialogDeleteTitle: 'Slett denne merknad',
    dialogDeleteText:
      'Hvis du sletter, fjernes også alle kommentarer fra andre',
    dialogDeleteConfirm: 'Slette',
    dialogDeleteCancel: 'Avbryt',
    commented: 'sa',
  },
  en: {
    dialogDeleteTitle: 'Delete this annotation',
    dialogDeleteText: 'Deleting will also remove all comments from others',
    dialogDeleteConfirm: 'Delete',
    dialogDeleteCancel: 'Cancel',
    commented: 'commented',
  },
}

export default defineComponent({
  name: 'AnnotationCard',
  components: {
    IconBase,
    IconMenuDots,
    IconPlus,
  },
  props: {
    annotation: { type: Object as PropType<Annotation>, required: true },
    upperBound: { type: Number, required: true },
  },
  emits: ['updated', 'deleted', 'newcomment'],
  setup(props, context) {
    const { t } = useI18n({ messages })
    const { annotation, upperBound } = toRefs(props)
    const myLTIID = appGetters.user.value.profile.ltiID
    const hover = ref(false)
    const menu = ref(false)
    const startTimeInputRef = ref()
    const endTimeInputRef = ref()
    const textInputRef = ref()
    const commentInputRef = ref()
    const editingEndTime = ref(false)
    const editingStartTime = ref(false)
    const editingMainText = ref(false)
    const editingComment = ref(false)
    const incorrectStartTime = ref(false)
    const incorrectEndTime = ref(false)
    let saveTimer: ReturnType<typeof setTimeout>

    const nameAndRole = computed(() => {
      return appActions.nameAndRole(annotation.value.creator)
    })

    const localStartTime = ref(formatTime(annotation.value.time[0]))
    const localEndTime = ref(
      annotation.value.time[1] ? formatTime(annotation.value.time[1]) : ''
    )
    const localAnnotation: Ref<Annotation> = ref({
      _id: annotation.value._id,
      text: annotation.value.text,
      time: annotation.value.time,
      created: annotation.value.created,
      creator: annotation.value.creator,
      comments: annotation.value.comments,
      nowActive: annotation.value.nowActive,
    })
    const localComment: Ref<AnnotationComment> = ref({
      text: '',
      created: new Date(),
      creator: myLTIID,
    })

    watch(
      () => annotation.value,
      (newValue) => {
        localStartTime.value = formatTime(newValue.time[0])
        localEndTime.value = newValue.time[1]
          ? formatTime(newValue.time[1])
          : ''
        localAnnotation.value = annotation.value
      }
    )

    function formatCreationDate(date: Date) {
      return moment(date).format('MMM Do Y - H:mm')
    }

    function newComment() {
      menu.value = false
      localComment.value.created = new Date()
      localComment.value.creator = myLTIID
      localComment.value.text = ''
      editingComment.value = true
      nextTick(() => {
        if (commentInputRef.value) commentInputRef.value.focus()
      })
    }

    const allComments: ComputedRef<AnnotationComment[]> = computed(() => {
      const acs: AnnotationComment[] = [...annotation.value.comments]
      if (editingComment.value) acs.push(localComment.value)
      return acs
    })

    // If all is correct, save to server
    const runSave = (saveNow: boolean) => {
      clearTimeout(saveTimer)
      if (!incorrectStartTime.value && !incorrectEndTime.value) {
        if (saveNow) context.emit('updated', localAnnotation.value)
        else
          saveTimer = setTimeout(
            () => context.emit('updated', localAnnotation.value),
            2000
          )
        editingStartTime.value = false
        editingEndTime.value = false
      }
    }

    function saveText(type: string) {
      if (type === 'mainText') {
        context.emit('updated', localAnnotation.value)
        editingMainText.value = false
      } else if (type === 'commentText') {
        localAnnotation.value.comments.push(localComment.value)
        context.emit('newcomment', {
          c: localComment.value,
          a: annotation.value,
        })
        editingComment.value = false
      }
    }

    // Validate the latest change to time, save if it is correct, show 'error' otherwise
    function validateTime(save: boolean) {
      const regex = /^(\d{1}:)?\d{2}:\d{2}$/
      const startTime = formattedTimeToSeconds(localStartTime.value)
      const endTime = formattedTimeToSeconds(localEndTime.value)

      if (
        localStartTime.value.match(regex) &&
        startTime >= 0 &&
        startTime <= upperBound.value
      ) {
        localAnnotation.value.time = []
        incorrectStartTime.value = false
        localAnnotation.value.time.push(startTime)
      } else incorrectStartTime.value = true

      if (
        localEndTime.value === '' ||
        (localEndTime.value.match(regex) &&
          endTime > 0 &&
          endTime <= upperBound.value &&
          endTime > startTime)
      ) {
        incorrectEndTime.value = false
        if (localEndTime.value !== '') localAnnotation.value.time.push(endTime)
      } else incorrectEndTime.value = true
      runSave(save)
    }

    function editStartTime() {
      menu.value = false
      editingStartTime.value = annotation.value.creator === myLTIID
      nextTick(() => {
        if (endTimeInputRef.value) startTimeInputRef.value.focus()
      })
    }
    function editEndTime() {
      menu.value = false
      editingEndTime.value = annotation.value.creator === myLTIID
      nextTick(() => {
        if (endTimeInputRef.value) endTimeInputRef.value.focus()
      })
    }
    function editMainText() {
      menu.value = false
      editingMainText.value = true
      nextTick(() => {
        if (textInputRef.value) textInputRef.value.focus()
      })
    }
    function deleteAnnotation() {
      menu.value = false
      const dialogConfig: DialogConfig = {
        title: t('dialogDeleteTitle'),
        visible: true,
        text: t('dialogDeleteText'),
        cancel: () => appActions.setDialog(false),
        cancelText: t('dialogDeleteCancel'),
        confirm: () => {
          context.emit('deleted', localAnnotation.value)
          appActions.setDialog(false)
        },
        confirmText: t('dialogDeleteConfirm'),
      }
      appActions.setDialog(true, dialogConfig)
    }
    return {
      // imports
      t,
      myLTIID,
      formatTime,
      stringToColour,
      formatCreationDate,
      nameAndRole,
      baseUrl,
      plusButtonSVG,
      // template refs
      endTimeInputRef,
      startTimeInputRef,
      textInputRef,
      commentInputRef,
      // event handlers
      editStartTime,
      editEndTime,
      editMainText,
      saveText,
      newComment,
      validateTime,
      deleteAnnotation,
      // booleans
      hover,
      menu,
      editingEndTime,
      editingStartTime,
      editingComment,
      editingMainText,
      incorrectStartTime,
      incorrectEndTime,
      // data
      localStartTime,
      localEndTime,
      localAnnotation,
      localComment,
      allComments,
    }
  },
})
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style type="postcss" scoped></style>
