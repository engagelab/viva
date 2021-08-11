<template>
  <div
    class="flex flex-col flex-grow min-h-0 w-full"
    v-if="selectedVideo"
    :key="selectedVideo.details.id"
  >
    <div
      class="flex flex-col flex-grow min-h-o overflow-y-auto scrolling-touch w-full relative"
    >
      <div class="flex-none bg-black" @click="toggleScreenMode()">
        <video
          :class="fullScreenMode ? 'playbackVideo' : 'playbackVideoSmall'"
          ref="playbackVideo"
          id="playbackVideo"
          oncontextmenu="return false;"
          :src="`https://localhost:8000/api/video/file?videoref=${selectedVideo.details.id}`"
          playsinline
          webkit-playsinline
          preload="metadata"
          :type="videoMimeType"
        >
          <track kind="subtitles" />
        </video>
      </div>

      <div
        class="flex flex-row flex-grow-0 w-full bg-black py-1 md:py-4 justify-between"
      >
        <div class="flex flex-grow-0 justify-center items-center">
          <div class="mx-4 text-white">{{ playerTime }}</div>
        </div>

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
      </div>

      <div
        class="absolute p-4 top-0 z-10 text-white w-full flex flex-row justify-between"
      >
        <div>
          <p v-if="selectedVideo" class="font-vagBold">
            {{ selectedVideo.details.name }}
          </p>
        </div>
      </div>

      <Edit :stateFromParent="stateToChildren" @edl-updated="edlUpdated" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, Ref, computed, onMounted, watch } from 'vue'
import { Video } from '@/types/main'
import { useVideoStore } from '@/store/useVideoStore'
const { actions: videoActions, getters: videoGetters } = useVideoStore()

import SVGSymbol from '@/components/base/SVGSymbol.vue'
import Edit from './pages/edit.vue'

export default defineComponent({
  name: 'editor',
  components: {
    SVGSymbol,
    Edit,
  },
  props: {
    page: {
      type: String,
      default: '0',
    },
  },
  setup() {
    const selectedVideo = videoGetters.selectedVideo
    const playbackVideo: Ref<HTMLVideoElement | null> = ref(null)
    const video = ref(new Video().updateFromVideo(selectedVideo.value))
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

    // Lifecycle Hooks

    onMounted(() => {
      if (!selectedVideo.value) {
        console.log('Video is undefined')
      } else {
        setupVideo(selectedVideo.value)
      }
    })

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
        if (newValue) {
          setupVideo(newValue)
        }
      }
    )

    // METHODS

    function toggleScreenMode(): void {
      fullScreenMode.value = !fullScreenMode.value
    }

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
      // reset states
      videoDataLoaded.value = false

      // Create a video placeholder that can be modifed by the user
      const player: HTMLVideoElement | null = playbackVideo.value
      video.value = new Video().updateFromVideo(chosenVideo)
      if (chosenVideo && player) {
        video.value.updateFromVideo(chosenVideo)
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
          videoActions.updateMetadata(video.value)
          setPlayerBounds()
          player.removeEventListener('loadeddata', dataLoaded)
          videoDataLoaded.value = true
        }

        player.addEventListener('loadeddata', dataLoaded)
        player.addEventListener('ended', stopPlaying, false)
      }
    }

    return {
      // methods
      stopPlaying,
      startPlaying,
      toggleScreenMode,
      // data
      selectedVideo,
      playerTime,
      videoMimeType,
      edlUpdated,
      stateToChildren,
      playbackVideo,
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
