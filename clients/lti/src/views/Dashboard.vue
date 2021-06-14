<template>
  <div class="relative w-screen h-screen overflow-hidden">
    <div
      class="relative flex md:flex-row flex-col h-full justify-center bg-blue-button"
    >
      Welcome to the Dashboard. Your username is: {{ user }}
      <SlButton class="m-4" @click="monitor()">Monitor</SlButton>
    </div>
  </div>
</template>

<style lang="stylus" scoped></style>

<script lang="ts">
// @ is an alias to /src
import { defineComponent, ref, Ref } from 'vue'
import router from '../router'

import { User } from '../types/main'
import SlButton from '@/components/base/SlButton.vue'
export default defineComponent({
  name: 'Dashboard',
  components: {
    SlButton,
  },
  setup() {
    let user: Ref<User> = ref(new User())
    // userActions.getMyUser().then(() => {
    //   user.value = userGetters.myUser.value
    // })

    return {
      monitor: () => router.push('/monitor'),
      user,
    }
  },
})
</script>

<style scoped lang="postcss">
.slide-rightmenu-enter-from {
  transform-box: border-box;
  transform: translateX(100%);
}
.slide-rightmenu-enter-active,
.slide-rightmenu-leave-active {
  transition: all 1s ease;
}
.slide-rightmenu-leave-to {
  transform-box: border-box;
  transform: translateX(100%);
}

.widthTransition {
  transition: transform 1s ease;
}
@responsive {
  .translate-x-full {
    -webkit-transform: translateX(66%);
    transform: translateX(66%);
  }

  .-translate-x-full {
    -webkit-transform: translateX(-50%);
    transform: translateX(-50%);
  }

  .translate-x-0 {
    -webkit-transform: translateX(16.6 %);
    transform: translateX(16.6%);
  }
}
/* .slidemenu-right-enter-from {
  transform: translateX(-100%);
}
.slidemenu-right-enter-active,
.slidemenu-right-leave-active {
  transition: all 1s ease;
}
.slidemenu-right-leave-to {
  transform: translateX(100%);
} */
</style>
