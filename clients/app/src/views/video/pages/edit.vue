<template>
  <div class="flex-1 flex-col">
    <div class="flex bg-black p-4 md:p-4">
      <Scrubber
        type="range"
        v-model="moveScrubber"
        :max="scrubberMax"
        :min="scrubberMin"
        :step="step"
        @input="newValue => updateEDL('move', [newValue])"
      />
    </div>
    <div class="flex flex-col items-top p-1 md:p-4">
      <SVGSymbol
        class="text-viva-korall fill-current self-start p-2"
        applyClasses="w-4 md:w-8"
        @click.native="back()"
        width="25"
        rotation="180"
      ></SVGSymbol>

      <div class="flex-1 flex-col md:items-center m-1 md:m-8 overflow-y-auto pt-2">
        <div class="flex-1">
          <div
            class="flex items-center flex-shrink justify-between p-2 bg-white rounded-md editItem"
          >
            <p class="w-4">{{$t('trim')}}</p>
            <transition name="expand">
              <div class="flex flex-row items-center" v-if="video.edl.trim.length > 0">
                <div
                  class="flex flex-row items-center rounded-full ml-4 md:ml-12 p-2 cursor-pointer"
                  :class="trimButtonDisabled(0) ? ['bg-gray-400', 'text-white'] : ['bg-viva-korall', 'text-black']"
                  @click="setTrim(0)"
                >
                  <SVGSymbol
                    class="pointer-events-none fill-current"
                    applyClasses="w-4"
                    width="25"
                    rotation="180"
                    symbol="scissor"
                  ></SVGSymbol>
                  <p class="ml-2 leading-none pointer-events-none">⇤{{ video.edl.trim[0].toFixed(2) }}s</p>
                </div>
                <div
                  class="flex flex-row items-center ml-2 p-2 rounded-full cursor-pointer"
                  :class="trimButtonDisabled(1) ? ['bg-gray-400', 'text-white'] : ['bg-viva-korall', 'text-black']"
                  @click="setTrim(1)"
                >
                  <p class="mr-2 leading-none pointer-events-none">{{ video.edl.trim[1].toFixed(2) }}s⇥</p>
                  <SVGSymbol
                    class="pointer-events-none fill-current"
                    applyClasses="w-4"
                    width="25"
                    rotation="0"
                    symbol="scissor"
                  ></SVGSymbol>
                </div>
              </div>
            </transition>
            <SVGSymbol
              v-if="video.edl.trim.length > 0"
              class="ml-4 md:ml-12 p-2 rounded-full"
              applyClasses="w-4 md:w-8"
              @click.native="clearTrim()"
              width="20"
              rotation="0"
              symbol="remove"
            ></SVGSymbol>
            <SVGSymbol
              v-else
              class="ml-4 p-2 rounded-full"
              applyClasses="w-4 md:w-8"
              @click.native="addTrim()"
              width="20"
              rotation="0"
              symbol="addNew"
            ></SVGSymbol>
          </div>
        </div>
        <transition-group
          name="blur"
          tag="div"
          class="scrollBlurContainer flex-grow-0 flex-shrink flex-none flex-col"
        >
          <div
            class="flex-1 flex-col mt-4"
            v-for="(item, index) in video.edl.blur"
            :key="index + 'key'"
          >
            <div class="flex items-center justify-between p-2 bg-white rounded-md">
              <p class="w-4">{{$t('blur')}}</p>
              <transition name="expand">
                <div class="flex flex-row items-center">
                  <div
                    class="flex flex-row items-center ml-4 md:ml-12 p-2 rounded-full cursor-pointer"
                    :class="blurButtonDisabled(index, 0) ? ['bg-gray-400', 'text-white'] : ['bg-viva-korall', 'text-black']"
                    @click="setBlur(index, 0)"
                  >
                    <SVGSymbol
                      class="pointer-events-none fill-current"
                      applyClasses="w-4"
                      width="25"
                      rotation="330"
                      symbol="blur"
                    ></SVGSymbol>
                    <p
                      class="ml-2 leading-none pointer-events-none"
                    >⇤{{ video.edl.blur[index][0].toFixed(2) }}s</p>
                  </div>
                  <div
                    class="flex flex-row items-center ml-2 p-2 rounded-full cursor-pointer"
                    :class="blurButtonDisabled(index, 1) ? ['bg-gray-400', 'text-white'] : ['bg-viva-korall', 'text-black']"
                    @click="setBlur(index, 1)"
                  >
                    <p
                      class="mr-2 leading-none pointer-events-none"
                    >{{ video.edl.blur[index][1].toFixed(2) }}s⇥</p>
                    <SVGSymbol
                      class="pointer-events-none fill-current"
                      applyClasses="w-4"
                      width="25"
                      rotation="30"
                      symbol="blur"
                    ></SVGSymbol>
                  </div>
                </div>
              </transition>
              <SVGSymbol
                class="ml-4 md:ml-12 p-2 rounded-full"
                applyClasses="w-4 md:w-8"
                @click.native="clearBlur(index)"
                width="20"
                rotation="0"
                symbol="remove"
              ></SVGSymbol>
            </div>
          </div>
        </transition-group>
        <div class="flex items-center justify-between p-2 mt-4 bg-white rounded-md">
          <p class="w-4">{{$t('blur')}}</p>
          <SVGSymbol
            class="ml-4 p-2 rounded-full"
            applyClasses="w-4 md:w-8"
            @click.native="addBlur()"
            width="20"
            rotation="0"
            symbol="addNew"
          ></SVGSymbol>
        </div>
      </div>
    </div>
  </div>
