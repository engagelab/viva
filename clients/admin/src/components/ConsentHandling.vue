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
import { defineComponent, ref, Ref, PropType, toRefs, watch } from 'vue'
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
  props: {
    consent: { type: Object as PropType<DatasetConsent>, required: true },
  },
  emits: ['updated'],
  setup(props, context) {
    const { consent } = toRefs(props)
    const { getters: appGetters } = useAppStore()
    const { t } = useI18n({ messages })
    const consentData: Ref<DatasetConsent> = ref({
      kind: CONSENT_TYPES.manual,
      value: '',
      formId: 0,
    })

    const resetData = (c: DatasetConsent) => {
      consentData.value.kind = c.kind
      consentData.value.value = c.value
      consentData.value.formId = c.formId
    }

    watch(
      () => consent.value,
      (c) => {
        if (c) resetData(c)
      }
    )
    resetData(consent.value)

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
