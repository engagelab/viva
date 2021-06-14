<template>
  <div
    class="relative flex md:flex-row flex-col h-full justify-center bg-blue-button"
  >
    Fetch videos from s3 bucket
    <p class="absolute bottom-0 right-0 text-xs m-2">Welcome</p>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  computed,
  onMounted,
  ref,
  Ref,
  onBeforeUnmount,
} from 'vue'
// import router from '../../router'
import moment from 'moment'
import { useAppStore } from '../../store/useAppStore'
import { LocalUser } from '../../types/main'
import { useVideoStore } from '../../store/useVideoStore'
const jwtExpiryConstant = process.env.VUE_APP_JWT_EXPIRY || '0'
const jwtExpiry = Number.parseInt(jwtExpiryConstant)

interface LocalUserWithExpiry extends LocalUser {
  expiresIn: Ref<string>
  valid: Ref<boolean>
}

export default defineComponent({
  name: 'Login',
  setup() {
    const { getters: appGetters } = useAppStore()
    const { actions: videoActions } = useVideoStore()
    const mode = ref('login')
    const pinCode = ref('')
    const showTestLogin = ref(false)
    const selectedUser = ref()
    const localUsers = Object.values(appGetters.persistedLocalUsers.value)
    const localUsersWithExpiry: LocalUserWithExpiry[] = localUsers.map(
      (lu) => ({
        ...lu,
        expiresIn: ref(''),
        valid: ref(false),
      })
    )
    onMounted(() => {
      // Fetch video and video Metadata
      videoActions.getVideoMetadata().catch((err) => {
        console.log(err)
      })
    })

    function momentFormat(date: Date) {
      return moment(date).format('ddd, hA')
    }

    showTestLogin.value = true

    function selectUser(u: LocalUser) {
      localUsers.forEach((u) => (u.selected = false))
      u.selected = true
      selectedUser.value = u
      mode.value = 'pp'
    }

    const calculateCountdown = () => {
      const dateNow = new Date()
      localUsersWithExpiry.forEach((lu: LocalUserWithExpiry) => {
        const countdown =
          jwtExpiry - moment(dateNow).diff(lu.lastLogin, 'seconds')
        lu.expiresIn.value = moment.duration(countdown, 'seconds').humanize()
        lu.valid.value = countdown > 0
      })
    }
    calculateCountdown()
    const countDownInterval = setInterval(() => {
      calculateCountdown()
    }, 10000)
    onBeforeUnmount(() => {
      clearInterval(countDownInterval)
    })

    const filteredLocalUsersWithExpiry = computed(() =>
      localUsersWithExpiry.filter((u) => u.valid.value)
    )

    return {
      status: appGetters.status,
      filteredLocalUsersWithExpiry,
      momentFormat,
      showTestLogin,

      selectUser,
      pinCode,
      mode,
      selectedUser,
    }
  },
})
</script>

<i18n>
{
  "no": {
  },
  "en": {
  }
}
</i18n>

<style scoped></style>
