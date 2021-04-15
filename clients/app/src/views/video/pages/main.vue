<template>
  <div class="flex flex-col flex-grow min-h-0 w-full">
    <div class="flex flex-col flex-grow min-h-0 md:mt-4 p-4 text-3xl md:text-5xl w-full relative">
      <SliderItem
        class="mb-2 md:mb-6 cursor-pointer text-lg"
        routePath="/videos/editor?page=1"
      >{{$t('samtykker')}}</SliderItem>
      <SliderItem
        class="mb-2 md:mb-6 cursor-pointer text-lg"
        routePath="/videos/editor?page=2"
        :disabled="!selectedVideo.recordingExists"
      >{{$t('rediger')}}</SliderItem>
      <SliderItem
        class="mb-2 md:mb-6 cursor-pointer text-lg"
        routePath="/videos/editor?page=3"
      >{{$t('klassifiser')}}</SliderItem>
      <SliderItem
        class="mb-2 md:mb-6 cursor-pointer text-lg"
        routePath="/videos/editor?page=4"
        :disabled="!readyForUpload"
      >{{$t('lagre')}}</SliderItem>
    </div>
  </div>
</template>

<i18n>
{
  "no": {
    "samtykker": "Samtykker",
    "rediger": "Rediger",
    "klassifiser": "Klassifiser",
    "lagre": "Lagre"
  },
  "en": {
    "samtykker": "Consents",
    "rediger": "Edit",
    "klassifiser": "Classify",
    "lagre": "Save"
  }
}
</i18n>

<script>
import { mapGetters, mapMutations, mapActions } from 'vuex';
import SliderItem from '../../../components/base/SliderItem.vue';
export default {
  components: {
    SliderItem,
  },
  computed: {
    ...mapGetters('video', ['selectedVideo']),
    checkselectedVideo() {
      return this.selectedVideo;
    },
    readyForUpload() {
      return (
        this.selectedVideo.recordingExists &&
        this.selectedVideo.subState.classified &&
        (this.selectedVideo.subState.consented ||
          this.selectedVideo.category === 'green')
      );
    },
  },
};
</script>
