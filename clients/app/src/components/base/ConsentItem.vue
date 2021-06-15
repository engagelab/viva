<template>
  <div class="flex flex-row items-center justify-left">
    <div v-if="checkboxes == 'true'" class="pl-4">
      <input
        type="checkbox"
        :id="`consentCheckbox-${consent.id}`"
        name="Check me!"
        value="true"
        v-model="checkedBox"
        @change="inputChanged"
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
import { defineComponent, computed, PropType, ref, toRefs } from 'vue'
import { Consent } from '@/types/main'
import circle1 from '@/assets/icons/svg/circle1.svg'
import circle2 from '@/assets/icons/svg/circle2.svg'
import circle3 from '@/assets/icons/svg/circle3.svg'
import circle4 from '@/assets/icons/svg/circle4.svg'
import circle5 from '@/assets/icons/svg/circle5.svg'
import circleX from '@/assets/icons/svg/circleX.svg'

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
  emits: ['change', 'update:modelValue'],
  setup(props, context) {
    const checkedBox = ref(false)
    const { consent } = toRefs(props)
    const circles: { [index: number]: unknown } = {
      1: circle1,
      2: circle2,
      3: circle3,
      4: circle4,
      5: circle5,
    }
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
        const checked = consent.value.questions[key]
        const truthy = checked.toLowerCase() === 'true'
        const source = truthy ? circles[index + 1] : circleX
        return { checked, source, key: `question-circle-id-${index}` }
      })
    })
    function inputChanged() {
      consent.value.checked = checkedBox.value
      context.emit('change', {
        checked: checkedBox.value,
        id: consent.value.submission_id,
      })
    }
    return {
      checkedBox,
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
