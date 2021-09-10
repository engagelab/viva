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
            class="absolute top-4 right-4 z-10"
            :childclass="'w-24 h-10'"
            :backgroundcolour="'bg-viva-grey-450'"
            :textcolour="'text-white'"
            @vclick.stop="() => (showAnnotations = !showAnnotations)"
          >
            Annotate
          </Button>
          <Player @currenttime="(time) => (currentPlayerTime = time)" />
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
          class="bg-viva-grey-400 text-viva-grey-500 rounded-xl ml-2 h-full flex flex-col"
          v-if="showAnnotations"
        >
          <p class="px-4 pt-4 text-white">Annotations</p>
          <input
            class="m-3 p-3 bg-viva-grey-450 text-white text-xs focus:bg-viva-grey-450 rounded-full"
            placeholder="Write a comment"
            v-model="annotationText"
            @keyup.enter="addAnnotation()"
          />
          <AnnotationCard
            class="mx-3"
            v-for="a in annotations"
            :key="a._id"
            :annotation="a"
            @updated="updateAnnotation"
          />
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import { defineComponent, ref, ComputedRef, computed } from 'vue'
import { useAppStore } from '@/store/useAppStore'
import { useVideoStore } from '@/store/useVideoStore'
import { Annotation } from '@/types/main'
import { stringToColour, formatDate } from '@/utilities'
import { baseUrl, VIDEO_DETAIL_MODE } from '@/constants'
import trimButtonSVG from '@/assets/icons/svg/trim.svg'
import playButtonSVG from '@/assets/icons/svg/play.svg'
import Player from '@/views/Player.vue'
import AnnotationCard from '@/components/AnnotationCard.vue'
import Button from '@/components/base/Button.vue'

const { getters: appGetters } = useAppStore()
const { getters: videoGetters, actions: videoActions } = useVideoStore()

export default defineComponent({
  name: 'Annotate',
  components: {
    Button,
    Player,
    AnnotationCard,
  },
  setup() {
    const selectedItemShare = videoGetters.selectedItemShare
    const showUsers = ref(false)
    const showAnnotations = ref(false)
    const currentPlayerTime = ref(0)
    const sortByCreated = ref(false)
    const annotationText = ref('')
    const videoCurrentTime = ref(0)
    const myLTIID = appGetters.user.value.profile.ltiID

    function editShare() {
      if (selectedItemShare.value) {
        videoActions.selectShare(selectedItemShare.value)
        videoActions.detailMode(VIDEO_DETAIL_MODE.share, VIDEO_DETAIL_MODE.none)
      }
    }

    const addAnnotation = function () {
      const newAnnotation: Annotation = {
        created: new Date(),
        creator: myLTIID,
        comment: annotationText.value,
        time: [currentPlayerTime.value],
        nowActive: false,
      }
      // videoActions.createAnnotation(selectedItemShare.value, newAnnotation)
      annotationText.value = ''
    }

    const updateAnnotation = function (update: Annotation) {
      // videoActions.updateAnnotation(selectedItemShare.value, update)
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
              (a.time[1] && a.time[1] > t && a.time[0] <= t) ||
              (tDiff <= t1DisplayPeriod && tDiff >= 0)
            return a
          })
      )
    })

    return {
      VIDEO_DETAIL_MODE,
      baseUrl,
      myLTIID,
      selectedItemShare,
      stringToColour,
      formatDate,
      annotations,
      annotationText,
      showUsers,
      showAnnotations,
      editShare,
      currentPlayerTime,
      addAnnotation,
      updateAnnotation,
      videoCurrentTime,
      detailMode: videoGetters.detailMode,

      // assets
      trimButtonSVG,
      playButtonSVG,
    }
  },
})
</script>
