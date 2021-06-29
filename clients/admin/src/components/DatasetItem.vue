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
              :label="t('name')"
              :required="true"
              v-model="theDataset.name"
            ></AnswerInput>
          </div>
          <div>
            <AnswerInput
              class="m-2"
              mode="text"
              :border="false"
              :label="t('owner')"
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
              :label="t('description')"
              :required="true"
              v-model="theDataset.description"
            ></AnswerInput>
          </div>
          <div>
            <!-- TODO: should be canvas course Ids -->
            <!-- <SelectionBox
              id="select-kind"
              :label="t('data controller group')"
              :options="SelectionOptionList"
              v-model="theDataset.users.adminGroup"
            ></SelectionBox> -->
          </div>
        </div>
      </div>
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
            v-for="(selection, index) in SelectionOptionList"
            :value="selection"
            :key="index"
          >
            {{ selection.item }}
          </option>
        </select>
        <SelectionBox
          id="select-kind"
          :label="t('selection')"
          :options="SelectionOptionList"
          v-model="currentSelection"
          @change="addSelectionPriority"
        ></SelectionBox>
      </div>
      <div class="flex justify-start ...">
        <p>Selection Priority:</p>
        <div
          v-for="(selection, index) in theDataset?.selectionPriority"
          :key="index"
          class="flex"
        >
          <p class="ml-4">{{ selection }}</p>
          <p>*</p>
          <p
            class="ml-2"
            v-if="theDataset?.selectionPriority.length != index + 1"
          >
            >
          </p>
        </div>
      </div>
      <div><p>Instances</p></div>
      <SelectionItem></SelectionItem>

      <SlButton
        class="ml-4 p-2 self-center capitalize bg-green-highlight rounded-lg"
        id="button-accept"
        @click="updateDataset"
        >{{ t('save') }}
      </SlButton>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, Ref, computed /*watch*/ } from 'vue'
import { useI18n } from 'vue-i18n'

import { SELECTION } from '@/constants'
// import { useAppStore } from '@/store/useAppStore'
import { useDatasetStore } from '@/store/useDatasetStore'
import { DatasetSelection } from '@/types/main'
import SelectionItem from '@/components/SelectionItem.vue'
import AnswerInput from '@/components/base/AnswerInput.vue'
import SelectionBox from '@/components/base/SelectionBox.vue'

import SlButton from '@/components/base/SlButton.vue'
const messages = {
  nb_NO: {
    dataset: 'Registrering',
    description: 'Til forsiden',
    selection: 'Ko-hort',
    'data controller group': 'Data controller group',
    owner: 'Owner',
    name: 'Name',
  },
  en: {
    dataset: 'Registrering',
    description: ' Description',
    'choose one or more': 'Choose one or several kindergartens..',
    selection: 'Cohort',
    'data controller group': 'Data controller group',
    owner: 'Owner',
    name: 'Name',
  },
}

interface SelectionOptionListItem {
  itemName: string
  item: string
}

// This component completes setup of the app after login
export default defineComponent({
  name: 'DatasetItem',
  components: {
    SlButton,
    SelectionBox,
    AnswerInput,
    SelectionItem,
  },
  // props: {
  //   dataset: { type: Object as PropType<Dataset>, required: true },
  // },
  setup(/*props*/) {
    const { t } = useI18n({ messages })
    // const { getters: appGetters } = useAppStore()
    const showInput = ref(false)
    const { getters: datasetGetters, actions: datasetActions } =
      useDatasetStore()
    const currentSubset = ref('')

    const d = datasetGetters.selectedDataset
    const theDataset = ref(d)

    const currentSelection: Ref<SelectionOptionListItem> = ref({
      item: '',
      itemName: '',
    })
    // let SelectionOptionList1: SelectionOptionListItem[] = Object.values(
    //   SELECTION
    // ).map((r) => ({
    //   item: r,
    //   itemName: r,
    // }))

    let SelectionOptionList: SelectionOptionListItem[] = computed(() => {
      return Object.values(SELECTION)
        .filter((r) => !theDataset.value.selectionPriority.includes(r))
        .map((r) => ({
          item: r,
          itemName: r,
        }))
    })

    console.log(SelectionOptionList)
    // const initialise = (d: Dataset) => {
    //   theDataset.value = new Dataset(d)
    // }
    // initialise(d)
    // watch(
    //   () => props.dataset,
    //   (newValue: Dataset) => {
    //     initialise(newValue)
    //   }
    // )
    //Methods
    // Add selection priority
    const addSelectionPriority = () => {
      if (currentSelection.value)
        datasetActions.addSelectionPriority(currentSelection.value.itemName)
    }
    // Save updated dataset
    const updateDataset = () => {
      datasetActions.updateDataset()
    }
    const addSubset = () => {
      let subset: DatasetSelection = {
        title: currentSubset.value,
      }
      console.log(subset)

      datasetActions.addSelection(theDataset.value.selectionPriority[0], subset)
    }
    return {
      t,
      theDataset,
      SelectionOptionList,
      currentSelection,
      showInput,
      currentSubset,
      // Computed
      // Methods
      addSubset,
      addSelectionPriority,
      updateDataset,
    }
  },
})
</script>

<style scoped></style>
