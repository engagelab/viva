<template>
  <div>
    <div
      v-for="(consent, consentKey) in behandlings"
      :value="consent"
      :key="consentKey"
    >
      <input
        type="radio"
        :value="consentKey"
        v-model="theDataset.consent.kind"
      />
      <label>{{ consent.name }}</label>
      <p class="text-red-600" v-if="theDataset.consent.kind == consentKey">
        {{ consent.description }}
      </p>
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
//import { DatasetSelection, DataPath } from '@/types/main'
// import AnswerInput from '@/components/base/AnswerInput.vue'
import { useDatasetStore } from '@/store/useDatasetStore'
export default defineComponent({
  name: 'consent',
  components: {
    // AnswerInput,
  },
  setup() {
    const { getters: datasetGetters } = useDatasetStore()
    const d = datasetGetters.selectedDataset
    const theDataset = ref(d)
    return {
      theDataset,
      behandlings,
    }
  },
})
</script>
