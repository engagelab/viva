<template>
  <div class="snackbar" :class="snackbarClass">
    <div class="text-sm" style="flex-grow: 1">
      {{ snackbar ? snackbar.text : '' }}
    </div>

    <button class="snackbar-button" @click="closeSnackbar">
      {{ t('close') }}
    </button>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useNotifyStore } from '@/store/useNotifyStore'
const { actions: notifyActions, getters: notifyGetters } = useNotifyStore()
export default defineComponent({
  setup() {
    const { t } = useI18n()
    const snackbar = notifyGetters.snackbar
    const snackbarClass = computed(() => {
      return {
        'snackbar-show': snackbar.value.visibility === true,
        'snackbar-hidden': snackbar.value.visibility === false,
        'bg-viva-korall': snackbar.value.type == 'error',
        'bg-black': snackbar.value.type != 'error',
      }
    })
    function closeSnackbar() {
      const newSnackbar = {
        visibility: false,
        text: 'Closed',
        type: 'none',
        callback: undefined,
      }
      if (snackbar.value.callback) snackbar.value.callback()
      notifyActions.setSnackbar(newSnackbar)
    }
    return {
      t,
      snackbar,
      snackbarClass,
      closeSnackbar,
    }
  },
})
</script>

<style scoped lang="postcss">
/* The snackbar - position it at the bottom and in the middle of the screen */
.snackbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  visibility: hidden; /* Hidden by default. Visible on click */
  width: 400px; /* Set a default minimum width */
  margin-left: -200px; /* Divide value of min-width by 2 */
  color: #fff; /* White text color */
  text-align: center; /* Centered text */
  border-radius: 2px; /* Rounded borders */
  padding: 16px; /* Padding */
  position: fixed; /* Sit on top of the screen */
  z-index: 1; /* Add a z-index if needed */
  left: 50%; /* Center the snackbar */
  bottom: 0; /* 0px from the bottom */
}

.snackbar-show {
  visibility: visible; /* Show the snackbar */
  -webkit-animation: fadein 0.5s forwards;
  animation: fadein 0.5s forwards;
}

.snackbar-hidden {
  visibility: hidden; /* Show the snackbar */
  -webkit-animation: fadeout 0.5s backwards;
  animation: fadeout 0.5s backwards;
}

.snackbar-button {
  cursor: pointer;
  padding: 5px 10px;
  border-radius: 10px;
  background-color: white;
  color: black;
}

/* Animations to fade the snackbar in and out */
@-webkit-keyframes fadein {
  from {
    bottom: -100px;
    opacity: 0;
  }
  to {
    bottom: 0;
    opacity: 1;
  }
}

@keyframes fadein {
  from {
    bottom: -100px;
    opacity: 0;
  }
  to {
    bottom: 0;
    opacity: 1;
  }
}

@-webkit-keyframes fadeout {
  from {
    bottom: -100px;
    opacity: 1;
  }
  to {
    bottom: 0;
    opacity: 0;
  }
}

@keyframes fadeout {
  from {
    bottom: 0;
    opacity: 1;
  }
  to {
    bottom: -100px;
    opacity: 0;
  }
}
</style>