</template>

<i18n>
{
  "no": {
    "trim": "Trim",
    "blur": "Maskér"
  },
  "en": {
    "trim": "Trim",
    "blur": "Blur"
  }
}
</i18n>

<script>
import Vue from 'vue';
import { mapGetters, mapActions } from 'vuex';
import Button from '../../../components/base/Button';
import SVGSymbol from '../../../components/base/SVGSymbol';
import Scrubber from '../../../components/base/Scrubber';
export default {
  components: {
    SVGSymbol,
    Scrubber,
  },
  props: {
    stateFromParent: {
      type: Object,
    },
  },
  data: () => ({
    moveScrubber: '0',
    video: {
      edl: {
        trim: [],
        blur: [],
      },
    },
    step: 0.01,
  }),
  mounted() {
    if (this.selectedVideo) {
      this.video.edl = this.selectedVideo.edl;
      let scrubberMin = 0;
      if (this.video.edl.trim.length > 0) {
        scrubberMin = this.video.edl.trim[0];
      }
      this.updateEDL('move', [scrubberMin.toString()]);
    }
  },
  watch: {
    /* duration(newD, oldD) {
      if (newD >= 0 && oldD !== newD) {
        const newTrim = [...this.video.edl.trim];
        newTrim[1] = newD;
        this.video.edl.trim = newTrim;
      }
    }, */
    'stateFromParent.playerCurrentTime': function(newVal, oldVal) {
      //console.log('Prop changed: ', newVal, ' | was: ', oldVal);
      this.moveScrubber = newVal.toString();
    },
  },
  computed: {
    ...mapGetters('video', ['selectedVideo']),
    ...mapGetters('general', ['user']),
    ...mapGetters('setting', ['selectedDatasett']),
    duration() {
      return this.selectedVideo.duration;
    },
    scrubberMax() {
      return this.video.edl.trim[1] || this.duration;
    },
    scrubberMin() {
      return this.video.edl.trim[0] || 0;
    },
  },
  methods: {
    ...mapActions('video', ['setUnsavedChanges', 'updateDraftMetadata']),
    back() {
      this.saveMetadata();
      this.$router.push('/videos/editor?page=0');
    },
    saveMetadata() {
      return this.updateDraftMetadata({
        setting: this.selectedDatasett,
        user: this.user,
        fileId: this.selectedVideo.fileId,
        updates: this.video,
      });
    },
    updateEDL(type, newValue) {
      this.$bubble('edl-updated', { type, newValue });
    },
    // ----------------   Blur and Trim ------------------
    trimButtonDisabled(bound) {
      if (bound == 0) {
        return (
          this.video.edl.trim.length > 0 &&
          parseFloat(this.moveScrubber) > this.video.edl.trim[1]
        );
      }
      return (
        this.video.edl.trim.length > 0 &&
        parseFloat(this.moveScrubber) < this.video.edl.trim[0]
      );
    },
    blurButtonDisabled(index, bound) {
      const trim = this.video.edl.trim;
      const blur = this.video.edl.blur;
      const time = parseFloat(this.moveScrubber);

      // Upper bound
      if (bound > 0) {
        return (
          time < blur[index][0] ||
          (trim.length > 0 && (time < trim[0] || time > trim[1]))
        );
      }

      // Lower bound
      return (
        (blur[index][1] > 0 && time >= blur[index][1]) ||
        (trim.length > 0 && (time < trim[0] || time > trim[1]))
      );
    },
    addTrim() {
      this.video.edl.trim = [0, this.duration];
    },
    clearTrim() {
      this.video.edl.trim = [];
      this.saveMetadata();
      this.updateEDL('trim', [0, this.selectedVideo.duration]);
    },
    setTrim(bound) {
      if (!this.trimButtonDisabled(bound)) {
        Vue.set(this.video.edl.trim, bound, parseFloat(this.moveScrubber));
        this.saveMetadata();
      }
    },
    addBlur() {
      this.video.edl.blur.push([0, 0]);
    },
    setBlur(index, bound) {
      if (!this.blurButtonDisabled(index, bound)) {
        const newValue = [
          this.video.edl.blur[index][0],
          this.video.edl.blur[index][1],
        ];
        newValue[bound] = parseFloat(this.moveScrubber);
        Vue.set(this.video.edl.blur, index, newValue);
        this.saveMetadata();
      }
    },
    clearBlur(index) {
      this.video.edl.blur.splice(index, 1);
      this.saveMetadata();
    },
  },
};
</script>

<style scoped>
/* .scrollBlurContainer {
  max-height: 200px;
} */
.blur-enter-active {
  transition: all 0.5s linear;
}
.blur-leave-active {
  transition: all 0.5s linear;
}
.blur-enter, .blur-leave-to
/* .slide-fade-leave-active below version 2.1.8 */ {
  opacity: 0;
}
.expand-enter-active {
  transition: flex 0.5s linear;
}
.expand-leave-active {
  transition: flex 0.5s linear;
}
.expand-enter,
.expand-leave-to {
  flex: 0;
}
</style>
