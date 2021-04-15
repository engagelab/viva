<template>
  <div class="flex flex-row items-center justify-between px-4 md:px-12" :class="backgroundColour" @click="clickItem()">
    <div class="max-w-24">
      <slot></slot>
    </div>
    <div class="pl-4">
      <SVGSymbol
        class="p-2 fill-current"
        :class="disabled ? 'text-gray-400' : 'text-viva-korall'"
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
    routePath: {
      type: String,
      default: '',
    },
    disabled: {
      type: Boolean,
      default: false,
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
    clickItem() {
      if (!this.disabled) {
        this.itemSelected = true;
        setTimeout(() => {
          this.$router.push(this.routePath);
        }, 100);
      }
    },
  },
};
</script>

<style scoped>
</style>
