<template>
  <div
    class="flex flex-col w-full bg-viva-grey-400 rounded-xl w-auto lg:w-192"
    v-if="selectedItem"
    :key="selectedItem.video.details.id"
    @click.prevent.self
  >
    <div class="flex flex-col scrolling-touch w-full relative">
      <div class="flex-none">
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

      <div class="absolute bottom-0 flex flex-col w-full">
        <Slider
          class="progress-slider top-0 left-0 w-full"
          v-model="playerCurrentTime"
          :format="formatProgressTooltip"
          :max="scrubberMax"
          :min="scrubberMin"
          @change="adjustProgress"
        />
        <div
          class="flex flex-row flex-grow self-end w-full py-1 px-6 md:py-4 items-center bg-gradient-to-b from-transparent to-black"
        >
          <div
            v-show="!playing"
            class="flex items-center justify-center w-10 h-10 rounded-full p-3 pl-4 mr-2 border"
            @click.stop="startPlaying()"
          >
            <img :src="playButtonSVG" alt="play-button" />
          </div>
          <div
            v-show="playing"
            class="flex items-center justify-center w-10 h-10 rounded-full p-3.5 mr-2 border"
            @click.stop="pausePlaying()"
          >
            <img :src="pauseButtonSVG" alt="pause-button" />
          </div>
          <div class="mx-4 text-white">{{ playerTime }}</div>
          <div class="flex flex-grow flex-row justify-end">
            <div
              class="relative flex w-6 h-6 mr-6"
              @click.stop="volumeMenu = !volumeMenu"
            >
              <div
                v-show="volumeMenu"
                class="flex flex-row items-start pt-3 justify-center absolute -bottom-3 -left-3 h-32 w-12 rounded-full bg-white bg-opacity-10"
              >
                <Slider
                  class="volume-slider"
                  orientation="vertical"
                  direction="rtl"
                  step="-1"
                  :format="formatVolumeTooltip"
                  :min="0"
                  :max="1"
                  v-model="volumeLevel"
                />
              </div>
              <img
                v-if="volumeLevel > 0"
                :src="soundOnButtonSVG"
                alt="volumeOn-button"
              />
              <img v-else :src="soundOffButtonSVG" alt="volumeOff-button" />
            </div>
            <div class="flex w-6 h-6" @click.stop="toggleScreenMode()">
              <img :src="fullscreenButtonSVG" alt="fullscreen-button" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, Ref, computed, onMounted } from 'vue'
import { Video } from '@/types/main'
import { useVideoStore } from '@/store/useVideoStore'
const { actions: videoActions, getters: videoGetters } = useVideoStore()
import { baseUrl, VIDEO_DETAIL_MODE } from '@/constants'
import playButtonSVG from '@/assets/icons/svg/play.svg'
import pauseButtonSVG from '@/assets/icons/svg/pause.svg'
import fullscreenButtonSVG from '@/assets/icons/svg/scale_up.svg'
import soundOnButtonSVG from '@/assets/icons/svg/sound_on.svg'
import soundOffButtonSVG from '@/assets/icons/svg/sound_off.svg'
import Slider from '@vueform/slider'

