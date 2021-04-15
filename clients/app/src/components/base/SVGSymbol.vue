<template>
  <!--div :style="{ 'width' : `${width}px` }"-->
  <div>
    <!-- V Symbol -->
    <svg
      v-if="symbol == 'viva'"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 25 27.59"
      :class="applyClasses"
      :style="rotate"
    >
      <g id="vivaSvgPAth" data-name="vivaSvgPath1">
        <path
          d="M22.77,9.83a4.46,4.46,0,0,1,1.89,5.57,4.44,4.44,0,0,1-2,2.36L6.71,27a4.4,4.4,0,0,1-2.23.6,4.47,4.47,0,0,1-2.24-8.35l9.47-5.47L2.31,8.35A4.48,4.48,0,1,1,6.79.6l16,9.23"
        />
      </g>
    </svg>

    <!-- GDrive Symbol -->
    <svg
      v-if="symbol == 'gdrive'"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 25 21"
      :class="applyClasses"
      :style="rotate"
    >
      <g id="gdriveSvgPAth" data-name="gdriveSvgPath1">
        <path
          d="M8.14.36l3.49,6.13L3.41,20.62,0,14.38ZM5.06,21H21.31L25,14.72H8.71Zm19.75-7.86L16.83,0l-7,0,7.57,13.15Z"
        />
      </g>
    </svg>

    <!-- Record Button -->
    <svg
      v-if="symbol == 'record'"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 132 132"
      :class="applyClasses"
      :style="rotate"
    >
      <g id="recordButton" data-name="recordButtonPath1">
        <path
          class="white"
          d="M66,0a66,66,0,1,0,66,66A66,66,0,0,0,66,0Zm0,119a53,53,0,1,1,53-53A53,53,0,0,1,66,119Z"
        />
        <circle class="red" cx="66" cy="66" r="50" />
      </g>
    </svg>

    <!-- Stop Recording Button -->
    <svg
      v-if="symbol == 'stopRecord'"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 132 132"
      :class="applyClasses"
      :style="rotate"
    >
      <g id="stopRecordingButton" data-name="stopRecordingButtonPath1">
        <path
          class="white"
          d="M66,0a66,66,0,1,0,66,66A66,66,0,0,0,66,0Zm0,119a53,53,0,1,1,53-53A53,53,0,0,1,66,119Z"
        />
        <rect class="red" x="42" y="42" width="48" height="48" rx="8" />
      </g>
    </svg>

    <!-- Play Button -->
    <svg
      v-if="symbol == 'play'"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 30 30"
      :class="applyClasses"
      :style="rotate"
    >
      <g id="playButton" data-name="playButtonPath1">
        <path
          class="white"
          d="M0,28.55V.64A.64.64,0,0,1,1,.09L24.69,14.4a.64.64,0,0,1,0,1.1L1,29.1A.64.64,0,0,1,0,28.55Z"
        />
      </g>
    </svg>

    <!-- Stop Button -->
    <svg
      v-if="symbol == 'stop'"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 40 40"
      :class="applyClasses"
      :style="rotate"
    >
      <g id="stopButton" data-name="stopButtonPath1" class="white">
        <path
          d="M20,40A20,20,0,1,1,40,20,20,20,0,0,1,20,40ZM20,1.53A18.47,18.47,0,1,0,38.47,20,18.48,18.48,0,0,0,20,1.53Z"
        />
        <rect x="13.84" y="13.84" width="12.31" height="12.31" />
      </g>
    </svg>

    <!-- Accept Button -->
    <svg
      v-if="symbol == 'accept'"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 35 27.912"
      :class="applyClasses"
      :style="rotate"
    >
      <g id="acceptButton" data-name="acceptButtonPath1">
        <polygon points="11.66 27.91 0 16.05 4.15 11.97 11.65 19.6 30.84 0 35 4.07 11.66 27.91" />
      </g>
    </svg>

    <!-- Wait Button -->
    <svg
      v-if="symbol == 'wait'"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 50 50"
      :class="applyClasses"
      :style="rotate"
    >
      <path
        d="M25,50A25,25,0,0,1,7.32,7.32L8.74,8.74A23,23,0,1,0,26,2V13H24V0h1a25,25,0,0,1,0,50Z"
      />
      <path
        d="M22.88,27.12C21.71,26,12.27,12.27,12.27,12.27S26,21.71,27.12,22.88a3,3,0,0,1-4.24,4.24Z"
      />
    </svg>

    <!-- Remove Button -->
    <svg
      v-if="symbol == 'remove'"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 35 35"
      :class="applyClasses"
      :style="rotate"
    >
      <g id="removeButton" data-name="removeButtonPath1" class="black">
        <rect
          x="16.15"
          y="-5.9"
          width="2.7"
          height="46.8"
          transform="translate(-7.25 17.5) rotate(-45)"
        />
        <rect
          x="-5.9"
          y="16.16"
          width="46.8"
          height="2.7"
          transform="translate(-7.26 17.5) rotate(-45)"
        />
      </g>
    </svg>

    <!-- addNew Button -->
    <svg
      v-if="symbol == 'addNew'"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 35 35"
      :class="applyClasses"
      :style="rotate"
    >
      <g id="addNewButton" data-name="addNewButtonPath1" class="black">
        <polygon
          points="35 16 19 16 19 0 16 0 16 16 0 16 0 19 16 19 16 35 19 35 19 19 35 19 35 16"
        />
      </g>
    </svg>

    <!-- edit Button -->
    <svg
      v-if="symbol == 'edit'"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 30 30"
      :class="applyClasses"
      :style="rotate"
    >
      <path
        d="M29.53,5.6l-1.7,1.7L22.92,2.39l1.7-1.7a2,2,0,0,1,2.81,0l2.1,2.11A2,2,0,0,1,29.53,5.6Z"
        transform="translate(-0.11 -0.11)"
      />
      <polygon
        points="5.66 25.74 4.26 25.74 4.26 24.34 23.28 5.31 21.53 3.56 1.46 23.62 0 30 6.38 28.54 26.44 8.47 24.69 6.72 5.66 25.74"
      />
    </svg>

    <!-- scissor Button -->
    <svg
      v-if="symbol == 'scissor'"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 45 46.88"
      :class="applyClasses"
      :style="rotate"
    >
      <g id="scissorButton" data-name="scissorButtonPath1">
        <path
          d="M10.07,0a2.5,2.5,0,0,0-.46.09L8.67.37l3,10.64,9.09,6.58C13.77,1.53,11.28-.06,10.07,0ZM.86,5.55l-.55.76c-.78,1.1-.81,3,8.72,12,4.82,4.53,9,7.85,9,7.9l.28.21h.33c2.81,0,10.47.13,14,3.66,3.2,3.2,5.89,3.17,6.5,3.17a5.86,5.86,0,0,0,0-11.71A9.18,9.18,0,0,0,34,23.44a87.63,87.63,0,0,1-12.41-2.89Zm17.8,16a1,1,0,1,1,0,1.95,1,1,0,0,1,0-1.95Zm20.49,2.93a2.93,2.93,0,1,1-2.93,2.92A2.92,2.92,0,0,1,39.15,24.45Zm-19.82,3.9A12.11,12.11,0,0,1,19.64,32v.27a13.51,13.51,0,0,0,1.07,4.3c1.69,3.67,5.5,8.18,7.52,9.45a5.93,5.93,0,0,0,3.11.88,4.87,4.87,0,0,0,2.63-9,13,13,0,0,1-3.08-3.78c-.46-1-1.46-2.83-3.45-2.83a2.76,2.76,0,0,1-2.86-2.5A41.7,41.7,0,0,0,19.33,28.35Zm7.14,5.85a1.94,1.94,0,0,1,1.76,1.13,15.59,15.59,0,0,0,4.15,5A1.94,1.94,0,0,1,33,43a1.91,1.91,0,0,1-2.68.61A18.78,18.78,0,0,1,24.7,37a2,2,0,0,1-.06-1.5,1.89,1.89,0,0,1,1-1.09A1.84,1.84,0,0,1,26.47,34.2Z"
        />
      </g>
    </svg>

    <!-- blur Button -->
    <svg
      v-if="symbol == 'blur'"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 40 40"
      :class="applyClasses"
      :style="rotate"
    >
      <g id="blurButton" data-name="blurButtonPath1">
        <path
          d="M36.54,17.59,20,0,3.46,17.59C.14,21.12-.85,25.52.75,29.67S7.84,40,20,40s17.68-6.24,19.25-10.33S39.86,21.12,36.54,17.59ZM35,28.75c-1.2,3.13-5.85,7.93-15,7.93S6.24,31.88,5,28.75a8.62,8.62,0,0,1,2.08-9.26L20,5.79l12.88,13.7A8.62,8.62,0,0,1,35,28.75Z"
        />
      </g>
    </svg>

    <!-- showList Button -->
    <svg
      v-if="symbol == 'showList'"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 30 30"
      :class="applyClasses"
      :style="rotate"
    >
      <g id="showListButton" data-name="showListPath1" class="white">
        <path class="cls-1" d="M45,31H15V15H45ZM17,29H43V17H17Z" transform="translate(-15 -15)" />
        <rect class="cls-1" y="21" width="30" height="2" />
        <rect class="cls-1" y="28" width="30" height="2" />
      </g>
    </svg>

    <!-- Delete button -->
    <svg
      v-if="symbol == 'delete'"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 36 50"
      :class="applyClasses"
      :style="rotate"
    >
      <g id="deleteButton" data-name="deleteButtonPath1" class="white">
        <path
          d="M26,8H10V4a4,4,0,0,1,4-4h8a4,4,0,0,1,4,4ZM12,6H24V4a2,2,0,0,0-2-2H14a2,2,0,0,0-2,2Z"
        />
        <rect y="6" width="36" height="2" />
        <rect x="17" y="12" width="2" height="32" />
        <rect
          x="8.49"
          y="27"
          width="32.02"
          height="2"
          transform="translate(-4.25 51.61) rotate(-88.21)"
        />
        <rect
          x="10.5"
          y="11.99"
          width="2"
          height="32.02"
          transform="translate(-0.87 0.37) rotate(-1.79)"
        />
        <path
          d="M26.19,50H9.81a5,5,0,0,1-5-4.76L3,8.05,5,8,6.81,45.14a3,3,0,0,0,3,2.86H26.19a3,3,0,0,0,3-2.86L31,8l2,.1L31.18,45.24A5,5,0,0,1,26.19,50Z"
        />
      </g>
    </svg>

    <!-- Add (viva style) button -->
    <svg
      v-if="symbol == 'addViva'"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 50 50"
      :class="applyClasses"
      :style="rotate"
    >
      <path class="cls-1" d="M35.86,33.6" />
      <path class="cls-1" d="M33.9,31.56" />
      <path class="cls-1" d="M22.11,31.56" />
      <path class="cls-1" d="M34.17,7" />
      <path
        class="cls-1"
        d="M45.07,18.21l-39.5,0a5.58,5.58,0,0,0,0,11.15l13.53,0,26.12-.11a5.58,5.58,0,0,0-.16-11.06Z"
      />
      <path class="cls-1" d="M30.31,26" />
      <path
        class="cls-1"
        d="M19.41,4.93l0,39.5a5.58,5.58,0,1,0,11.15,0l0-13.53L30.46,4.77a5.57,5.57,0,0,0-11,.16Z"
      />
    </svg>

    <!-- Padlock -->
    <svg
      v-if="symbol == 'padlock'"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 35 40"
      :class="applyClasses"
      :style="rotate"
    >
      <path
        id="_x30__2_"
        d="M17,0.01c-7,0-12,4.17-12,11v6H3c-2,0-3,1-3,3v17c0,0.98,1,3,3,3h29.38C34,39.99,35,37.98,35,37V20
        c0-2-1-3.01-3-3.01h-2v-6c0-7-5-11-12-11L17,0.01z M17,4.01h1c7,0,7,6,7,8v4H10v-4C10,10.01,10,4.01,17,4.01z"
      />
    </svg>
  </div>
</template>

<script>
export default {
  props: {
    applyClasses: {
      type: String,
      default: '',
    },
    rotation: {
      type: String,
      default: '0',
    },
    symbol: {
      type: String,
      default: 'viva',
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {};
  },
  computed: {
    rotate() {
      const saturation = this.disabled ? 0 : 1;
      return `transform: rotate(${this.rotation}deg); filter: saturate(${saturation});`;
    },
  },
};
</script>

<style scoped>
.red {
  fill: #fc3b2f;
}
.white {
  fill: #ffffff;
}
.black {
  fill: #000000;
}
.green {
  fill: green;
}
</style>
