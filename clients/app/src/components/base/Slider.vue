<template>
  <div>
    <transition
      name="slide-fade"
      :leave-to-class="leaveToClass"
      :enter-class="enterClass"
      mode="out-in"
    >
      <component :is="selectedPage" :stateFromParent="stateToChildren" @slider-back="sliderBack" />
    </transition>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
export default {
  props: {
    pages: {
      type: Array,
      default: () => [],
    },
    movePageTo: {
      type: Number,
      default: 0,
    },
    stateToChildren: {
      type: Object,
      default: () => {},
    },
  },
  data() {
    return {
      selectedPage: undefined,
      previousPages: [],
      leaveToClass: 'slide-fade-leave-to-right',
      enterClass: 'slide-fade-enter-right',
    };
  },
  mounted() {
    const page = this.movePageTo || 0;
    this.selectedPage = this.pages.length > 0 ? this.pages[page] : 0;
  },
  watch: {
    movePageTo(nextPageNumber) {
      const currentPageNumber = this.pages.indexOf(this.selectedPage);
      const direction = currentPageNumber < nextPageNumber ? 'left' : 'right';
      this.enterClass = `slide-fade-enter-${direction}`;
      this.leaveToClass = `slide-fade-leave-to-${direction}`;
      this.selectedPage = this.pages[nextPageNumber];
      if (nextPageNumber === 0) {
        this.previousPages.length = 0;
      } else if (nextPageNumber > currentPageNumber) {
        this.previousPages.push(currentPageNumber);
      }
    },
  },
  methods: {
    sliderBack() {
      const nextPageNumber = this.previousPages.pop() || 0;
      this.$router.push(`/login?page=${nextPageNumber}`);
    },
  },
};
</script>

<style scoped>
input {
  display: inline;
  max-width: 100%;
}
.slide-fade-enter-active {
  transition: all 0.3s linear;
}
.slide-fade-leave-active {
  transition: all 0.3s linear;
}
.slide-fade-enter-right {
  transform: translateX(-100px);
  opacity: 0;
  position: absolute;
}
.slide-fade-leave-to-right {
  transform: translateX(100px);
  opacity: 0;
}
.slide-fade-enter-left {
  transform: translateX(100px);
  opacity: 0;
  position: absolute;
}
.slide-fade-leave-to-left {
  transform: translateX(-100px);
  opacity: 0;
}
</style>
