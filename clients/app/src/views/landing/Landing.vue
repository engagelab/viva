<template>
  <Slider class="flex flex-col flex-grow min-h-0 h-full" :pages="pages" :movePageTo="pageNumber" />
</template>

<script>
import Slider from '../../components/base/Slider.vue';
import constants from '../../constants';

import page0 from './pages/main';
import page1 from './pages/detteErViva';
import page2 from './pages/personvernIOpptak';
import page3 from './pages/loggInn';

export default {
  name: 'Landing',
  components: {
    Slider,
  },
  props: {
    pageNumber: {
      type: Number,
      default: 0,
    },
  },
  data() {
    return {
      pages: [page0, page1, page2, page3],
    };
  },
};
</script>

<i18n>
{
  "no": {
  },
  "en": {
  }
}
</i18n>

<style scoped>
</style>
