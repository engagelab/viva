<template>
  <!-- Component handles only selection priority  -->
  <div class="ml-2">
    <p class="text-red-600 my-4">Selection Priority</p>
    <select
      span
      ref="selects"
      @change="addSelectionPriority"
      @click="showWarning = true"
      class="select"
      style="width: 150px"
      v-model="currentSelection"
    >
      <option :value="0"></option>
      <option
        v-for="(selection, index) in selectionOptionList"
        :value="selection"
        :key="index"
      >
        {{ selection }}
      </option>
    </select>
    <div class="flex">
      <div
        v-for="(selection, index) in localSelectionPriority"
        :key="index"
        class="flex flex-row"
      >
        <p class="ml-1">{{ selection }}</p>
        <p class="cursor-pointer" @click="removeSelectionPriority(selection)">
          *
        </p>
        <div class="ml-2" v-if="localSelectionPriority.length != index + 1">
          >
        </div>
      </div>
    </div>

    <p class="text-red-600 mt-4">Instances</p>
    <Subset
      v-if="localSelection"
      :title="Object.keys(localSelection)[0]"
      :label="Object.keys(localSelection)[0]"
      :nodes="localSelection[Object.keys(localSelection)[0]]"
      :depth="0"
      :path="''"
      :newInstancePath="''"
    ></Subset>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, Ref, ComputedRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { behandlings, UTVALG_SELECTION, CONSENT_TYPES } from '@/constants'
import { DatasetSelection } from '@/types/main'
import { useDatasetStore } from '@/store/useDatasetStore'
import Subset from './Subset.vue'
// import SelectionItem from '@/components/SelectionItem.vue'

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
    // SelectionItem,
    Subset,
  },

  setup() {
    const { t } = useI18n({ messages })
    const { getters: datasetGetters, actions: datasetActions } =
      useDatasetStore()

    const currentSelection = ref('')

    const d = datasetGetters.selectedDataset

    const localSelectionPriority: Ref<string[]> = ref(d.value.selectionPriority)
    const localSelection: Ref<{ [key: string]: DatasetSelection[] }> = ref(
      d.value.selection
    )
    const selectionOptionList: ComputedRef<string[]> = computed(() => {
      return Object.values(UTVALG_SELECTION).filter(
        (r) => !localSelectionPriority.value.includes(r)
      )
    })

    function reloadData() {
      localSelectionPriority.value = [...d.value.selectionPriority]
      localSelection.value = d.value.selection
    }

    function addSelectionPriority() {
      let check = false
      if (d.value.selection && Object.keys(d.value.selection).length != 0) {
        check = confirm(
          'Modifying the priority resets instances , are you sure? '
        )
      } else check = true

      if (check) {
        if (currentSelection.value) {
          localSelectionPriority.value.push(currentSelection.value)
          // context.emit('updated', localSelectionPriority.value)
          datasetActions.addSelection(localSelectionPriority.value, 'priority')
        }
      }
    }

    const removeSelectionPriority = (s: string) => {
      let check = false
      if (Object.keys(d.value.selection).length != 0) {
        check = confirm(
          'Modifying the priority resets instances , are you sure? '
        )
      } else check = true

      if (check) {
        currentSelection.value = ''
        localSelectionPriority.value.splice(
          localSelectionPriority.value.indexOf(s),
          1
        )
        // context.emit('updated', localSelectionPriority.value)
        datasetActions.addSelection(localSelectionPriority.value, 'priority')
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
      selectionOptionList,
      currentSelection,
      localSelectionPriority,
      localSelection,
      // Methods
      addSelectionPriority,
      removeSelectionPriority,
    }
  },
})
</script>
