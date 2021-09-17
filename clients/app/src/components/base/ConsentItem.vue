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
        value="true"
        v-model="checked"
        @change="inputChanged"
      />
      <!--label :for="`consentCheckbox-${consent.id}`">&nbsp;godkjent</label-->
    </div>
    <div class="ml-4 flex flex-row">
      <img
        class="w-6"
        alt="consent question icon"
        v-for="question in consentQuestions"
        :key="question.key"
        :src="question.source"
      />
    </div>
    <p class="ml-4 font-vagBold">{{ formattedName }}</p>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, PropType, toRefs, watch } from 'vue'
import { Consent } from '@/types/main'
import circle1 from '@/assets/icons/svg/circle1.svg'
import circle2 from '@/assets/icons/svg/circle2.svg'
import circle3 from '@/assets/icons/svg/circle3.svg'
import circle4 from '@/assets/icons/svg/circle4.svg'
import circle5 from '@/assets/icons/svg/circle5.svg'
import circleX from '@/assets/icons/svg/circleX.svg'

const circles = [circle1, circle2, circle3, circle4, circle5, circleX]

export default defineComponent({
  props: {
    consent: {
      type: Object as PropType<Consent>,
      required: true,
    },
    checkboxes: {
      type: String,
      default: 'false',
    },
  },
  emits: ['change'],
  setup(props, context) {
    const { consent } = toRefs(props)
    const checked = ref(consent.value.checked)
    watch(
      () => consent.value.checked,
      (newValue) => {
        checked.value = newValue
      }
    )
    const formattedName = computed(() => {
      const reference = consent.value.reference
      if (reference.user_identifier == 'child') {
        return reference.user_fullname
      } else if (reference.user_identifier == 'parent') {
        return reference.child_fullname
      } else {
        return reference.username
      }
    })
    const consentQuestions = computed(() => {
      const sortedAnswerKeys = Object.keys(consent.value.questions).sort()
      return sortedAnswerKeys.map((key, index) => {
        const check = consent.value.questions[key]
        const truthy = check.toLowerCase() === 'true'
        const source = truthy ? circles[index] : circles[5]
        return {
          source,
          key: `question-circle-id-${index}`,
        }
      })
    })
    function inputChanged() {
      context.emit('change', {
        checked: checked.value,
        id: consent.value.submission_id,
      })
    }
    return {
      circle1,
      circle2,
      circle3,
      circle4,
      circle5,
      circleX,
      checked,
      formattedName,
      consentQuestions,
      inputChanged,
    }
  },
})
</script>
