<template>
  <div class="ml-2">
    <p class="text-red-600 my-4">Selection Priority</p>
    <SelectionBox
      id="select-kind"
      :label="t('selection')"
      :options="selectionOptionList"
      :resetOnChoose="true"
      v-model="currentSelection"
      @change="addSelectionPriority"
    ></SelectionBox>
    <div
      v-for="(selection, index) in d.selectionPriority"
      :key="index"
      class="flex"
    >
      <p class="ml-4">{{ selection }}</p>
      <p>*</p>
      <p class="ml-2" v-if="d?.selectionPriority.length != index + 1">></p>
    </div>

    <p class="text-red-600 mt-4">Instances</p>
    <!--SelectionItem></SelectionItem-->
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, Ref, ComputedRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { behandlings, UTVALG_SELECTION, CONSENT_TYPES } from '@/constants'
import { DatasetSelection } from '@/types/main'
import { useDatasetStore } from '@/store/useDatasetStore'
import SelectionBox from '@/components/base/SelectionBox.vue'
// import SelectionItem from '@/components/SelectionItem.vue'

interface OptionListItem {
  itemName: string
  item: string
}

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

export default defineComponent({
  name: 'selectionHandling',
  components: {
    SelectionBox,
    // SelectionItem,
  },
  setup() {
    const { t } = useI18n({ messages })
    const { getters: datasetGetters } = useDatasetStore()
    const currentSelection: Ref<OptionListItem> = ref({
      item: '',
      itemName: '',
    })

    // TODO: Supply the temporary dataset's selection / selectionPriority by props, don't modify the store's original
    const d = datasetGetters.selectedDataset

    // Local reactive containers to hold changes before saving to the Dataset
    const localSelectionPriority: Ref<string[]> = ref([])
    const localSelection: Ref<{ [key: string]: DatasetSelection[] }> = ref({})

    // Available options in list should exclude those those already chosen
    const selectionOptionList: ComputedRef<OptionListItem[]> = computed(() => {
      return Object.values(UTVALG_SELECTION)
        .filter((r) => !localSelectionPriority.value.includes(r))
        .map((r) => ({
          item: r,
          itemName: r,
        }))
    })

    function reloadData() {
      localSelectionPriority.value = [...d.value.selectionPriority]
      localSelection.value = d.value.selection
    }

    function addSelectionPriority() {
      if (currentSelection.value) {
        localSelectionPriority.value.push(currentSelection.value.itemName)
      }
    }

    watch(
      () => d.value,
      () => reloadData()
    )
    reloadData()
    return {
      t,
      d,
      CONSENT_TYPES,
      behandlings,
      addSelectionPriority,
      selectionOptionList,
      currentSelection,
    }
  },
})
</script>
