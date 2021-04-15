<template>
  <div class="p-4 flex flex-col w-full">
    <SVGSymbol
      class="text-viva-korall fill-current"
      applyClasses="w-4 md:w-8"
      @click.native="back()"
      width="25"
      rotation="180"
    ></SVGSymbol>
    <div class="flex flex-col flex-grow w-full justify-center items-center mt-6">
      <p v-show="selectedVideo.uploadProgress > 0">{{ selectedVideo.uploadProgress }}%</p>
      <label v-if="!uploadComplete" for="checkbox">{{$t('opptakSendes')}}&nbsp;</label>
      <label v-else for="checkbox">{{$t('opptakSendt')}}&nbsp;</label>
      <Button
        class="mt-4"
        v-show="!selectedVideo.uploadInProgress"
        :disabled="!(selectedVideo.recordingExists && selectedVideo.subState.classified)"
        @click="startUpload()"
      >{{$t('send')}}</Button>
      <Button
        class="mt-4"
        v-show="selectedVideo.uploadInProgress"
        :disabled="!(selectedVideo.recordingExists && selectedVideo.subState.classified)"
        @click="stopUpload()"
      >{{$t('cancel')}}</Button>
    </div>
  </div>
</template>

<i18n>
{
  "no": {
    "opptakSendes": "Opptaket kan nå sendes fra din enhet til behandling i UiOs VIVA tjeneste",
    "opptakSendt": "Opptaket blir nå behandlet. Når dette er ferdig, kan du sende opptaket til din Google Drive lagringskonto. Dette gjøres under 'Mine opptak'",
    "send": "Send",
    "cancel": "Avbryt"
  },
  "en": {
    "opptakSendes": "The recording may now be transferred from your device to processing by the VIVA service",
    "opptakSendt": "The recording is now processed. When that is completed, you can transfer the recording to your Google Drive. Do that under 'My recordings'",
    "send": "Transfer",
    "cancel": "Cancel"
  }
}
</i18n>

<script>
import { mapGetters, mapActions } from 'vuex';
import Button from '../../../components/base/Button.vue';
import SVGSymbol from '../../../components/base/SVGSymbol.vue';
export default {
  components: {
    Button,
    SVGSymbol,
  },
  computed: {
    ...mapGetters('video', ['selectedVideo']),
    uploadComplete() {
      return this.selectedVideo.uploadProgress == 100;
    }
  },
  methods: {
    ...mapActions('video', ['controlUpload']),
    startUpload() {
      this.controlUpload({
        control: 'start',
        fileId: this.selectedVideo.fileId,
      });
    },
    stopUpload() {
      this.controlUpload({
        control: 'abort',
        fileId: this.selectedVideo.fileId,
      });
    },
    back() {
      if (this.uploadComplete) {
        this.$router.push('/videos/list');
      } else {
        this.$router.push('/videos/editor?page=0');
      }
    },
  },
};
</script>

<style scoped>
</style>
