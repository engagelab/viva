<!-- Designed and developed by Richard Nesnass, Hoang Bao Ngo, Sharanya Manivasagam, Ole Smørdal, Ingvill Rasmussen, and Jesus Gonzalez Torres

 This file is part of Talkwall.

 Talkwall is free software: you can redistribute it and/or modify
 it under the terms of the GNU Affero General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 GPL-3.0-only or GPL-3.0-or-later

 Talkwall is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU Affero General Public License for more details.

 You should have received a copy of the GNU Affero General Public License
 along with Talkwall.  If not, see http://www.gnu.org/licenses/. -->

<template>
  <div class="locale-select">
    <select v-model="$i18n.locale">
      <option v-for="(lang, i) in langs" :key="`Lang${i}`" :value="lang">
        {{ getFlag(lang) }}
      </option>
    </select>
  </div>
</template>

<style>
.locale-select {
  display: inline;
}
</style>

<script lang="ts">
import { defineComponent } from 'vue'
export default defineComponent({
  setup() {
    function getFlag(lang: string): string {
      return lang === 'en' ? '🇬🇧' : '🇳🇴'
    }
    const langs = ['no', 'en']
    return {
      langs,
      getFlag,
    }
  },
})
</script>
