<template>
  <button
    class="flex justify-center items-center py-2 bg-white rounded-full shadow-md"
    :class="{ 'text-gray-400' : disabled }"
    :style="{ width: customWidth }"
    @click="click"
  >
    <span v-if="text" class="text-xl">{{ text }}</span>
    <slot></slot>
    <img class="w-24" v-if="logo == 'feide'" src="../../assets/icons/svg/feide.svg" />
    <img class="pl-2 w-6" v-if="logo == 'google'" src="../../assets/icons/svg/google_drive.svg" />
  </button>
</template>

<script>
export default {
  props: {
    logo: {
      type: String,
      default: '',
    },
    text: {
      type: String,
      default: '',
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    customWidth: {
      type: String,
      default: '14rem',
    }
  },
  data() {
    return {};
  },
  methods: {
    click($event) {
      if (!this.disabled) {
        this.$emit('click', $event);
      }
    },
  },
};
</script>

<style scoped>
</style>
