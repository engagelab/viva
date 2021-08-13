<template>
  <div>
    <h2>{{ t('dataset') }}</h2>

    <div class="flex flex-col">
      <div class="w-4/5 flex flex-col">
        <AnswerInput
          class="m-2"
          mode="text"
          :border="false"
          :label="t('name')"
          :required="true"
          v-model="dataset.name"
        ></AnswerInput>
        <AnswerInput
          class="m-2"
          mode="text"
          :border="false"
          :label="t('owner')"
          :required="true"
          v-model="dataset.users.owner.profile.username"
        ></AnswerInput>
        <AnswerInput
          class="m-2"
          mode="text"
          :border="false"
          :label="t('description')"
          :required="true"
          v-model="dataset.description"
        ></AnswerInput>
        <AnswerInput
          class="m-2"
          mode="binary"
          :border="false"
          label="active"
          :required="true"
          v-model="dataset.status.active"
        ></AnswerInput>
      </div>
      <div>
        <p class="text-red-600 mt-4 ml-2">Data collection groups in use</p>
        <div class="flex flex-col">
          <div v-for="g in groups" :key="g.item" class="py-1 ml-2">
            <input
              class="mr-1 mb-1"
              type="checkbox"
              :id="`group-option-${g.item}`"
              :value="g.item"
              v-model="dataset.users.groups"
            />
            <label class="mr-2" :for="`group-option-${g.item}`">{{
              g.itemName
            }}</label>
          </div>
        </div>
      </div>
      <div>
        <p class="text-red-600 mt-4 ml-2">Selection Priority</p>
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
      <div><p class="text-red-600 mt-4 ml-2">Instances</p></div>
      <SelectionItem></SelectionItem>

      <!-- <ConsentHandling @consent-updated="consentUpdated"></ConsentHandling> -->
      <ConsentHandling></ConsentHandling>

      <div><p class="text-red-600 mt-4 ml-2">Storage options</p></div>

      <div
        class="m-2"
        v-for="(storage, index) in dataset.storages"
        :key="index"
      >
        <Storage :selectedStorage="storage" v-if="storage._id != ''"></Storage>
      </div>
      <Button
        class="ml-2 p-0 self-center rounded-lg"
        id="button-accept"
        @click="addStorage"
        >+ Add new storage
      </Button>

      <Button
        class="ml-4 p-2 self-center capitalize bg-green-highlight rounded-lg"
        id="button-accept"
        @click="updateDataset"
        >{{ t('save') }}
      </Button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, Ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDatasetStore } from '@/store/useDatasetStore'
import { Dataset, DatasetSelection, DatasetStorage } from '@/types/main'
import SelectionItem from '@/components/SelectionItem.vue'
import AnswerInput from '@/components/base/AnswerInput.vue'
import SelectionBox from '@/components/base/SelectionBox.vue'
import ConsentHandling from '@/components/ConsentHandling.vue'
import Button from '@/components/base/Button.vue'
import Storage from '@/components/Storage.vue'
import { VIDEO_STORAGE_TYPES, UTVALG_SELECTION } from '@/constants'
import { useAppStore } from '@/store/useAppStore'
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

interface OptionListItem {
  itemName: string
  item: string
}

// This component completes setup of the app after login
export default defineComponent({
  name: 'DatasetItem',
  components: {
    Button,
    SelectionBox,
    AnswerInput,
    SelectionItem,
    ConsentHandling,
    Storage,
  },
  setup() {
    const { t } = useI18n({ messages })

    const showInput = ref(false)
    const { getters: datasetGetters, actions: datasetActions } =
      useDatasetStore()

    const { getters: appGetters } = useAppStore()
    const currentSubset = ref('')
    const groups: OptionListItem[] = []
    let dataset: Ref<Dataset> = ref(new Dataset())
    let selectionOptionList: OptionListItem[] = []

    const resetData = (d: Dataset) => {
      groups.length = 0
      dataset.value = new Dataset(d)
      // Put current groups into a selection list
      appGetters.user.value.profile.groups.forEach((g) => {
        groups.push({
          itemName: g.name,
          item: g.id,
        })
      })
      selectionOptionList = Object.values(UTVALG_SELECTION)
        .filter((r) => dataset.value.selectionPriority.includes(r))
        .map((r) => ({
          item: r,
          itemName: r,
        }))
    }

    watch(
      () => datasetGetters.selectedDataset.value,
      (d) => resetData(d)
    )
    resetData(datasetGetters.selectedDataset.value)

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
    const addStorage = () => {
      const newStorage: DatasetStorage = {
        kind: VIDEO_STORAGE_TYPES.educloud,
        groupId: '',
        file: {
          name: [],
          path: [],
        },
        category: [],
      }
      datasetActions.addStorageFields('', newStorage, 'new')
    }

    // Save updated dataset
    const updateDataset = () => {
      datasetActions.updateDataset(dataset.value)
    }
    const addSubset = () => {
      let subset: DatasetSelection = {
        title: currentSubset.value,
        selection: {},
      }

      datasetActions.addSelection(dataset.value.selectionPriority[0], subset)
    }
    return {
      t,
      dataset,
      groups,
      selectionOptionList,
      currentSelection,
      showInput,
      currentSubset,
      addStorage,
      addSubset,
      addSelectionPriority,
      updateDataset,
    }
  },
})
</script>

<style scoped></style>
