<template>
  <!--div v-if="selectedVideo && video" class="flex flex-col flex-grow min-h-0 relative"-->
  <div class="flex flex-col flex-grow min-h-0 w-full">
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
        ></video>
        <!-- Old method for video capture: iOS Safari-->
        <label v-if="!useCordova">
          <input
            type="file"
            accept="video/*"
            capture="environment"
            id="safariVideoInput"
            ref="safariVideoInput"
            style="position:absolute;width:0;height:0"
            @change="videoInputAvailable($event)"
          />
        </label>
      </div>
      <!--/div>
          <div v-show="selectedVideo.decryptionInProgress">
            <div>dekryptering..</div>
      </div-->
      <div class="flex flex-row flex-grow-0 w-full bg-black py-1 md:py-4 justify-between">
        <div class="flex flex-grow-0 justify-center items-center">
          <div class="mx-4 text-white">{{ playerTime }}</div>
        </div>
        <div class="flex flex-grow justify-center items-center" v-if="pageNumber == 0">
          <SVGSymbol
            v-show="recording"
            applyClasses="w-8 h-8 md:w-12"
            @click.native="stopRecording()"
            width="50"
            symbol="stop"
          ></SVGSymbol>
          <SVGSymbol
            v-show="!recording"
            applyClasses="w-8 h-8 md:w-12"
            @click.native="startRecording()"
            width="50"
            symbol="record"
            :disabled="pageNumber == 2"
          ></SVGSymbol>
        </div>
        <div
          class="flex flex-grow-0 justify-center content-center items-center"

          v-show="videoDataLoaded"
        >
          <SVGSymbol
            v-show="!recording && !playing && videoDataLoaded"
            class="pr-4 justify-center content-center"
            applyClasses="w-6 h-8 md:w-12"
            @click.native="startPlaying()"

            symbol="play"
          ></SVGSymbol>
          <SVGSymbol
            v-show="playing"
            class="pr-4 justify-center content-center"
            applyClasses="w-6 j-8 md:w-12"
            @click.native="stopPlaying()"

            symbol="stop"
          ></SVGSymbol>
        </div>
        <!--div
          class="text-white"
          style="width:90px;height:50px;"
          v-show="!playing && !videoDataLoaded"
        ></div-->
        <div class="flex flex-grow justify-center items-center" style="width:90px;">
          <SVGSymbol
            v-show="!recording"
            @click.native="deleteDraft($event)"
            applyClasses="w-4 md:w-8"
            symbol="delete"
          ></SVGSymbol>
        </div>
      </div>

      <!-- Full screen mode -->
      <!--div v-if="!deviceStatus.mobile" type="flex" justify="end" style="margin-right: 20px;">
          <span>fullskjermopptak</span>
          <input type="checkbox" v-model="useFullScreen" />
      </div-->

      <!-- Estimated storage remaining -->
      <!--div v-if="deviceStatus.browser != 'Safari'">
          <span>
            estimert lagring tilgjengelig:
            {{ estimatedStorageRemaining }}%
          </span>
      </div-->

      <div class="absolute p-4 top-0 z-10 text-white w-full flex flex-row justify-between">
        <div>
          <p class="text-sm">{{ datasetName }}</p>
          <p class="font-vagBold">{{ selectedVideo.name }}</p>
        </div>
        <img
          class="absolute top-0 right-0 w-8 m-4"
          src="@/assets/icons/svg/list_white.svg"
          @click="backToList()"
        />
        <!--SVGSymbol
        applyClasses="w-4 h-4 md:w-8 md:h-8"
        @click.native="toggleScreenMode()"
        width="30"
        symbol="showList"
        ></SVGSymbol-->
      </div>

      <Slider
        v-if="!fullScreenMode"
        class="flex flex-col flex-grow min-h-0"
        :pages="pages"
        :movePageTo="pageNumber"
        :stateToChildren="stateToChildren"
        @edl-updated="edlUpdated"
      />
    </div>
  </div>
</template>

<i18n>
{
  "no": {
  },
  "en": {
  }
}
</i18n>

