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
  <div class="flex flex-row items-center justify-left">
    <div v-if="checkboxes == 'true'" class="pl-4">
      <input
        type="checkbox"
        :id="`consentCheckbox-${consent.id}`"
        name="Check me!"
        :checked="checked"
        @change="inputChanged($event)"
      />
      <!--label :for="`consentCheckbox-${consent.id}`">&nbsp;godkjent</label-->
    </div>
    <div class="ml-4 flex flex-row">
      <img
        class="w-6"
        alt="consent question"
        v-for="question in consentQuestions"
        :key="question.key"
        :src="question.source"
      />
    </div>
    <p class="ml-4 font-vagBold">{{ formattedName }}</p>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, PropType } from 'vue'
import { Consent } from '@/types/main'
import circle1 from '@/assets/icons/svg/circle1.svg'
import circle2 from '@/assets/icons/svg/circle2.svg'
import circle3 from '@/assets/icons/svg/circle3.svg'
import circle4 from '@/assets/icons/svg/circle4.svg'
import circle5 from '@/assets/icons/svg/circle5.svg'
import circleX from '@/assets/icons/svg/circleX.svg'

export default defineComponent({
  model: {
    prop: 'checked',
    event: 'change',
  },
  props: {
    checked: {
      type: Boolean,
      default: false,
    },
    consent: {
      type: Object as PropType<Consent>,
      required: true,
    },
    checkboxes: {
      type: String,
      default: 'false',
    },
  },
  setup(props, context) {
    const circles: { [index: number]: unknown } = {
      1: circle1,
      2: circle2,
      3: circle3,
      4: circle4,
      5: circle5,
    }
    const formattedName = computed(() => {
      const ref = props.consent.reference
      if (ref.user_identifier == 'child') {
        return ref.user_fullname
      } else if (ref.user_identifier == 'parent') {
        return ref.child_fullname
      } else {
        return ref.username
      }
    })
    const consentQuestions = computed(() => {
      const sortedAnswerKeys = Object.keys(props.consent.questions).sort()
      return sortedAnswerKeys.map((key, index) => {
        const checked = props.consent.questions[key]
        const truthy = checked.toLowerCase() === 'true'
        const source = truthy ? circles[index + 1] : circleX
        return { checked, source, key: `question-circle-id-${index}` }
      })
    })
    function inputChanged($event: InputEvent) {
      const ie = $event.target as HTMLInputElement
      if ($event) {
        context.emit('input-change', {
          checked: ie.value === 'true',
          id: props.consent.submission_id,
        })
      }
    }
    return {
      formattedName,
      consentQuestions,
      inputChanged,
      circle1,
      circle2,
      circle3,
      circle4,
      circle5,
      circleX,
    }
  },
})
</script>
