<template>
  <div class="p-4 text-3xl md:text-3xl w-full relative h-full">
    <div class="w-full my-4 sm:my-10 xl:my-20 flex justify-center">
      <img src="@/assets/images/svg/logo_liggende.svg" />
    </div>
    <SliderItem class="mb-6 cursor-pointer" routePath="/login?page=1">{{ $t('title') }}</SliderItem>
    <SliderItem class="mb-6 cursor-pointer" routePath="/login?page=2">{{ $t('personvern') }}</SliderItem>
    <SliderItem
      v-if="!isLoggedIn"
      class="cursor-pointer text-viva-korall"
      routePath="/login?page=3"
    >{{ $t('LoggIn') }}</SliderItem>
    <SliderItem
      v-if="isLoggedIn"
      class="mb-6 cursor-pointer"
      routePath="/videos/list"
    >{{ $t('MineOpptak') }}</SliderItem>
    <p
      v-if="isLoggedIn"
      class="cursor-pointer text-viva-korall px-4 md:px-12"
      @click="logout()"
    >{{ $t('LoggUt') }}</p>
    <div class="absolute bottom-0 xs:mb-12 sm:mb-20 p-4">
      <p class="ml-2 text-sm">{{ $t('vivaService') }}</p>
      <img v-if="$i18n.locale == 'en'" class="w-64" src="@/assets/icons/svg/uio-english.svg" />
      <img v-else class="w-64" src="@/assets/icons/svg/uio.svg" />
    </div>
  </div>
</template>

<i18n>
{
  "no": {
    "title": "Dette er VIVA",
    "personvern": "Personvern i opptak",
    "LoggIn": "Logg inn",
    "MinneOpptak": "Mine opptak",
    "LoggUt": "Logg ut",
    "vivaService": "VIVA er en tjeneste som leveres av"
  },
  "en": {
    "title": "This is VIVA",
    "personvern": "Privacy in recordings",
    "LoggIn": "Log in",
    "MinneOpptak": "My recordings",
    "LoggUt": "Log out",
    "vivaService": "VIVA is a service delivered by"
  }
}
</i18n>

<script>
import { mapGetters, mapActions } from 'vuex';
import SliderItem from '../../../components/base/SliderItem.vue';
export default {
  components: {
    SliderItem,
  },
  computed: {
    ...mapGetters('general', ['isLoggedIn']),
  },
  methods: {
    ...mapActions('general', ['logout']),
  },
};
</script>

<style scoped>
.bold {
  font-family: 'VAG Rounded Std Bold';
}
</style>
