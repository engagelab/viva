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
      <div class="relative flex flex-row w-full">
        <p
          class="font-serious font-medium mx-2 my-1 text-xs"
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
          <icon-base
            icon-name="menuDots"
            class="text-white stroke-current cursor-pointer"
            alt="annotation-menu"
            viewBox="0 0 30 30"
            width="25"
            height="25"
            ><icon-menu-dots />
          </icon-base>
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
      <div class="flex flex-col flex-grow rounded-2xl bg-viva-grey-430 mt-1">
        <div class="flex flex-row p-2">
          <div
            class="p-1 pl-2 flex items-center justify-center text-white font-serious font-medium bg-viva-grey-425 rounded-2xl rounded-r-none cursor-pointer"
          >
            <input
              v-if="editingStartTime"
              ref="startTimeInputRef"
              class="bg-viva-grey-400 text-white text-xsv bg-viva-grey-450 w-14"
              :class="[incorrectStartTime ? 'text-red-600' : '']"
              v-model="localStartTime"
              @keyup.enter="validateChanges(true)"
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
          <div
            class="p-1 ml-0.5 pr-2 flex items-center justify-center text-white font-serious font-medium bg-viva-grey-425 rounded-2xl rounded-l-none cursor-pointer"
          >
            <input
              v-show="editingEndTime"
              ref="endTimeInputRef"
              class="bg-viva-grey-400 text-white text-xsv bg-viva-grey-450 w-14"
              :class="[incorrectEndTime ? 'text-red-600' : '']"
              v-model="localEndTime"
              @keyup.enter="validateChanges(true)"
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
              <img
                v-else
                class="w-4 h-4"
                :src="plusButtonSVG"
                alt="addEndTime-button"
              />
            </div>
          </div>
        </div>
        <div class="text-white text-xs font-serious mt-1 cursor-pointer px-3">
          <textarea
            v-if="myLTIID === annotation.creator"
            ref="commentInputRef"
            type="text"
            class="w-full bg-transparent"
            :class="[annotation.nowActive ? 'text-yellow-500' : 'text-white']"
            placeholder="Add a comment"
            v-model="localAnnotation.text"
            @input="() => validateChanges(false)"
          />
          <p v-else class="m-3" @click="editMainText()">
            {{ annotation.text }}
          </p>
        </div>
        <div class="flex flex-row justify-end text-xxs p-2">
          <p>{{ formatCreationDate(annotation.created) }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  PropType,
  Ref,
  ref,
  computed,
  toRefs,
  watch,
  nextTick,
} from 'vue'
import { useI18n } from 'vue-i18n'
import moment from 'moment'
import { Annotation, DialogConfig } from '../types/main'
import { stringToColour, formatTime, formattedTimeToSeconds } from '@/utilities'
import { baseUrl } from '@/constants'
import plusButtonSVG from '@/assets/icons/svg/plus.svg'
import { useAppStore } from '@/store/useAppStore'

import IconBase from '@/components/icons/IconBase.vue'
import IconMenuDots from '@/components/icons/IconMenuDots.vue'

const { getters: appGetters, actions: appActions } = useAppStore()

const messages = {
  nb_NO: {
    dialogDeleteTitle: 'Slett denne merknad',
    dialogDeleteText:
      'Hvis du sletter, fjernes også alle kommentarer fra andre',
    dialogDeleteConfirm: 'Slette',
    dialogDeleteCancel: 'Avbryt',
  },
  en: {
    dialogDeleteTitle: 'Delete this annotation',
    dialogDeleteText: 'Deleting will also remove all comments from others',
    dialogDeleteConfirm: 'Delete',
    dialogDeleteCancel: 'Cancel',
  },
}

export default defineComponent({
  name: 'AnnotationCard',
  components: {
    IconBase,
    IconMenuDots,
  },
  props: {
    annotation: { type: Object as PropType<Annotation>, required: true },
    upperBound: { type: Number, required: true },
  },
  emits: ['updated', 'deleted'],
  setup(props, context) {
    const { t } = useI18n({ messages })
    const { annotation, upperBound } = toRefs(props)
    const myLTIID = appGetters.user.value.profile.ltiID
    const hover = ref(false)
    const menu = ref(false)
    const startTimeInputRef = ref()
    const endTimeInputRef = ref()
    const commentInputRef = ref()
    const editingEndTime = ref(false)
    const editingStartTime = ref(false)
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
    }

    const saveChanges = () => {
      context.emit('updated', localAnnotation.value)
    }

    // If all is correct, save to server
    const runSave = (save: boolean) => {
      if (!incorrectStartTime.value && !incorrectEndTime.value) {
        if (save) saveChanges()
        else saveTimer = setTimeout(() => saveChanges(), 2000)
        editingStartTime.value = false
        editingEndTime.value = false
        editingComment.value = false
      }
    }

    // Validate the latest change, save if it is correct, show 'error' otherwise
    function validateChanges(save: boolean) {
      clearTimeout(saveTimer)
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
        (localEndTime.value === '' || localEndTime.value.match(regex)) &&
        endTime > 0 &&
        endTime <= upperBound.value &&
        endTime > startTime
      ) {
        incorrectEndTime.value = false
        localAnnotation.value.time.push(endTime)
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
      editingComment.value = annotation.value.creator === myLTIID
      nextTick(() => {
        if (endTimeInputRef.value) commentInputRef.value.focus()
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
      t,
      myLTIID,
      formatTime,
      stringToColour,
      formatCreationDate,
      nameAndRole,
      hover,
      menu,
      newComment,
      endTimeInputRef,
      startTimeInputRef,
      commentInputRef,
      editStartTime,
      editEndTime,
      editingEndTime,
      editingStartTime,
      editingComment,
      incorrectStartTime,
      incorrectEndTime,
      baseUrl,
      plusButtonSVG,
      localStartTime,
      localEndTime,
      localAnnotation,
      editMainText,
      validateChanges,
      deleteAnnotation,
    }
  },
})
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style type="postcss" scoped></style>
