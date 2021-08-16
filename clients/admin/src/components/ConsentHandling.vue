<template>
  <div class="">
    <div><p class="text-red-600 mt-4 ml-2">Lawful grounds:</p></div>
    <div
      class="ml-8 flex-flex-col"
      v-for="(consent, consentKey) in behandlings"
      :value="consent"
      :key="consentKey"
    >
      <div class="flex flex-row">
        <input
          type="radio"
          :value="consentKey"
          v-model="theDataset.consent.kind"
        />
        <label class="">{{ consent.name }}</label>

        <input
          v-if="theDataset.consent.kind == consentKey"
          type="text"
          class="text-red-600 ml-4 w-2/3"
          :placeholder="behandlings[theDataset.consent.kind].description"
          @change="addConsentValue"
        />

        <div
          class="flex flex-row my-2"
          v-if="
            theDataset.consent.kind == consentKey && consentKey == 'samtykke'
          "
        >
          <p>Form Id:</p>
          <input type="text" class="ml-4" v-model="theDataset.consent.formId" />
        </div>
      </div>
    </div>

    <!-- <AnswerInput
      class="m-2"
      mode="singleChoice"
      :border="false"
      :options="Object.keys(behandlings)"
      label="Consent"
      v-model="theDataset.consent.kind"
    ></AnswerInput> -->
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import { behandlings } from '@/constants'

// import AnswerInput from '@/components/base/AnswerInput.vue'
import { useDatasetStore } from '@/store/useDatasetStore'
import { useAppStore } from '@/store/useAppStore'

export default defineComponent({
  name: 'consent',
  setup() {
    const { getters: datasetGetters, actions: datasetActions } =
      useDatasetStore()
    const { getters: appGetters } = useAppStore()

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