<script>
import { mapGetters, mapMutations, mapActions } from 'vuex';
import Slider from '../../components/base/Slider.vue';
import SVGSymbol from '../../components/base/SVGSymbol.vue';
import cordovaService from '../../api/cordovaService';
import constants from '../../constants';
const { strings } = constants;

import main from './pages/main';
import consent from './pages/consent';
import edit from './pages/edit';
import metadata from './pages/metadata';
import upload from './pages/upload';

export default {
  name: 'editor',
  components: {
    Slider,
    SVGSymbol,
  },
  props: {
    pageNumber: {
      type: Number,
      default: 0,
    },
  },
  data: () => ({
    pages: [main, consent, edit, metadata, upload],
    showConfirmDeleteDialog: false,
    video: undefined,
    fullScreenMode: false,
    stateToChildren: {
      playerCurrentTime: 0,
    },

    recording: false,
    playing: false,
    useFullScreen: false,
    recorder: undefined,
    recordingData: [],
    dataTimeout: undefined,
    selected: '',
    playerLowerBound: 0, // Time >= 0 when video should start playing, when using the scrubber
    playerUpperBound: 0, // Time <= player end time when video should stop playing, when using the scrubber
    playerCurrentTime: 0,
    videoDataLoaded: false,
    videoWasReplaced: false,
    reloadVideo: false,
    currentVolume: 0,
  }),
  created() {
    document.addEventListener('fullscreenchange', () => {
      // document.fullscreenElement will point to the element that
      // is in fullscreen mode if there is one. If not, the value
      // of the property is null.
      if (document.fullscreenElement) {
        this.$store.commit('general/isFullScreen', true);
      } else {
        this.$store.commit('general/isFullScreen', false);
      }
    });
  },
  mounted() {
    if (!this.selectedVideo) {
      return this.$router.push('/videos/list')
    }
    if (this.selectedDatasett.samtykke == 'samtykke') {
      this.fetchConsents(this.selectedVideo);
    }
    this.setupVideo(this.selectedVideo);
    this.setRecordingNow(false);
    this.reloadVideo = true;
    this.videoDataLoaded = false;
    this.videoWasReplaced = false;
    if (this.selectedVideo.status == 'draft' && this.selectedVideo.recordingExists) {
      this.loadVideo(this.selectedVideo);
    }
  },
  updated() {
    if (this.reloadVideo) {
      this.reloadVideo = false;
      this.loadPlayerWithVideo();
    }
  },
  watch: {
    selectedVideo(newVideo) {
      this.setupVideo(newVideo);
    },
    hasNewDataAvailable(newDataAvailable) {
      if (newDataAvailable) {
        this.loadPlayerWithVideo();
      }
    },
  },
  computed: {
    // 'video' is created as a placeholder for new user data
    // 'seelctedVideo' will still be used for dynamic status updates
    ...mapGetters('video', [
      'selectedVideo',
      'unencryptedData',
      'hasTUSUploadReady',
      'estimatedStorageRemaining',
      'useCordova',
    ]),
    ...mapGetters('setting', ['selectedDatasett']),
    ...mapGetters('general', ['deviceStatus', 'user', 'isFullScreen']),
    useOldRecorder() {
      return this.deviceStatus.browser == 'Safari';
    },
    datasetName() {
      if (this.selectedVideo.datasetInfo && this.selectedVideo.datasetInfo.utvalg) {
        const utvalg = this.selectedVideo.datasetInfo.utvalg.reduce((acc, curr) => {
          const split = curr.split(':')
          return `${acc} > ${split[1]}`
        }, '')
        return `${this.selectedVideo.datasetInfo.name} ${utvalg}`
      } else {
        return ''
      }
    },
    playerTime() {
      if (this.recording) {
        return '--:--.-'
      } else {
        const timeAsInt = parseInt(this.playerCurrentTime);
        let minutes = Math.floor(timeAsInt / 60);
        // prettier-ignore
        let seconds = minutes > 0 ? timeAsInt % (60 * minutes) : timeAsInt;
        let milliseconds = this.playerCurrentTime.toFixed(2);
        milliseconds = milliseconds.substring(milliseconds.length - 2);
        minutes = minutes > 9 ? minutes : '0' + minutes;
        seconds = seconds > 9 ? seconds : '0' + seconds;
        return `${minutes}:${seconds}.${milliseconds}`;
      }
    },
    videoMimeType() {
      if (this.deviceStatus.mobile) {
        return this.deviceStatus.browser == 'Safari'
          ? 'video/mp4'
          : 'video/mp4';
      } else {
        return this.deviceStatus.browser == 'Safari'
          ? 'video/quicktime'
          : 'video/webm';
      }
    },
    hasNewDataAvailable() {
      return this.selectedVideo
        ? this.selectedVideo.hasNewDataAvailable
        : false;
    },
  },
  methods: {
    ...mapMutations('general', ['setDialog']),
    ...mapMutations('video', [
      'setTempVideo',
      'setRecordingNow',
      'resetEDL',
      'setDecryptedVideoData',
    ]),
    ...mapActions('setting', ['fetchConsents']),
    ...mapActions('video', [
      'upload',
      'appendChunk',
      'encryptChunk',
      'updateDraftMetadata',
      'loadVideo',
      'saveVideo',
      'loadCordovaMedia',
      'replaceVideoData',
      'setUnsavedChanges',
      'removeDraftVideo'
    ]),
    backToList() {
      if (!this.recording) {
        this.$router.push('/videos/list').catch(err => {});
      }
    },
    toggleScreenMode() {
      this.fullScreenMode = !this.fullScreenMode;
    },
    deleteDraft(event) {
      event.stopPropagation();
      this.setDialog({
        visible: true,
        data: {
          titleText: 'Advarsel',
          messageText:
            'Vennligst bekreft at du vil slette videoen. Det kan ikke bli ugjort!',
          cancelText: 'avbryt',
          confirmText: 'bekreft',
        },
        doneCallback: this.confirmDeleteModalDone,
      });
    },
    confirmDeleteModalDone(confirmed) {
      this.setDialog({
        visible: false,
        data: {},
        doneCallback: undefined,
      });
      if (confirmed) {
        this.removeDraftVideo({
          video: this.selectedVideo,
          user: this.user,
        }).then(() => {
          this.$router.push('/videos/list');
        })
      }
    },
    // Called on initialisation of this view to create placeholder for edited data
    setupVideo(videoTemplate) {
      // Create a video placeholder that can be modifed by the user
      if (videoTemplate) {
        this.video = {
          edl: videoTemplate.edl,
          duration: videoTemplate.duration,
        };
        this.setPlayerBounds();
      }
    },
    stopPlaying() {
      const player = this.$refs.playbackVideo;
      if (this.recording) {
        this.stopRecording();
      } else {
        player.pause();
        player.volume = this.currentVolume;
        this.playing = false;
        player.currentTime = this.playerLowerBound;
        this.playerCurrentTime = player.currentTime;
        this.stateToChildren.playerCurrentTime = this.playerCurrentTime;
        if (this.timeIsMasked(player.currentTime)) {
          player.style.filter = 'blur(15px)';
        } else {
          player.style.filter = 'blur(0)';
        }
        player.removeEventListener('timeupdate', this.onTimeUpdate);
      }
    },
    timeIsMasked(currentTime) {
      return this.video.edl.blur.some(
        blur => currentTime >= blur[0] && currentTime <= blur[1]
      );
    },
    onTimeUpdate() {
      const player = this.$refs.playbackVideo;
      let trim = this.video.edl.trim.length > 0;
      let mask = this.video.edl.blur.length > 0;
      this.playerCurrentTime = player.currentTime;
      this.stateToChildren.playerCurrentTime = player.currentTime;
      if (
        player.currentTime >= this.playerUpperBound ||
        (trim && player.currentTime >= this.video.edl.trim[1])
      ) {
        this.stopPlaying();
      } else if (mask) {
        let blurOn = this.timeIsMasked(player.currentTime);
        if (blurOn) {
          player.muted = true;
          player.style.filter = 'blur(15px)';
        } else {
          player.muted = false;
          player.style.filter = 'blur(0)';
        }
      }
    },
    startPlaying() {
      this.setPlayerBounds();
      const player = this.$refs.playbackVideo;
      this.currentVolume = player.volume;
      if (this.playing) {
        player.pause();
        this.playing = false;
      } else {
        this.playing = true;
        player.addEventListener('timeupdate', this.onTimeUpdate);
        player.play();
      }
    },
    // Event handler for Edit Decision List updates
    edlUpdated({ type, newValue }) {
      let player = this.$refs.playbackVideo;
      if (
        type == 'trim' &&
        !isNaN(player.duration) &&
        player.duration >= newValue[1]
      ) {
        this.playerUpperBound = newValue[1];
        this.playerLowerBound = newValue[0];
        player.currentTime = this.playerLowerBound;
      } else if (type == 'move' && player.duration >= newValue[0]) {
        player.currentTime = newValue[0];
      }
      this.playerCurrentTime = player.currentTime;
    },
    toggleFullScreen() {
      let videoContainer = this.$refs.videoContainer;
      if (!this.isFullScreen) {
        if (videoContainer.requestFullscreen) {
          videoContainer.requestFullscreen();
        } else if (videoContainer.msRequestFullscreen) {
          videoContainer.msRequestFullscreen();
        } else if (videoContainer.mozRequestFullScreen) {
          videoContainer.mozRequestFullScreen();
        } else if (videoContainer.webkitRequestFullscreen) {
          videoContainer.webkitRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.msExitFullscreen) {
          document.msExitFullscreen();
        } else if (document.mozCancelFullScreen) {
          document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        }
      }
    },
    // Receive video data from the old recording method - <input> tag
    videoInputAvailable(event) {
      this.recording = false;
      const videoData = event.target.files[0];

      // Save the video data in both raw and encrypted form
      this.appendChunk({ fileId: this.selectedVideo.fileId, chunk: videoData });
      this.encryptChunk({
        chunk: videoData,
        fileId: this.selectedVideo.fileId,
      }).then(() => this.saveVideo(this.selectedVideo.fileId));
    },
    /**
     *  calculateMediaDuration()
     *  Force media element duration calculation.
     *  Returns a promise, that resolves when duration is calculated
     **/
    // https://stackoverflow.com/questions/38443084/how-can-i-add-predefined-length-to-audio-recorded-from-mediarecorder-in-chrome/39971175#39971175
    calculateMediaDuration(player) {
      return new Promise(resolve => {
        player.onloadedmetadata = () => {
          // set the mediaElement.currentTime  to a high value beyond its real duration
          player.currentTime = Number.MAX_SAFE_INTEGER;
          // listen to time position change
          player.ontimeupdate = () => {
            player.ontimeupdate = function() {};
            // setting player currentTime back to 0 can be buggy too, set it first to .1 sec
            player.currentTime = 0.1;
            player.currentTime = 0;
            // player.duration should now have its correct value, return it...
            resolve(player.duration);
          };
        };
      });
    },
    setPlayerBounds() {
      const player = this.$refs.playbackVideo;
      if (player) {
        if (this.video.edl.trim.length > 1) {
          this.playerLowerBound = this.video.edl.trim[0];
          this.playerUpperBound = this.video.edl.trim[1];
          player.currentTime = this.playerLowerBound;
        }
        if (this.timeIsMasked(player.currentTime)) {
          player.style.filter = 'blur(15px)';
        } else {
          player.style.filter = 'blur(0)';
        }
      }
    },
    // Load the player with video data from a new result
    // or reload it from store if reloadingFromStore == true
    // reloadingFromStore is true / triggered after the video data has been decrypted
    // or after returning to the video from the list
    loadPlayerWithVideo() {
      const player = this.$refs.playbackVideo;

      const setVideoDuration = duration => {
        this.playerUpperBound = duration;
        this.video.duration = duration;
        // We need to save the duration
        this.saveMetadata().then(() => {
          // But if this is new video replacing an old, the unsavedChanges must be set true to request 'samtykker' acceptance
          if (this.videoWasReplaced) {
            this.setUnsavedChanges(this.selectedVideo.fileId);
          }
        });
      };

      const dataLoaded = () => {
        if (this.useCordova) {
          setVideoDuration(player.duration);
          this.setPlayerBounds();
        }
        player.removeEventListener('loadeddata', dataLoaded);
        this.videoDataLoaded = true;
        this.setRecordingNow(false);
      };

      const loadData = objectURL => {
        if (player.srcObject) {
          player.srcObject = null;
        }
        player.setAttribute('src', objectURL + '#t=0.1');
        if (!this.useCordova) {
          this.calculateMediaDuration(player).then(duration => {
            setVideoDuration(duration);
            this.setPlayerBounds();
          });
        } // else, set the media bounds in the dataLoaded function..
        player.addEventListener('loadeddata', dataLoaded);
        player.load();
      };

      player.addEventListener(
        'ended',
        () => {
          this.stopPlaying();
        },
        false
      );

      const data = this.unencryptedData(this.selectedVideo.fileId); // Ensure chunks exist
      if (this.useCordova) {
        if (data) {
          // <- FileEntry
          this.loadCordovaMedia(data).then(mediaFile => {
            // <- MediaFile
            const p = mediaFile.nativeURL; // data.toURL(); //data.nativeURL; // toInternalURL() // toNativeURL() // toURI(mimeType)
            loadData(p);
          });
        }
      } else {
        if (data && data.length > 0) {
          let blob;
          if (!this.useOldRecorder) {
            blob = new Blob(data, {
              type: this.selectedVideo.mimeType,
            });
            // For Safari desktop and mobile (but not Cordova!) data is direct from iOS camera rsponse
          } else {
            blob = data[0];
          }
          if (blob) {
            const objectURL = window.URL.createObjectURL(blob);
            loadData(objectURL);
          }
        }
      }
    },

    startRecording() {
      if (this.video.duration > 0) {
        this.setDialog({
          visible: true,
          data: {
            titleText: 'Advarsel',
            messageText:
              'Vennligst bekreft at du vil overskrive videoen. Det kan ikke bli ugjort!',
            cancelText: 'avbryt',
            confirmText: 'bekreft',
          },
          doneCallback: this.confirmRecordingModalDone,
        });
      } else {
        this.recordVideo()
      }
    },
    confirmRecordingModalDone(confirmed) {
      this.setDialog({
        visible: false,
        data: {},
        doneCallback: undefined,
      });
      if (confirmed) {
        this.recordVideo()
      }
    },

    // Begin recording a video using MediaRecorder or Input method depending on device
    async recordVideo() {
      // Prevent if we have not checked samtykker
      /* if (!this.selectedVideo.subState.consented) {
        return;
      } */

      // Make sure EDL is cleared if it is
      this.video.edl = {
        trim: [],
        blur: [],
      };
      this.recording = true;
      this.videoWasReplaced = true;
      let finalChunk = false;
      const player = this.$refs.playbackVideo;

      this.setRecordingNow(true);

      if (this.useOldRecorder && !this.useCordova) {
        // Safari does not support MediaRecorder yet..
        // * Using the old method for recording on Safari mobile
        // * No soltion currently for Safari desktop. A minor use case, can it wait until fall 2019 - MediaRecorder support?
        // Also - we must call this very early after the user interaction to prevent Safari blocking the Javasscript
        document.getElementById('safariVideoInput').click();
      }

      // Request video data after some time delay to produce chunks
      const getRecordedChunk = () => {
        this.dataTimeout = setTimeout(() => {
          if (this.recorder && this.recorder.state == 'recording') {
            if (this.recorder.currentTime > strings.recordingMaxDurationWeb) {
              this.stopRecording();
            } else {
              this.recorder.requestData();
            }
          }
        }, strings.recordingDataInterval * 1000);
      };

      // Clean up after recording is finished and load the video
      const finishedRecording = () => {
        this.saveVideo(this.selectedVideo.fileId);
      };

      // Process a new chunk
      const processChunk = chunk => {
        const finalChunkReceived = finalChunk;
        // Stop the timer until we're done encrypting the current chunk
        clearTimeout(this.dataTimeout);
        // Add the raw chunk to the current video for immediate playback
        this.appendChunk({ fileId: this.selectedVideo.fileId, chunk });
        // Encrypt this chunk and append it to the video's data
        this.encryptChunk({ chunk, fileId: this.selectedVideo.fileId })
          .then(() => {
            // If the recording was finished meanwhile, encrypt the final chunk
            // Otherwise wait for the next timeout
            if (finalChunkReceived) {
              finishedRecording();
            } else {
              // After we have finished encrypting, timeout again for a new chunk
              getRecordedChunk();
            }
          })
          .catch(error => console.log(error));
      };

      // If using Cordova, call the device camera
      if (this.useCordova) {
        this.recording = true;
        cordovaService
          .captureVideo()
          .then(async data => {
            this.replaceVideoData({
              setting: this.selectedDatasett,
              user: this.user,
              fileId: this.selectedVideo.fileId,
            }).then(() => {
              const fileId = this.selectedVideo.fileId;
              // Add the MediaFile object (this is not video data!) to the store
              this.setDecryptedVideoData({ fileId, data });
              // This will move the video from a temp directory to our app storage
              this.saveVideo(fileId);
              this.recording = false;
            })
          })
          .catch(error => {
            console.log(error)
            this.recording = false;
          });
      }

      // Otherwise, use the new MediaRecorder interface to record video
      if (!this.useOldRecorder && !this.useCordova) {
        if (this.useFullScreen) {
          this.toggleFullScreen();
        }

        await this.replaceVideoData({
          setting: this.selectedDatasett,
          user: this.user,
          fileId: this.selectedVideo.fileId,
        });

        // Define constraints for recording
        const constraints = {
          audio: true,
          video: {
            facingMode: 'environment',
          },
        };

        // Request a stream with the constraints from the browser
        navigator.mediaDevices.getUserMedia(constraints).then(stream => {
          // Create a recorder using the stream

          if (this.deviceStatus.mobile && this.deviceStatus.browser !== 'Safari') {
            this.recorder = new MediaRecorder(stream);
          } else {
            this.recorder = new MediaRecorder(stream, {
              mimeType: this.selectedVideo.mimeType,
              videoBitsPerSecond: 256 * 8 * 1024,
            });
          }

          // Assign the stream to the player to show the recording as it happens
          if ('srcObject' in player) {
            player.srcObject = stream;
            player.play();
          }

          // Await data to come from the stream in chunks
          this.recorder.ondataavailable = event => {
            this.playerCurrentTime = player.currentTime;
            // If we are still recording, then there is more data to come after this chunk
            if (this.recorder.state != 'recording') {
              finalChunk = true;
            }
            processChunk(event.data);
          };

          this.recorder.start();
          this.recording = true;
          getRecordedChunk();
        }).catch(err => console.log(err))
      }
    },
    stopRecording() {
      const player = this.$refs.playbackVideo;
      if (this.recording) {
        this.recording = false;
        if (player.srcObject) {
          player.srcObject.getTracks().forEach(track => {
            track.stop();
          });
        }
        this.recorder.stop();
        if (this.isFullScreen) {
          this.toggleFullScreen();
        }
      } else {
        player.pause();
      }
    },
    // Save video changes into the stored metadata > to Store and indexedDB/Cordova storage
    saveMetadata() {
      return this.updateDraftMetadata({
        setting: this.selectedDatasett,
        user: this.user,
        fileId: this.selectedVideo.fileId,
        updates: this.video,
      });
    },
    handleCheckAll() {
      if (!this.indeterminate) {
        this.checkAll = true;
        this.indeterminate = true;
      } else {
        this.checkAll = !this.checkAll;
        this.indeterminate = false;
      }
      if (this.checkAll) {
        this.checkAllGroup = ['One', 'Two', 'Three'];
      } else {
        this.checkAllGroup = [];
      }
    },
    checkAllGroupChange(data) {
      if (data.length === 3) {
        this.indeterminate = false;
        this.checkAll = true;
      } else if (data.length > 0) {
        this.indeterminate = true;
        this.checkAll = false;
      } else {
        this.indeterminate = false;
        this.checkAll = false;
      }
    },
    /*disableDownloadVideo(event) {
      event.preventDefault();
      event.stopPropagation();
      return false;
    },*/
  },
};
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
