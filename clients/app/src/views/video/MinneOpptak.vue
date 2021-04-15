<template>
  <div class="flex flex-col flex-grow min-h-0">
    <div class="flex-none relative bg-viva-lilla text-white text-4xl md:text-6xl pl-4 h-12 md:h-20">
      <img
        class="absolute top-0 right-0 w-8 mr-2 mt-2 p-1 md:m-4 cursor-pointer"
        src="@/assets/icons/svg/home_white.svg"
        @click="clickIcon('/login?page=3')"
      />
      <p class="absolute leading-tight bottom-0 pb-2 text-2xl">{{$t('lagringSamtykke')}}</p>
    </div>
    <div v-if="showDatasett" transition="expand" class="md:my-3">
      <Datasett />
    </div>
    <hr v-if="!showDatasett" style="width: 100%;" />
    <div class="flex-none relative bg-viva-lilla text-white text-4xl md:text-6xl pl-4 h-12 md:h-20">
      <SVGSymbol
        class="absolute top-0 right-0 w-4 mr-6 md:mr-10 mt-2 md:mt-4 p-1 text-viva-korall fill-current cursor-pointer"
        applyClasses="w-4 md:w-8 p-0"
        @click.native="toggleDatasett()"
        width="25"
        :rotation="showDatasett ? '270' : '90'"
      ></SVGSymbol>
      <p class="absolute leading-tight bottom-0 pb-2 text-2xl">{{$t('minneOpptak')}}</p>
    </div>
    <div
      v-if="selectedDatasett"
      class="mt-6 pb-24 md:mt-12 flex-initial flex-shrink flex-grow min-h-0 flex-col pl-4 overflow-y-auto scrolling-touch"
    >
      <transition-group
        name="slide-fade"
        tag="div"
        :leave-to-class="leaveToClass"
        :enter-class="enterClass"
        mode="out-in"
      >
        <p v-if="allDraftVideos.length === 0 && allVideos.length === 0" key="novids"></p>
        <VideoListItem
          class="p-2"
          v-for="draft in allDraftVideos"
          :key="draft.aId"
          :video="draft"
          @select-video="clickVideo"
        />
      </transition-group>
      <!-- TODO: Add heading ala 'Mine opptak.'-->
      <template v-if="allDraftVideos.length > 0 && allVideos.length > 0">
        <hr class="mt-2" />
        <p class="text-xs mb-2">{{ $t('uploadedVideos') }}</p>
      </template>
      <transition-group
        name="slide-fade"
        tag="div"
        :leave-to-class="leaveToClass"
        :enter-class="enterClass"
        mode="out-in"
      >
        <VideoListItem
          class="p-2"
          v-for="video in allVideos"
          :key="video.aId"
          :video="video"
          @select-video="clickVideo"
        />
      </transition-group>
    </div>
  </div>
</template>

<i18n>
{
  "no": {
    "lagringSamtykke": "Lagring og samtykker",
    "minneOpptak": "Mine opptak",
    "uploadedVideos": "Overførte opptak"
  },
  "en": {
    "lagringSamtykke": "Storage and consents",
    "minneOpptak": "My recordings",
    "uploadedVideos": "Transferred recordings"
  }
}
</i18n>

<script>
import moment from 'moment';
import { mapActions, mapGetters, mapMutations } from 'vuex';
import VideoListItem from '../../components/VideoListItem';
import Datasett from '../../components/Datasett';
import SVGSymbol from '../../components/base/SVGSymbol';
import constants from '../../constants';
const { strings } = constants;

export default {
  components: {
    Datasett,
    VideoListItem,
    SVGSymbol,
  },
  data() {
    return {
      leaveToClass: 'slide-fade-leave-to-right',
      enterClass: 'slide-fade-enter-right',
      showDatasett: true,
    };
  },
  mounted() {
    this.$store.dispatch('video/selectVideo', undefined);
    this.fetchVideoMetadata({
      setting: this.selectedDatasett,
      user: this.user,
    });
    const locks = Object.keys(this.presetDatasett.locks);
    let locksChanged = false;
    locks.forEach(datasetId => {
      const today = moment();
      const lockedDay = moment(this.presetDatasett.locks[datasetId].date);
      if (today.isAfter(lockedDay, 'day')) {
        this.unlockUtvalg(datasetId);
        locksChanged = true;
      }
    });
    if (locksChanged) this.updateUser(this.user);
  },
  computed: {
    ...mapGetters('general', ['user']),
    ...mapGetters('setting', ['selectedDatasett', 'presetDatasett']),
    ...mapGetters('video', ['allVideos', 'allDraftVideos']),
  },
  methods: {
    ...mapMutations('setting', ['unlockUtvalg']),
    ...mapActions('general', ['updateUser']),
    ...mapActions('video', ['selectVideo', 'fetchVideoMetadata']),
    clickIcon(newRoute) {
      this.$router.push(newRoute).catch(err => {});
    },
    toggleDatasett() {
      this.showDatasett = !this.showDatasett;
    },
    clickVideo({ video }) {
      if (video.status == 'draft') {
        this.selectVideo(video);
        this.$router.push('/videos/editor?page=0');
      } else if (video.status == 'error') {
        this.selectVideo(video);
        this.$router.push('/videos/error');
      }
    },
  },
};
</script>
<style scoped>
hr {
  border: 0;
  clear: both;
  display: block;
  width: 96%;
}
.expand-transition {
  transition: all 0.3s ease;
  height: auto;
}
.expand-enter,
.expand-leave {
  height: 0;
}
</style>
