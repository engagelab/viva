<template>
  <div>
    <h2>{{ t('dataset') }}</h2>

    <p>{{ theDataset }}</p>

    <div class="flex flex-col ...">
      <div>
        <div class="w-4/5 flex justify-between ...">
          <div>
            <AnswerInput
              class="m-2 w-32"
              mode="text"
              :border="false"
              :label="t('Name')"
              :required="true"
              v-model="theDataset.name"
            ></AnswerInput>
          </div>
          <div>
            <AnswerInput
              class="m-2"
              mode="text"
              :border="false"
              :label="t('Owner')"
              :required="true"
              v-model="theDataset.users.owner"
            ></AnswerInput>
          </div>
        </div>
      </div>
      <div>
        <div class="w-4/5 flex justify-between ...">
          <div>
            <AnswerInput
              class="m-2 w-32"
              mode="text"
              :border="false"
              :label="t('Description')"
              :required="true"
              v-model="theDataset.description"
            ></AnswerInput>
          </div>
          <div>
            <AnswerInput
              class="m-2"
              mode="text"
              :border="false"
              :label="t('Data controller group ')"
              :required="true"
              v-model="theDataset.users.adminGroup"
            ></AnswerInput>
          </div>
        </div>
      </div>
      <div>
        <SelectionBox
          id="select-kind"
          style="display: none"
          :label="t('Cohort')"
          :options="SelectionOptionList"
        ></SelectionBox>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { SELECTION } from '@/constants'
// import { useAppStore } from '@/store/useAppStore'
// import { useDatasetStore } from '@/store/useDatasetStore'
import { Dataset } from '@/types/main'
// import SlButton from '@/components/base/SlButton.vue'
import AnswerInput from '@/components/base/AnswerInput.vue'
import SelectionBox from '@/components/base/SelectionBox.vue'

const messages = {
  nb_NO: {
    dataset: 'Registrering',
    Description: 'Til forsiden',
  },
  en: {
    dataset: 'Registrering',
    Description: ' Description',
    'choose one or more': 'Choose one or several kindergartens..',
  },
}

// interface SelectionOptionListItem {
//   itemName: string
//   item: SELECTION
// }

// This component completes setup of the app after login
export default defineComponent({
  name: 'DatasetItem',
  components: {
    // SlButton,
    SelectionBox,
    AnswerInput,
  },
  props: {
    dataset: { type: Object as PropType<Dataset>, required: true },
  },
  setup(props) {
    const { t } = useI18n({ messages })
    // const { getters: appGetters } = useAppStore()

    // const { getters: datasetGetters } = useDatasetStore()
    const d = new Dataset(props.dataset)
    const theDataset = ref(d)
    console.log(Object.values(SELECTION))
    // let SelectionOptionList: SelectionOptionListItem[] = Object.values(
    //   SELECTION
    // ).map((r) => ({
    //   item: r,
    //   itemName: r,
    // }))
    // let SelectionOptionList: SelectionOptionListItem[]
    const initialise = (d: Dataset) => {
      theDataset.value = new Dataset(d)
    }
    initialise(d)
    watch(
      () => props.dataset,
      (newValue: Dataset) => {
        initialise(newValue)
      }
    )
    return {
      t,
      theDataset,
      // SelectionOptionList,
      // Computed
      // Methods
    }
  },
})
</script>

<style scoped></style>
