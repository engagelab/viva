<template>
  <div
    class="flex flex-row items-center justify-between viva-item max-w-xs"
    :class="backgroundColour"
    @click="clickItem()"
  >
    <div class="max-w-12">
      <p class="font-vagBold">
        <strong>{{ title }}</strong>
      </p>
      <p>{{ description }}</p>
    </div>
    <div class="pl-4">
      <SVGSymbol
        class="p-2 text-viva-korall fill-current cursor-pointer"
        applyClasses="w-4 md:w-8"
        rotation="0"
      />
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import SVGSymbol from '../../components/base/SVGSymbol';
import constants from '../../constants';

const { baseUrl } = constants;
export default {
  components: {
    SVGSymbol,
  },
  props: {
    title: {
      type: String,
      default: undefined,
    },
    description: {
      type: String,
      default: undefined,
    },
    data: {
      type: Object,
      default: undefined,
    },
    keyName: {
      type: String,
      default: undefined,
    },
  },
  computed: {
    backgroundColour() {
      return this.itemSelected ? 'bg-white' : '';
    },
  },
  data() {
    return {
      itemSelected: false,
    };
  },
  methods: {
    ...mapGetters('general', ['useCordova', 'isLoggedIn']),
    ...mapActions('general', ['logout']),
    clickItem() {
      this.itemSelected = true;
      setTimeout(() => {
        this.$emit('slider-change', { data: this.data, keyName: this.keyName });
      }, 100);
    },
  },
};
</script>

<style scoped>
</style>
