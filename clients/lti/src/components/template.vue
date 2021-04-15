<template>
  <div class="hello">
    <SlButton @click="monitor()">Monitor</SlButton>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import router from '../router'
import SlButton from '../components/base/SlButton.vue'

export default defineComponent({
  name: 'HelloWorld',
  components: {
    SlButton,
  },
  setup() {
    return {
      monitor: () => router.push('/monitor'),
    }
  },
})
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style type="postcss" scoped></style>
