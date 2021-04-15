<template>
  <div class="flex flex-col flex-grow min-h-0">
    <div class="flex flex-row justify-between p-4">
      <SVGSymbol
        class="text-viva-korall fill-current self-start p-2"
        applyClasses="w-4 md:w-8"
        @click.native="back()"
        width="25"
        rotation="180"
      ></SVGSymbol>
    </div>
    <div>
      <p class="p-4">{{ selectedVideo.errorInfo }}</p>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import SVGSymbol from '../../components/base/SVGSymbol.vue';
export default {
  components: {
    SVGSymbol,
  },
  computed: {
    ...mapGetters('video', ['selectedVideo']),
  },
  methods: {
    back() {
      this.$router.push('/videos/list');
    },
  },
};
</script>
<style scoped>

</style>
