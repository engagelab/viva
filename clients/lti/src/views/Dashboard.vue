<template>
  <div class="relative w-screen h-screen overflow-hidden"></div>
</template>

<style lang="stylus" scoped></style>

<script lang="ts">
// @ is an alias to /src
import { defineComponent, computed, ref } from 'vue'
import router from '@/router'
import { useAppStore } from '@/store/useAppStore'
import { useUserStore } from '@/store/useUserStore'
import { USER_ROLE } from '@/constants'

export default defineComponent({
  name: 'Dashboard',
  setup() {
    const { actions: appActions, getters: appGetters } = useAppStore()
    const { getters: userGetters, actions: userActions } = useUserStore()
    const hasMonitorRole = computed(() =>
      userActions.hasMinimumRole(userGetters.myUser.value, USER_ROLE.monitor)
    )
    const rememberMe = ref(false)
    const rightMenuTransitionName = ref('slideprev')
    const rightMenuActive = ref(true)
    const rightMenuLevel = ref('main')
    appActions.setFade(false)

    return {
      monitor: () => router.push('/monitor'),

      rememberMe,
      localUser: appGetters.currentLocalUser,
      hasMonitorRole,

      rightMenuActive,
      rightMenuLevel,
      rightMenuTransitionName,
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
