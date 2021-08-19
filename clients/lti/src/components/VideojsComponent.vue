<template>
  <div
    class="flex flex-col flex-grow w-full"
    v-if="selectedVideo"
    :key="selectedVideo.details.id"
  >
    <div class="flex flex-col flex-grow scrolling-touch w-full relative">
      <div class="flex-none bg-black" @click="toggleScreenMode()">
        <video class="video-js" ref="smplayer" id="smplayer">
          <source
            :src="`https://localhost:8000/api/video/file?videoref=${selectedVideo.details.id}`"
            type="video/mp4"
          />
        </video>
      </div>

      <div
        class="flex flex-row flex-grow-0 w-full bg-black py-1 md:py-4 justify-between"
      >
        <div class="flex flex-grow-0 justify-center items-center">
          <div class="mx-4 text-white">{{ playerTime }}</div>
        </div>
      </div>
    </div>

    <!-- <div v-for="(share, index) in video.users.sharing" :key="index">
      <Share
        class="bg-blue-200 p-2"
        :share="share"
        :videoCurrentTime="playerCurrentTime"
        :videoDuration="duration"
        @updated="(share) => updateShare(share, index)"
        @deleted="deleteShare(index)"
      ></Share>
    </div> -->
    <!-- <div class="flex m-4">
      <Button
        class="bg-blue-400 self-center rounded-lg"
        id="button-accept"
        @click="addGroupShare"
        >+ Add new group share
      </Button>
    </div> -->
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, Ref, computed, onMounted, watch } from 'vue'
import { Video, VideoSharing } from '@/types/main'
import { useVideoStore } from '@/store/useVideoStore'
const { actions: videoActions, getters: videoGetters } = useVideoStore()
import videojs, { VideoJsPlayer } from 'video.js'
// import Button from '@/components/base/Button.vue'
// import SVGSymbol from '@/components/base/SVGSymbol.vue'
// import Scrubber from '@/components/base/Scrubber.vue'
// import Share from '@/components/Share.vue'

export default defineComponent({
  name: 'videojsComponent',
  components: {
    // Button,
    // Scrubber,
    // Share,
    // SVGSymbol,
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
    const moveScrubber = ref(0)
    const step = 0.01
    const playing = ref(false)
    const videoDataLoaded = ref(false)

    let playerLowerBound = 0 // Time >= 0 when video should start playing, when using the scrubber
    let playerUpperBound = 0 // Time <= player end time when video should stop playing, when using the scrubber
    let currentVolume = 0
    let playerCurrentTime = ref(0)

    const videoJsplayer: Ref<VideoJsPlayer | null> = ref(null)

    // Test

    // Lifecycle Hooks

    onMounted(() => {
      if (!selectedVideo.value) {
        console.log('Video is undefined')
      } else {
        setupVideo(selectedVideo.value)
      }
      const videoPlayer = document.getElementById('smplayer')
      if (videoPlayer) {
        videoJsplayer.value = videojs(
          videoPlayer,
          {},
          function onPlayerReady() {
            console.log('onPlayerReady', this)
          }
        )
      }
    })

    const duration = computed(() => {
      return selectedVideo.value ? selectedVideo.value.details.duration : 0
    })

    const scrubberMax = computed(() => {
      return video.value.details.edl.trim[1] || duration.value
    })

    const scrubberMin = computed(() => {
      return video.value.details.edl.trim[0] || 0
    })

    const playerTime = computed(() => {
      const timeAsInt = playerCurrentTime.value
      let minutes = Math.floor(timeAsInt / 60)
      // prettier-ignore
      let seconds = minutes > 0 ? timeAsInt % (60 * minutes) : Math.floor(timeAsInt)
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
    const addGroupShare = () => {
      const newShare: VideoSharing = {
        users: [],
        access: false,
        description: '',
        edl: {
          trim: [0, duration.value],
          blur: [],
        },
      }
      video.value.users.sharing.push(newShare)
    }
    const updateShare = (share: VideoSharing, index: number) => {
      const s = video.value.users.sharing[index]
      s.users = share.users
      s.access = share.access
      s.description = share.description
      s.edl = share.edl
      videoActions.updateVideoMetaData(selectedVideo.value as Video)
    }
    const deleteShare = (index: number) => {
      video.value.users.sharing.splice(index, 1)
      videoActions.updateVideoMetaData(selectedVideo.value as Video)
    }

    function toggleScreenMode(): void {
      fullScreenMode.value = !fullScreenMode.value
    }

    // Event handler for Edit Decision List updates
    function edlUpdated(type: string, newValue: number[]) {
      const player: HTMLVideoElement | null = playbackVideo.value
      if (player) {
        if (
          type == 'trim' &&
          !isNaN(player.duration) &&
          player.duration >= newValue[1]
        ) {
          playerUpperBound = newValue[1]
          playerLowerBound = newValue[0]
          player.currentTime = playerLowerBound
        } else if (type == 'move' && player.duration >= newValue[0]) {
          player.currentTime = newValue[0]
        }
        playerCurrentTime.value = player.currentTime
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
        playerCurrentTime.value = player.currentTime
        moveScrubber.value = playerCurrentTime.value
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
        playerCurrentTime.value = player.currentTime
        moveScrubber.value = playerCurrentTime.value
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
      // computed
      duration,
      scrubberMax,
      scrubberMin,
      // methods
      stopPlaying,
      startPlaying,
      toggleScreenMode,
      addGroupShare,
      updateShare,
      deleteShare,
      // data
      selectedVideo,
      video,
      playerTime,
      videoMimeType,
      edlUpdated,
      playbackVideo,
      playerCurrentTime,
      moveScrubber,
      step,
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
