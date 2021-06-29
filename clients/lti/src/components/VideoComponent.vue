<template>
  <!--div v-if="selectedVideo && video" class="flex flex-col flex-grow min-h-0 relative"-->
  <div class="flex flex-col flex-grow min-h-0 w-full" v-if="selectedVideo">
    <div
      class="flex flex-col flex-grow min-h-o overflow-y-auto scrolling-touch w-full relative"
    >
      <!--div
            v-show="!selectedVideo.decryptionInProgress"
            id="videoContainer"
            ref="videoContainer"
      -->
      <div class="flex-none bg-black" @click="toggleScreenMode()">
        <video
          :class="fullScreenMode ? 'playbackVideo' : 'playbackVideoSmall'"
          ref="playbackVideo"
          id="playbackVideo"
          oncontextmenu="return false;"
          playsinline
          webkit-playsinline
          preload="metadata"
          :type="videoMimeType"
        >
          <track kind="subtitles" />
        </video>
      </div>
      <!--/div>
          <div v-show="selectedVideo.decryptionInProgress">
            <div>dekryptering..</div>
      </div-->
      <div
        class="flex flex-row flex-grow-0 w-full bg-black py-1 md:py-4 justify-between"
      >
        <div class="flex flex-grow-0 justify-center items-center">
          <div class="mx-4 text-white">{{ playerTime }}</div>
        </div>
        <!--   <div
          class="flex flex-grow justify-center items-center"
          v-if="page === '0'"
        >
          <SVGSymbol
            v-show="!recording"
            applyClasses="w-8 h-8 md:w-12"
            @click="startRecording()"
            width="50"
            symbol="record"
          ></SVGSymbol>
        </div> -->
        <div
          class="flex flex-grow-0 justify-center content-center items-center"
          v-show="videoDataLoaded"
        >
          <SVGSymbol
            v-show="!playing"
            class="pr-4 justify-center content-center"
            applyClasses="w-6 h-8 md:w-12"
            @click="startPlaying()"
            symbol="play"
          ></SVGSymbol>
          <SVGSymbol
            v-show="playing"
            class="pr-4 justify-center content-center"
            applyClasses="w-6 j-8 md:w-12"
            @click="stopPlaying()"
            symbol="stop"
          ></SVGSymbol>
        </div>
        <!--div
          class="text-white"
          style="width:90px;height:50px;"
          v-show="!playing && !videoDataLoaded"
        ></div-->
        <!-- <div
          class="flex flex-grow justify-center items-center"
          style="width: 90px"
        >
          <SVGSymbol
            v-show="!recording"
            @click="deleteDraft($event)"
            applyClasses="w-4 md:w-8"
            symbol="delete"
          ></SVGSymbol>
        </div> -->
      </div>

      <!-- Estimated storage remaining -->
      <!--div v-if="deviceStatus.browser != 'Safari'">
          <span>
            estimert lagring tilgjengelig:
            {{ estimatedStorageRemaining }}%
          </span>
      </div-->

      <div
        class="absolute p-4 top-0 z-10 text-white w-full flex flex-row justify-between"
      >
        <div>
          <!--   <p class="text-sm">{{ datasetName }}</p> -->
          <p v-if="selectedVideo" class="font-vagBold">
            {{ selectedVideo.details.name }}
          </p>
        </div>
      </div>

      <Slider
        class="flex flex-col flex-grow min-h-0"
        :pages="rawPages"
        :movePageTo="page"
        :stateToChildren="stateToChildren"
        @edl-updated="edlUpdated"
      />
    </div>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  Ref,
  computed,
  onMounted,
  watch,
  markRaw,
} from 'vue'
import { Video } from '@/types/main'
import { useAppStore } from '@/store/useAppStore'
import { useVideoStore } from '@/store/useVideoStore'
const { actions: appActions } = useAppStore()
const { actions: videoActions, getters: videoGetters } = useVideoStore()

