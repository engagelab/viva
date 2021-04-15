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
        v-for="question in consentQuestions"
        :key="question.key"
        :src="question.source"
      />
    </div>
    <p
      class="ml-4 font-vagBold"
    >{{formattedName}}</p>
  </div>
</template>

<script>
import circle1 from '../../assets/icons/svg/circle1.svg';
import circle2 from '../../assets/icons/svg/circle2.svg';
import circle3 from '../../assets/icons/svg/circle3.svg';
import circle4 from '../../assets/icons/svg/circle4.svg';
import circle5 from '../../assets/icons/svg/circle5.svg';
import circleX from '../../assets/icons/svg/circleX.svg';

export default {
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
      type: Object,
      default: undefined,
    },
    checkboxes: {
      type: String,
      default: 'false',
    },
  },
  data() {
    return {
      circle1,
      circle2,
      circle3,
      circle4,
      circle5,
      circleX
    };
  },
  computed: {
    formattedName() {
      const ref = this.consent.reference
      if (ref.user_identifier == 'child') {
        return ref.user_fullname
      } else if (ref.user_identifier == 'parent') {
        return ref.child_fullname
      } else {
        return ref.username
      }
    },
    consentQuestions() {
      const sortedAnswerKeys = Object.keys(this.consent.questions).sort();
      return sortedAnswerKeys.map((key, index) => {
        const checked = this.consent.questions[key];
        const truthy = new String(checked).toLowerCase() == 'true'
        const source = truthy ? this[`circle${index + 1}`] : this['circleX'];
        return { checked, source, key: `question-circle-id-${index}` };
      });
    },
  },
  methods: {
    inputChanged($event) {
      this.$emit('change', $event.target.checked);
      this.$emit('input-change', {
        checked: $event.target.checked,
        id: this.consent.submission_id,
      });
    },
  },
};
</script>
