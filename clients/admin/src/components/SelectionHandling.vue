<template>
  <div class="ml-2">
    <p class="text-red-600 my-4">Selection Priority</p>
    <div>
      <select
        span
        ref="selects"
        @change="addSelectionPriority"
        class="select"
        style="width: 150px"
        placeholder
        v-model="currentSelection"
      >
        <option :value="0">{{ $t('add-subject') }}</option>
        <option
          v-for="(selection, index) in selectionOptionList"
          :value="selection"
          :key="index"
        >
          {{ selection.item }}
        </option>
      </select>
      <SelectionBox
        id="select-kind"
        :label="t('selection')"
        :options="selectionOptionList"
        v-model="currentSelection"
        @change="addSelectionPriority"
      ></SelectionBox>
    </div>
    <div class="flex justify-start ...">
      <div
        v-for="(selection, index) in dataset.selectionPriority"
        :key="index"
        class="flex"
      >
        <p class="ml-4">{{ selection }}</p>
        <p>*</p>
        <p class="ml-2" v-if="dataset?.selectionPriority.length != index + 1">
          >
        </p>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, Ref } from 'vue'
import { behandlings, CONSENT_TYPES } from '@/constants'
import { DatasetSelection } from '@/types/main'

// import AnswerInput from '@/components/base/AnswerInput.vue'
import { useDatasetStore } from '@/store/useDatasetStore'
import { useAppStore } from '@/store/useAppStore'

interface OptionListItem {
  itemName: string
  item: string
}

export default defineComponent({
  name: 'selectionHandling',
  components: {
    // AnswerInput,
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

    const currentSelection: Ref<OptionListItem> = ref({
      item: '',
      itemName: '',
    })

    //Methods
    // Add selection priority
    const addSelectionPriority = () => {
      if (currentSelection.value)
        datasetActions.addSelectionPriority(currentSelection.value.itemName)
    }

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
    const addSubset = () => {
      let subset: DatasetSelection = {
        title: currentSubset.value,
        selection: {},
      }

      datasetActions.addSelection(dataset.value.selectionPriority[0], subset)
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
