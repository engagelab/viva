<template>
  <div class="ml-2">
    <p class="text-red-600 my-4">Legal grounds</p>

    <div
      class="flex-flex-col"
      v-for="(consent, consentKey) in behandlings"
      :value="consent"
      :key="consentKey"
    >
      <input
        class="mr-1 mb-1"
        type="radio"
        :id="`consent-option-${consentKey}`"
        :value="consentKey"
        v-model="consentData.kind"
        @change="updatedConsent"
      />
      <label class="mr-2" :for="`consent-option-${consentKey}`">{{
        consent.name
      }}</label>
      <AnswerInput
        v-if="consentKey === consentData.kind"
        class="m-2"
        mode="text"
        :border="false"
        label="Description"
        :placeholder="behandlings[consentData.kind].description"
        v-model="consentData.value"
        @change="updatedConsent"
      ></AnswerInput>
      <AnswerInput
        v-if="
          consentKey === consentData.kind &&
          consentKey === CONSENT_TYPES.samtykke
        "
        class="m-2"
        mode="text"
        :border="false"
        label="Nettskjema Form ID"
        placeholder="Nettskjema form ID eg. 12345678"
        v-model="consentData.formId"
        @change="updatedConsent"
      ></AnswerInput>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, Ref } from 'vue'
import { behandlings, CONSENT_TYPES } from '@/constants'
import { DatasetConsent } from '@/types/main'
import { useI18n } from 'vue-i18n'
import AnswerInput from '@/components/base/AnswerInput.vue'
import { useAppStore } from '@/store/useAppStore'
const messages = {
  nb_NO: {
    dataset: 'Registrering',
  },
  en: {
    dataset: 'Registrering',
  },
}
export default defineComponent({
  name: 'consentHandling',
  components: {
    AnswerInput,
  },
  emits: ['updated'],
  setup(props, context) {
    const { getters: appGetters } = useAppStore()
    const { t } = useI18n({ messages })
    const consentData: Ref<DatasetConsent> = ref({
      kind: CONSENT_TYPES.manuel,
      value: '',
      formId: 0,
    })

    function updatedConsent() {
      context.emit('updated', consentData.value)
    }

    return {
      t,
      consentData,
      CONSENT_TYPES,
      behandlings,
      g: appGetters.user.value.profile,
      updatedConsent,
    }
  },
})
</script>
