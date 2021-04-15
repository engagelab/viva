<template>
  <div class="snackbar" :class="snackbarClass">
    <div class="text-sm" style="flex-grow : 1;">{{ snackbar ? snackbar.text : '' }}</div>

    <button class="snackbar-button" @click="closeSnackbar">{{ $t('close') }}</button>
  </div>
</template>

<i18n>
{
  "no": {
    "close": "Lukk"
  },
  "en": {
    "close": "Close"
  }
}
</i18n>

<style scoped>
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

<script>
export default {
  computed: {
    snackbar() {
      return this.$store.getters['general/snackbar'];
    },
    snackbarClass() {
      return {
        'snackbar-show': this.snackbar.visibility === true,
        'snackbar-hidden': this.snackbar.visibility === false,
        'bg-viva-korall': this.snackbar.type == 'error',
        'bg-black': this.snackbar.type != 'error'
      }
    }
  },
  methods: {
    closeSnackbar() {
      const snackbar = {
        visibility: false,
        text: 'Closed',
        type: 'none',
        callback: undefined,
      };
      if (this.snackbar.callback) this.snackbar.callback();
      this.$store.commit('general/setSnackbar', snackbar);
    },
  },
};
</script>
