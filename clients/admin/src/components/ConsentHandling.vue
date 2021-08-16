<template>
  <div class="ml-2">
    <div><p class="text-red-600 my-4">Legal grounds</p></div>

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
      ></AnswerInput>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, Ref } from 'vue'
import { behandlings, CONSENT_TYPES } from '@/constants'
import { DatasetConsent } from '@/types/main'

import AnswerInput from '@/components/base/AnswerInput.vue'
import { useDatasetStore } from '@/store/useDatasetStore'
import { useAppStore } from '@/store/useAppStore'

export default defineComponent({
  name: 'consent',
  components: {
    AnswerInput,
  },
  setup() {
    const { getters: datasetGetters, actions: datasetActions } =
      useDatasetStore()
    const { getters: appGetters } = useAppStore()

    const consentData: Ref<DatasetConsent> = ref({
      kind: CONSENT_TYPES.manuel,
      value: '',
      formId: 0,
    })

    console.log(appGetters.user.value.profile.groups)
    const d = datasetGetters.selectedDataset
    const theDataset = ref(d)
    const showGroups = ref(false)
    const consentDescription = ref(theDataset.value.consent.value)

    const addConsentValue = ($event: InputEvent) => {
      const ie = $event.target as HTMLInputElement
      if (ie.value) {
        datasetActions.addConsentField(ie.value)
      }
    }
    return {
      theDataset,
      consentData,
      CONSENT_TYPES,
      behandlings,
      showGroups,
      g: appGetters.user.value.profile,
      consentDescription,
      //Methods
      addConsentValue,
    }
  },
})
</script>