export default defineComponent({
  name: 'Player',
  components: {
    Slider,
  },
  emits: ['currenttime', 'duration'],
  setup(props, context) {
    const selectedItem = videoGetters.selectedItem
    const playbackVideo: Ref<HTMLVideoElement | null> = ref(null)
    const video: Ref<Video> = ref(new Video())
    if (selectedItem.value) {
      video.value = new Video().updateFromVideo(selectedItem.value.video)
    }
    const formatVolumeTooltip = function (value: number) {
      return Math.floor(value * 100)
    }
    const formatProgressTooltip = function (value: number) {
      return formatTime(value)
    }
    const fullScreenMode = ref(false)
    const moveScrubber = ref(0)
    const volumeLevel = ref(0)
    const volumeMenu = ref(false)
    const trim = ref([0, 0])
    const step = 0.01
    const playing = ref(false)

    let playerLowerBound = 0 // Time >= 0 when video should start playing, when using the scrubber
    let playerUpperBound = 0 // Time <= player end time when video should stop playing, when using the scrubber
    let currentVolume = ref(0)
    let playerCurrentTime = ref(0)

    onMounted(() => {
      if (!selectedItem.value) {
        console.log('Sharable Video is undefined')
      } else {
        setupVideo(selectedItem.value.video)
      }
    })

    const duration = computed(() => {
      return selectedItem.value ? selectedItem.value.video.details.duration : 0
    })

    const scrubberMax = computed(() => {
      return video.value.details.edl.trim[1] || duration.value
    })

    const scrubberMin = computed(() => {
      return video.value.details.edl.trim[0] || 0
    })

    // Input time as a number - seconds as whole with milliseconds as the decimal e.g. 12.65 = 12 seconds 650 milliseconds
    function formatTime(timeInSeconds: number): string {
      let minutes = Math.floor(timeInSeconds / 60)
      let hours = Math.floor(minutes / 60)
      // prettier-ignore
      minutes = hours > 0 ? Math.floor(minutes % (60 * hours)) : minutes
      let seconds =
        minutes > 0
          ? Math.floor(timeInSeconds % (60 * minutes + 60 * 60 * hours))
          : Math.floor(timeInSeconds)
      const minutesString = minutes > 9 ? minutes : '0' + minutes
      const secondsString = seconds > 9 ? seconds : '0' + seconds
      return `${hours}:${minutesString}:${secondsString}`
    }

    const playerTime = computed(() => {
      const currentTime = formatTime(playerCurrentTime.value)
      const totalTime = formatTime(duration.value)
      return `${currentTime} / ${totalTime}`
    })

    // Always video/mp4
    const videoMimeType = computed(() => {
      return 'video/mp4'
    })

    function adjustVolume(level: number): void {
      const player: HTMLVideoElement | null = playbackVideo.value
      if (player) player.volume = level
    }

    function adjustProgress(value: number): void {
      const player: HTMLVideoElement | null = playbackVideo.value
      if (player) player.currentTime = value
    }

    function toggleScreenMode(): void {
      const player: HTMLVideoElement | null = playbackVideo.value
      if (player && !fullScreenMode.value) player.requestFullscreen()
      else document.exitFullscreen()
      // fullScreenMode.value = !fullScreenMode.value
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
        context.emit('currenttime', player.currentTime)
      }
    }

    // Called on initialisation of this view to create placeholder for edited data
    function setupVideo(chosenVideo: Video): void {
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
        context.emit('currenttime', player.currentTime)
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
        currentVolume.value = player.volume
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
        player.volume = currentVolume.value
        playing.value = false
        player.currentTime = playerLowerBound
        playerCurrentTime.value = player.currentTime
        moveScrubber.value = playerCurrentTime.value
        context.emit('currenttime', player.currentTime)
        if (timeIsMasked(player.currentTime)) {
          player.style.filter = 'blur(15px)'
        } else {
          player.style.filter = 'blur(0)'
        }
        player.removeEventListener('timeupdate', onTimeUpdate)
      }
    }

    function pausePlaying() {
      const player: HTMLVideoElement | null = playbackVideo.value
      if (player) {
        player.pause()
        player.volume = currentVolume.value
        playing.value = false
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
          videoActions.updateLocalVideo(video.value)
          setPlayerBounds()
          player.removeEventListener('loadeddata', dataLoaded)
          context.emit('duration', player.duration)
          if (videoGetters.detailMode.value.mode === VIDEO_DETAIL_MODE.play) {
            startPlaying()
          }
        }

        player.addEventListener('loadeddata', dataLoaded)
        player.addEventListener('ended', stopPlaying, false)

        const path = `${baseUrl}/api/video/file?videoref=${video.value.details.id}`
        player.setAttribute('src', path)
        player.load()
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
      pausePlaying,
      toggleScreenMode,
      adjustVolume,
      formatVolumeTooltip,
      formatProgressTooltip,
      adjustProgress,
      // data
      baseUrl,
      selectedItem,
      video,
      playerTime,
      volumeLevel,
      videoMimeType,
      edlUpdated,
      playbackVideo,
      playerCurrentTime,
      moveScrubber,
      step,
      trim,
      // booleans
      playing,
      fullScreenMode,
      volumeMenu,
      // assets
      playButtonSVG,
      pauseButtonSVG,
      fullscreenButtonSVG,
      soundOnButtonSVG,
      soundOffButtonSVG,
    }
  },
})
</script>

<style src="@vueform/slider/themes/default.css"></style>

<style scoped>
.volume-slider {
  --slider-handle-bg: #00cb8d;
  --slider-handle-width: 16px;
  --slider-handle-height: 16px;
  --slider-height: 3px;
  --slider-vertical-height: 4rem;
  --slider-bg: #444;
  --slider-connect-bg: #ffffff;
}
.volume-slider .slider-handle {
  right: calc(
    var(--slider-handle-height, 16px) / 2 * -1 - var(--slider-height, 6px) / 2 *
      -1
  ) !important;
}
.progress-slider {
  --slider-handle-bg: #059fff;
  --slider-handle-width: 16px;
  --slider-handle-height: 16px;
  --slider-height: 3px;
  --slider-vertical-height: 4rem;
  --slider-bg: rgba(163, 185, 255, 0.2);
  --slider-connect-bg: #059fff;
  --slider-tooltip-bg: rgba(0, 0, 0, 0);
  --slider-tooltip-font-size: 0.7rem;
  --slider-tooltip-font-weight: 200;
  --slider-tooltip-line-height: 0.5rem;
}
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
