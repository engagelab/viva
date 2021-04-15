<template>
  <div
    class="flex flex-row items-center justify-between viva-item max-w-xs"
    :class="backgroundColour"
    @click.native="openVideo()"
  >
    <div class="max-w-24">
      <p class="text-sm">{{ datasetName }}</p>
      <p class="font-vagBold">{{ video.name }}</p>
      <p>{{ video.description }}</p>
      <p :class="videoStatus.textClass">{{ videoStatus.text }} {{ videoProgress }}</p>
      <Button
        v-if="video.status == 'edited' && videoStatus.google"
        logo="google"
        customWidth="250px"
        :disabled="disableTransfer"
        @click="transferVideo()"
      >{{ $t('Overføre') }}</Button>
    </div>
    <div class="pl-4" @click="clickItem(videoStatus)">
      <SVGSymbol
        class="p-2 fill-current"
        applyClasses="w-4 md:w-8"
        :class="videoStatus.symbolClass"
        :symbol="videoStatus.symbol"
        rotation="0"
      />
    </div>
  </div>
</template>

<i18n>
{
  "no": {
    "Overføre": "Overføre til permanent lagring"
  },
  "en": {
    "Overføre": "Transfer to permanent storage"
  }
}
</i18n>

<script>
import { mapGetters, mapActions } from 'vuex';
import SVGSymbol from './base/SVGSymbol';
import Button from './base/Button';
import constants from '../constants';

const { strings, baseUrl } = constants;
export default {
  components: {
    SVGSymbol,
    Button,
  },
  props: {
    video: {
      type: Object,
      default: undefined,
    },
    isLastVideo: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    ...mapGetters('setting', ['settingById']),
    backgroundColour() {
      const status = this.video.status == 'edited' ? 'bg-green' : '';
      return this.itemSelected ? 'bg-white' : status;
    },
    datasetName() {
      if (this.video.datasetInfo && this.video.datasetInfo.utvalg) {
        const utvalg = this.video.datasetInfo.utvalg.reduce((acc, curr) => {
          const split = curr.split(':')
          return `${acc} > ${split[1]}`
        }, '')
        return `${this.video.datasetInfo.name} ${utvalg}`
      } else {
        return ''
      }
    },
    videoStatus() {
      const status = {
        text: 'Sjekk samtykker',
        textClass: 'text-viva-korall',
        status: 'draft',
        symbol: 'viva',
        symbolClass: 'text-viva-korall',
        google: false,
      };
      if (this.video.status == 'draft' && !this.video.subState.consented) {
        status.text = 'Sjekk samtykker';
      } else if (
        this.video.status == 'draft' &&
        !this.video.subState.classified
      ) {
        status.text = 'Må klassifiseres';
      } else if (this.video.status == 'draft' && !this.video.subState.edited) {
        status.text = 'Klipper og legger på filtre';
        status.symbolClass = 'text-viva-korall';
        status.textClass = 'text-viva-lilla';
      } else if (this.video.status == 'complete') {
        status.text = 'Opptak er lagret';
        status.symbolClass = 'black';
        status.textClass = 'black';
        status.symbol = 'accept';
      } else if (this.video.status == 'error') {
        status.text = 'Error';
        status.symbolClass = 'red';
        status.textClass = 'red';
      } else if (
        this.video.status != 'draft' &&
        this.video.status != 'edited' &&
        this.video.status != 'error' &&
        this.video.status != 'complete'
      ) {
        status.text = 'Opptak behandles av UiOs VIVA tjeneste ...';
        status.symbol = 'wait';
        status.symbolClass = 'black';
        status.textClass = 'black';
      } else if (this.video.status == 'edited') {
        status.text = 'Klar til overføring';
        status.symbol = 'accept';
        status.symbolClass = 'green';
        status.textClass = 'green';
        status.google = this.video.storages.some(name => name == 'google');
      }
      return status;
    },
    videoProgress: function() {
      if (this.video.pipelineInProgress) {
        return 'Opptak behandles...';
      } else if (this.video.uploadInProgress) {
        return 'Opptak sendes til lagring...';
      } else if (this.video.encryptionInProgress) {
        return 'Opptak krypteres...';
      } else if (this.video.decryptionInProgress) {
        return 'Opptak dekrypteres...';
      } else {
        return '';
      }
    },
  },
  data() {
    return {
      itemSelected: false,
      progressUpdateTimeout: undefined,
      disableTransfer: false
    };
  },
  mounted() {
    this.progressUpdateTimeout = window.setInterval(() => {
      if (
        this.video.status != 'draft' &&
        this.video.status != 'complete' &&
        this.video.status != 'error'
      ) {
        this.checkVideoProgress(this.video).catch(() => {
          window.clearInterval(this.progressUpdateTimeout);
        });
      } else if (this.progressUpdateTimeout) {
        window.clearInterval(this.progressUpdateTimeout);
      }
    }, strings.videoProgressCheckInterval * 1000);
  },
  beforeDestroy() {
    if (this.progressUpdateTimeout) {
      window.clearInterval(this.progressUpdateTimeout);
    }
  },
  methods: {
    ...mapGetters('general', ['useCordova', 'isLoggedIn']),
    ...mapActions('video', ['checkVideoProgress', 'initiateTransfer']),
    clickItem(status) {
      if (status.symbol == 'viva') {
        // this.itemSelected = true;
        setTimeout(() => {
          this.$emit('select-video', { video: this.video });
        }, 100);
      }
    },
    // Initiate transfer of the video from VIVA server to final storage location
    transferVideo() {
      if (!this.disableTransfer) {
        this.initiateTransfer({
          video: this.video,
          settingId: this.video.settingId,
          mode: 'transfer',
        });
      }
      this.disableTransfer = true;
    },
  },
};
</script>

<style scoped>
.green {
  color: green;
  fill: green;
}
</style>
