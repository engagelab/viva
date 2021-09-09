<template>
  <div
    class="relative flex flex-row items-center text-viva-grey-500 bg-viva-grey-400 my-1"
    @mouseover="hover = true"
    @mouseleave="hover = false"
  >
    <div class="flex flex-col flex-grow">
      <div class="flex flex-row">
        <div
          class="p-1 pl-2 flex flex-col justify-middle text-white text-sm bg-viva-grey-450 rounded-2xl rounded-r-none cursor-pointer"
        >
          <input
            v-if="editingStartTime"
            class="bg-viva-grey-400 text-white focus:bg-viva-grey-450 w-16 px-1"
            placeholder="..:..:.."
            v-model="localStartTime"
            @keyup.enter="validateTime()"
          />
          <p
            class="text-center leading-2"
            v-else
            @click="editingStartTime = !editingStartTime"
          >
            {{ formatTime(annotation.time[0], 0) }}
          </p>
        </div>
        <div
          class="ml-1 p-1 pr-3 flex flex-col justify-middle text-white text-sm bg-viva-grey-450 rounded-2xl rounded-l-none cursor-pointer"
          @click="editingEndTime = !editingEndTime"
        >
          <div v-if="editingEndTime"></div>
          <div v-else class="flex flex-col items-center">
            <p class="text-center leading-2" v-if="annotation.time[1]">
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
        class="text-white text-xs focus:bg-viva-grey-450 rounded-2xl mt-1"
        :class="[annotation.nowActive ? 'bg-yellow-500' : 'bg-viva-grey-450']"
      >
        <p class="p-3">
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
import { defineComponent, PropType, ref, toRefs, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import moment from 'moment'
import { Annotation } from '../types/main'
import { stringToColour, formatTime, formattedTimeToSeconds } from '@/utilities'
import { baseUrl } from '@/constants'
import plusButtonSVG from '@/assets/icons/svg/plus.svg'

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
  },
  emits: ['annotate', 'timeupdate'],
  setup(props, context) {
    const { t } = useI18n({ messages })
    const { annotation } = toRefs(props)
    const hover = ref(false)
    const menu = ref(false)
    const editingEndTime = ref(false)
    const editingStartTime = ref(false)

    const localStartTime = ref(formatTime(annotation.value.time[0]))
    const localEndTime = ref(
      annotation.value.time[1] ? formatTime(annotation.value.time[1]) : ''
    )

    watch(
      () => annotation.value.time,
      (newTime) => {
        localStartTime.value = formatTime(newTime[0])
        localEndTime.value = newTime[1] ? formatTime(newTime[1]) : ''
      }
    )

    function formatCreationDate(date: Date) {
      return moment(date).format('MMM Do Y - H:m')
    }

    function validateTime() {
      const regex = /^\d?:\d{2}:\d{2}$/
      if (
        localStartTime.value.match(regex) &&
        localEndTime.value.match(regex)
      ) {
        const startTime: number = formattedTimeToSeconds(localStartTime.value)
        const endTime: number = formattedTimeToSeconds(localEndTime.value)
        context.emit('timeupdate', [startTime, endTime])
      }
    }

    return {
      t,
      formatTime,
      stringToColour,
      formatCreationDate,
      hover,
      menu,
      editingEndTime,
      editingStartTime,
      baseUrl,
      plusButtonSVG,
      localStartTime,
      localEndTime,
      validateTime,
    }
  },
})
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style type="postcss" scoped></style>
