<template>
  <div class="">
    <div><p class="text-red-600 mt-4 ml-2">Lawful grounds:</p></div>
    <div
      class="ml-8"
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
      <!--div> FORM ID INPUT </div-->
    </div>

    <div>
      <SlButton
        class="self-center rounded-lg"
        id="button-accept"
        @click="showGroups = false"
      >
        Show groups
      </SlButton>
      <div v-for="(group, index) in allGroups" :value="group" :key="index">
        {{ group }}
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
//import { DatasetSelection, DataPath } from '@/types/main'
// import AnswerInput from '@/components/base/AnswerInput.vue'
import SlButton from '@/components/base/SlButton.vue'
import { useDatasetStore } from '@/store/useDatasetStore'
import { useAppStore } from '@/store/useAppStore'
export default defineComponent({
  name: 'consent',
  components: {
    // AnswerInput,
    SlButton,
  },
  setup() {
    const { getters: datasetGetters /*, actions: datasetActions*/ } =
      useDatasetStore()
    const { getters: appGetters } = useAppStore()
    console.log(appGetters.user.value.profile.groups)
    const d = datasetGetters.selectedDataset
    const theDataset = ref(d)
    const showGroups = ref(false)
    const addGroup = () => {
      // datasetActions.addStorageFields('', '', 'new')
    }
    return {
      theDataset,
      behandlings,
      showGroups,
      allGroups: appGetters.user.value.profile.groups,
      g: appGetters.user.value.profile,
      //Methods
      addGroup,
    }
  },
})
</script>
