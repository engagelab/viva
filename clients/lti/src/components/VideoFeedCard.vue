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
  <div class="bg-grey-card text-grey-text rounded-xl w-64">
    <p class="m-2 text-xs p-2">By {{ statusItem.user.name }}</p>
    <img
      class="object-cover h-36 w-full"
      :src="`${baseUrl}/api/video/file?videoref=${statusItem.item.video.details.id}&mode=thumbnail`"
      alt="video thumbnail"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { FeedListItem } from '../types/main'
import { baseUrl } from '@/constants'

export default defineComponent({
  name: 'videofeedcard',
  props: {
    statusItem: { type: Object as PropType<FeedListItem>, required: true },
  },
  setup() {
    return {
      baseUrl,
    }
  },
})
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style type="postcss" scoped></style>
