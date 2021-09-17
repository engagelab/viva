<!-- Copyright 2020, 2021 Richard Nesnass, Sharanya Manivasagam and Ole Smørdal

 This file is part of VIVA.

 VIVA is free software: you can redistribute it and/or modify
 it under the terms of the GNU Affero General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 GPL-3.0-only or GPL-3.0-or-later

 VIVA is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU Affero General Public License for more details.

 You should have received a copy of the GNU Affero General Public License
 along with VIVA.  If not, see http://www.gnu.org/licenses/. -->
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
import { useAppStore } from '@/store/useAppStore'
const { actions: appActions, getters: appGetters } = useAppStore()
export default defineComponent({
  setup() {
    const { t } = useI18n()
    const snackbar = appGetters.snackbar
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
      appActions.setSnackbar(newSnackbar)
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
