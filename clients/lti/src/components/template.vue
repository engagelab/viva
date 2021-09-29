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
  <div class="hello">
    <Button @click="monitor()">Monitor</Button>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import router from '../router'
import Button from '../components/base/Button.vue'

const messages = {
  nb_NO: {},
  en: {},
}

export default defineComponent({
  name: 'HelloWorld',
  components: {
    Button,
  },
  setup() {
    const { t } = useI18n({ messages })
    return {
      t,
      monitor: () => router.push('/monitor'),
    }
  },
})
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style type="postcss" scoped></style>
