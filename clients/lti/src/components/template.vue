<template>
  <div class="hello">
    <Button @click="monitor()">Monitor</Button>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import router from '../router'
import Button from '../components/base/Button.vue'

export default defineComponent({
  name: 'HelloWorld',
  components: {
    Button,
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
