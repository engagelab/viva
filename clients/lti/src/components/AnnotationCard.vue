<template>
  <div
    class="relative flex flex-row items-center text-viva-grey-500 bg-viva-grey-400 my-1"
    @mouseover="hover = true"
    @mouseleave="hover = false"
  >
    <div class="flex flex-col flex-grow">
      <div class="flex flex-row">
        <div
          class="p-1 pl-2 flex items-center justify-center text-white font-serious font-medium bg-viva-grey-450 rounded-2xl rounded-r-none cursor-pointer"
        >
          <input
            v-if="editingStartTime"
            ref="startTimeInputRef"
            class="bg-viva-grey-400 text-white text-xsv bg-viva-grey-450 w-14"
            :class="[incorrectStartTime ? 'text-red-600' : '']"
            v-model="localStartTime"
            @keyup.enter="validateChanges(true)"
          />
          <p v-else class="text-xsv" @click="editStartTime()">
            {{ formatTime(annotation.time[0], 0) }}
          </p>
        </div>
        <div
          class="p-1 ml-0.5 pr-2 flex items-center justify-center text-white font-serious font-medium bg-viva-grey-450 rounded-2xl rounded-l-none cursor-pointer"
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
            <p class="text-xsv" v-if="annotation.time[1]">
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
      <div
        class="text-white text-xs font-serious rounded-2xl mt-1 cursor-pointer px-2 py-2"
        :class="[annotation.nowActive ? 'bg-yellow-500' : 'bg-viva-grey-450']"
      >
        <textarea
          v-if="myLTIID === annotation.creator"
          ref="commentInputRef"
          type="text"
          class="w-full bg-transparent"
          :class="[annotation.nowActive ? 'text-black' : 'text-white']"
          placeholder="Add a comment"
          v-model="localAnnotation.comment"
          @input="() => validateChanges(false)"
        />
        <p v-else class="m-3" @click="editComment()">
          {{ annotation.comment }}
        </p>
      </div>
      <div class="flex flex-row justify-end text-xxs p-2">
        <p>{{ formatCreationDate(annotation.created) }}</p>
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
  toRefs,
  watch,
  nextTick,
} from 'vue'
import { useI18n } from 'vue-i18n'
import moment from 'moment'
import { Annotation } from '../types/main'
import { stringToColour, formatTime, formattedTimeToSeconds } from '@/utilities'
import { baseUrl } from '@/constants'
import plusButtonSVG from '@/assets/icons/svg/plus.svg'
import { useAppStore } from '@/store/useAppStore'

const { getters: appGetters } = useAppStore()

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
  name: 'AnnotationCard',
  props: {
    annotation: { type: Object as PropType<Annotation>, required: true },
    upperBound: { type: Number, required: true },
  },
  emits: ['annotate', 'updated'],
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

    const localStartTime = ref(formatTime(annotation.value.time[0]))
    const localEndTime = ref(
      annotation.value.time[1] ? formatTime(annotation.value.time[1]) : ''
    )
    const localAnnotation: Ref<Annotation> = ref({
      _id: annotation.value._id,
      comment: annotation.value.comment,
      time: annotation.value.time,
      created: annotation.value.created,
      creator: annotation.value.creator,
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
      return moment(date).format('MMM Do Y - H:m')
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
      editingStartTime.value = annotation.value.creator === myLTIID
      nextTick(() => {
        if (endTimeInputRef.value) startTimeInputRef.value.focus()
      })
    }
    function editEndTime() {
      editingEndTime.value = annotation.value.creator === myLTIID
      nextTick(() => {
        if (endTimeInputRef.value) endTimeInputRef.value.focus()
      })
    }
    function editComment() {
      editingComment.value = annotation.value.creator === myLTIID
      nextTick(() => {
        if (endTimeInputRef.value) commentInputRef.value.focus()
      })
    }

    return {
      t,
      myLTIID,
      formatTime,
      stringToColour,
      formatCreationDate,
      hover,
      menu,
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
      editComment,
      validateChanges,
    }
  },
})
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style type="postcss" scoped></style>
