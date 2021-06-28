<template>
  <div class="flex flex-col flex-grow min-h-0 w-full">
    <div
      class="flex flex-col flex-grow min-h-o overflow-y-auto scrolling-touch w-full relative"
    >
      <div class="flex-none bg-black">
        <video
          class="playbackVideoSmall"
          ref="playbackVideo"
          id="playbackVideo"
          oncontextmenu="return false;"
          :src="
            sampleMovie ? 'https://localhost:8000/sampleClip.mp4' : getVideoFile
          "
          playsinline
          webkit-playsinline
          preload="metadata"
          :type="'video/mp4'"
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
        </div>
        <div
          class="flex flex-grow-0 justify-center content-center items-center"
          v-show="videoDataLoaded"
        >
          <SVGSymbol
            v-show="!recording && !playing"
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

        <div
          class="flex flex-grow justify-center items-center"
          style="width: 90px"
        >
          <SVGSymbol
            v-show="!recording"
            applyClasses="w-4 md:w-8"
            symbol="delete"
          ></SVGSymbol>
        </div>
      </div>

      <div
        class="absolute p-4 top-0 z-10 text-white w-full flex flex-row justify-between"
      >
        <!-- <div>
          <p class="text-sm">{{ datasetName }}</p>
          <p v-if="selectedVideo" class="font-vagBold">
            {{ selectedVideo.details.name }}
          </p>
        </div> -->

        <!--  <Edit /> -->
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, Ref, computed, onMounted, onUpdated } from 'vue'

import { Video } from '@/types/main'
import SVGSymbol from '@/components/base/SVGSymbol.vue'
/* import Edit from '../views/pages/edit.vue' */

import { useVideoStore } from '../store/useVideoStore'

export default defineComponent({
  name: 'editor',
  components: {
    SVGSymbol,
    /* Edit, */
  },
  props: {
    page: {
      type: String,
      default: '0',
    },
  },
  setup() {
    const { getters: videoGetters } = useVideoStore()

    const playbackVideo: Ref<HTMLVideoElement | null> = ref(null)

    const selectedVideo = computed(() => videoGetters.selectedVideo.value)
    const video = ref(new Video())
    const sampleMovie = ref(false)
    const stateToChildren = ref({
      playerCurrentTime: '0',
    })
    const recording = ref(false)
    const playing = ref(false)
    const videoDataLoaded = ref(false)

    let playerLowerBound = 0 // Time >= 0 when video should start playing, when using the scrubber
    let playerUpperBound = 0 // Time <= player end time when video should stop playing, when using the scrubber
    let currentVolume = 0
    let playerCurrentTime = ref('0')
    /* let videoWasReplaced = false */
    let reloadVideo = false
    // Lifecycle Hooks

    onMounted(() => {
      setupVideo(video.value)

      reloadVideo = true
      videoDataLoaded.value = false
      /*       videoWasReplaced = false */
    })

    onUpdated(() => {
      if (reloadVideo) {
        reloadVideo = false
        loadPlayerWithVideo()
      }
    })

    // Computed values

    const playerTime = computed(() => {
      if (recording.value) {
        return '--:--.-'
      } else {
        const timeAsInt = parseInt(playerCurrentTime.value)
        let minutes = Math.floor(timeAsInt / 60)
        // prettier-ignore
        let seconds = minutes > 0 ? timeAsInt % (60 * minutes) : timeAsInt;
        let milliseconds = timeAsInt.toFixed(2)
        milliseconds = milliseconds.substring(milliseconds.length - 2)
        const minutesString = minutes > 9 ? minutes : '0' + minutes
        const secondsString = seconds > 9 ? seconds : '0' + seconds
        return `${minutesString}:${secondsString}.${milliseconds}`
      }
    })

    // METHODS

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
      video.value = new Video(chosenVideo)
      if (chosenVideo) {
        if (process.env.NODE_ENV === 'development') {
          sampleMovie.value = false
          video.value.status.recordingExists = true
        }
        video.value.updateAll(chosenVideo)
        setPlayerBounds()
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
          /*  videoActions.updateMetadata(video.value).then(() => {
            // But if this is new video replacing an old, the unsavedChanges must be set true to request 'samtykker' acceptance
            if (videoWasReplaced)
              videoActions.setUnsavedChanges(video.value.details.id)
          }) */
          setPlayerBounds()
          player.removeEventListener('loadeddata', dataLoaded)
          videoDataLoaded.value = true
        }

        player.addEventListener('loadeddata', dataLoaded)
        player.addEventListener('ended', stopPlaying, false)

        /*   const data = videoGetters.videoDataFile(selectedVideo.value.details.id) // Ensure chunks exist */
      }
    }

    // Get video
    const getVideoFile = computed(() => {
      /* const videoKind = selectedVideo.value?.storages[0].kind */
      const videoPath = selectedVideo.value?.storages[0].path
      console.log(videoPath)
      return videoPath
    })

    return {
      // methods
      stopPlaying,
      startPlaying,
      // data
      playerTime,
      edlUpdated,
      stateToChildren,
      sampleMovie,
      playbackVideo,
      // booleans
      videoDataLoaded,
      recording,
      playing,
      //computed
      selectedVideo,
      getVideoFile,
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