import Slider from '@/components/base/Slider.vue'
import SVGSymbol from '@/components/base/SVGSymbol.vue'
import edit from './pages/edit.vue'

export default defineComponent({
  name: 'editor',
  components: {
    Slider,
    SVGSymbol,
  },
  props: {
    page: {
      type: String,
      default: '0',
    },
  },
  setup() {
    const rawPages = [markRaw(edit)]
    const selectedVideo = videoGetters.selectedVideo
    const playbackVideo: Ref<HTMLVideoElement | null> = ref(null)
    const video = ref(new Video(selectedVideo.value))
    const videoUrl = ref('')
    const fullScreenMode = ref(true)
    const stateToChildren = ref({
      playerCurrentTime: '0',
    })
    const playing = ref(false)
    const videoDataLoaded = ref(false)

    let playerLowerBound = 0 // Time >= 0 when video should start playing, when using the scrubber
    let playerUpperBound = 0 // Time <= player end time when video should stop playing, when using the scrubber
    let currentVolume = 0
    let playerCurrentTime = ref('0')
    let videoWasReplaced = false

    document.addEventListener('fullscreenchange', () => {
      // document.fullscreenElement will point to the element that
      // is in fullscreen mode if there is one. If not, the value
      // of the property is null.
      appActions.setFullScreen(!!document.fullscreenElement)
    })

    // Lifecycle Hooks

    onMounted(() => {
      if (!selectedVideo.value) {
        // No need to push
        //wait for fetch?
        console.log('Video is undefined')
      } else {
        setupVideo(selectedVideo.value)
        videoDataLoaded.value = false
        videoWasReplaced = false
      }
    })

    /* onUpdated(() => {
      if (reloadVideo) {
        reloadVideo = false
        loadPlayerWithVideo()
      }
    }) */

    // Computed values

    /* const datasetName = computed(() => {
      if (selectedVideo.value && selectedVideo.value.dataset.selection) {
        const utvalg = selectedVideo.value.dataset.selection.reduce(
          (acc, curr) => {
            return `${acc} > ${curr.title}`
          },
          ''
        )
        return `${selectedVideo.value.dataset.name} ${utvalg}`
      } else {
        return ''
      }
    }) */

    const playerTime = computed(() => {
      const timeAsInt = parseInt(playerCurrentTime.value)
      let minutes = Math.floor(timeAsInt / 60)
      // prettier-ignore
      let seconds = minutes > 0 ? timeAsInt % (60 * minutes) : timeAsInt;
      let milliseconds = timeAsInt.toFixed(2)
      milliseconds = milliseconds.substring(milliseconds.length - 2)
      const minutesString = minutes > 9 ? minutes : '0' + minutes
      const secondsString = seconds > 9 ? seconds : '0' + seconds
      return `${minutesString}:${secondsString}.${milliseconds}`
    })

    // Always video/mp4
    const videoMimeType = computed(() => {
      return 'video/mp4'
    })

    const hasNewDataAvailable = computed(() => {
      return selectedVideo.value
        ? selectedVideo.value.status.hasNewDataAvailable
        : false
    })

    watch(
      () => hasNewDataAvailable.value,
      (newValue) => {
        if (newValue) loadPlayerWithVideo()
      }
    )
    watch(
      () => selectedVideo.value,
      (newValue) => {
        if (newValue) setupVideo(newValue)
      }
    )

    // METHODS

    function toggleScreenMode(): void {
      fullScreenMode.value = !fullScreenMode.value
    }

    /* function confirmDeleteModalDone(confirmed: boolean) {
      notifyActions.setDialog({
        visible: false,
        data: {},
        doneCallback: () => ({}),
      })
      if (confirmed && selectedVideo.value) {
        videoActions
          .removeVideo(selectedVideo.value)
          .then(() => {
            appActions.removeDraftId(video.value.details.id)
            return appActions.updateUserAtServer().then(() => {
              console.log(`Removed a draft video: ${video.value.details.id}`)
            })
          })
          .then(() => {
            router.push('/videos/list')
          })
      }
    } */

    /*  function deleteDraft(event: Event): void {
      event.stopPropagation()
      notifyActions.setDialog({
        visible: true,
        data: {
          titleText: 'Advarsel',
          messageText:
            'Vennligst bekreft at du vil slette videoen. Det kan ikke bli ugjort!',
          cancelText: 'avbryt',
          confirmText: 'bekreft',
        },
        doneCallback: confirmDeleteModalDone,
      })
    } */

    // Event handler for Edit Decision List updates
    function edlUpdated(d: { type: string; newValue: number[] }) {
      const player: HTMLVideoElement | null = playbackVideo.value
      if (player) {
        if (
          d.type == 'trim' &&
          !isNaN(player.duration) &&
          player.duration >= d.newValue[1]
        ) {
          playerUpperBound = d.newValue[1]
          playerLowerBound = d.newValue[0]
          player.currentTime = playerLowerBound
        } else if (d.type == 'move' && player.duration >= d.newValue[0]) {
          player.currentTime = d.newValue[0]
        }
        playerCurrentTime.value = player.currentTime.toString()
      }
    }

    // Called on initialisation of this view to create placeholder for edited data
    function setupVideo(chosenVideo: Video): void {
      // Create a video placeholder that can be modifed by the user
      const player: HTMLVideoElement | null = playbackVideo.value
      video.value = new Video(chosenVideo)
      if (chosenVideo && player) {
        video.value.updateAll(chosenVideo)
        setPlayerBounds()
        loadPlayerWithVideo()
      }
    }

    function timeIsMasked(currentTime: number): boolean {
      return video.value.details.edl.blur.some(
        (blur) => currentTime >= blur[0] && currentTime <= blur[1]
      )
    }

    function setPlayerBounds(): void {
      const player: HTMLVideoElement | null = playbackVideo.value
      const edl = video.value.details.edl
      if (player && edl) {
        if (edl.trim.length > 1) {
          playerLowerBound = edl.trim[0]
          playerUpperBound = edl.trim[1]
          player.currentTime = playerLowerBound
        }
        if (timeIsMasked(player.currentTime)) {
          player.style.filter = 'blur(15px)'
        } else {
          player.style.filter = 'blur(0)'
        }
      }
    }

    function onTimeUpdate() {
      const player: HTMLVideoElement | null = playbackVideo.value
      let trim = video.value.details.edl.trim.length > 0
      let mask = video.value.details.edl.blur.length > 0
      if (player) {
        playerCurrentTime.value = player.currentTime.toString()
        stateToChildren.value.playerCurrentTime = playerCurrentTime.value
        if (
          player.currentTime >= playerUpperBound ||
          (trim && player.currentTime >= video.value.details.edl.trim[1])
        ) {
          stopPlaying()
        } else if (mask) {
          let blurOn = timeIsMasked(player.currentTime)
          if (blurOn) {
            player.muted = true
            player.style.filter = 'blur(15px)'
          } else {
            player.muted = false
            player.style.filter = 'blur(0)'
          }
        }
      }
    }

    function startPlaying() {
      const player: HTMLVideoElement | null = playbackVideo.value
      setPlayerBounds()
      if (player) {
        currentVolume = player.volume
        if (playing.value) {
          player.pause()
          playing.value = false
        } else {
          playing.value = true
          player.addEventListener('timeupdate', onTimeUpdate)
          player.play()
        }
      }
    }

    function stopPlaying() {
      const player: HTMLVideoElement | null = playbackVideo.value
      if (player) {
        player.pause()
        player.volume = currentVolume
        playing.value = false
        player.currentTime = playerLowerBound
        playerCurrentTime.value = player.currentTime.toString()
        stateToChildren.value.playerCurrentTime = playerCurrentTime.value
        if (timeIsMasked(player.currentTime)) {
          player.style.filter = 'blur(15px)'
        } else {
          player.style.filter = 'blur(0)'
        }
        player.removeEventListener('timeupdate', onTimeUpdate)
      }
    }

    // Load the player with video data from a new result
    // or reload it from store if reloadingFromStore == true
    // reloadingFromStore is true / triggered after the video data has been decrypted
    // or after returning to the video from the list
    function loadPlayerWithVideo(): void {
      const player: HTMLVideoElement | null = playbackVideo.value
      if (player && video.value) {
        const dataLoaded = () => {
          playerUpperBound = player.duration
          video.value.details.duration = player.duration
          // We need to save the latest duration
          videoActions.updateMetadata(video.value).then(() => {
            // But if this is new video replacing an old, the unsavedChanges must be set true to request 'samtykker' acceptance
            if (videoWasReplaced)
              videoActions.setUnsavedChanges(video.value.details.id)
          })
          setPlayerBounds()
          player.removeEventListener('loadeddata', dataLoaded)
          videoDataLoaded.value = true
        }

        player.addEventListener('loadeddata', dataLoaded)
        player.addEventListener('ended', stopPlaying, false)

        /*  const data = videoGetters.videoData(selectedVideo.value.details.id) // Ensure chunks exist
        if (data.value) {
          console.log(data.val)
          // <- MediaFile */
        const objectURL = 'https://localhost:8000/sampleClip.mp4'
        /* if (player.srcObject) player.srcObject = 'https://localhost:8000/sampleClip.mp4' */
        player.setAttribute('src', objectURL + '#t=0.1')
        //set the media bounds in the dataLoaded function..
        player.load()
        console.log()
        /*  } */
      }
    }

    /* function startRecording() {
      if (video.value.details.duration > 0) {
        notifyActions.setDialog({
          visible: true,
          data: {
            titleText: 'Advarsel',
            messageText:
              'Vennligst bekreft at du vil overskrive videoen. Det kan ikke bli ugjort!',
            cancelText: 'avbryt',
            confirmText: 'bekreft',
          },
          doneCallback: confirmRecordingModalDone,
        })
      } else {
        recordVideo()
      }
    } */

    /*  function confirmRecordingModalDone(confirmed: boolean): void {
      notifyActions.setDialog({
        visible: false,
        data: {},
        doneCallback: () => ({}),
      })
      if (confirmed) {
        recordVideo()
      }
    } */

    // Begin recording
    /*  async function recordVideo() {
      // Make sure EDL is cleared if it is
      video.value.details.edl = {
        trim: [],
        blur: [],
      }
      videoWasReplaced = true

      // Call the device camera. Video will be stored under the name: video.details.id
      videoActions.replaceDraftVideo(video.value.details.id).then(() => {

      })
    } */

    return {
      // methods
      stopPlaying,
      startPlaying,
      toggleScreenMode,
      /*  startRecording,
      deleteDraft, */
      // data
      selectedVideo,
      /*  datasetName, */
      playerTime,
      videoMimeType,
      edlUpdated,
      stateToChildren,
      rawPages,
      playbackVideo,
      videoUrl,
      // booleans
      videoDataLoaded,
      playing,
      fullScreenMode,
    }
  },
})
</script>
<style scoped>
.layout {
  background: #f5f7f9;
  position: relative;
  border-radius: 4px;
  overflow: hidden;
}
.playbackVideo {
  margin: 0;
  width: 100%;
  background-color: green;
  z-index: 1;
}
.playbackVideoSmall {
  margin: auto;
  width: 50%;
  background-color: green;
  z-index: 1;
}
/* video::-webkit-media-controls-enclosure {
  display: none !important;
} */
#videoContainer {
  position: relative;
  box-sizing: border-box;
  height: 100%;
  overflow: hidden;
  width: 100%;
}
</style>
