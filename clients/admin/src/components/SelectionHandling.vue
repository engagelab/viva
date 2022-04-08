<!-- Copyright 2020, 2021 Richard Nesnass, Sharanya Manivasagam and Ole Smørdal

 This file is part of VIVA.

 VIVA is free software: you can redistribute it and/or modify
 it under the terms of the GNU Affero General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 GPL-3.0-only or GPL-3.0-or-later

 VIVA is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU Affero General Public License for more details.

 You should have received a copy of the GNU Affero General Public License
 along with VIVA.  If not, see http://www.gnu.org/licenses/. -->
<template>
  <!-- Component handles only selection priority  -->
  <div class="ml-2">
    <p class="text-red-600 my-4">{{ t('instanceStructure') }}</p>
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
    <p v-if="d.selectionPriority.length == 0" class="text-red-500 text-sm">
      * {{ t('warning') }}
    </p>
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

    <p class="text-red-600 mt-4">{{ t('instances') }}</p>
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
import Subset from '@/components/Subset.vue'

const messages = {
  nb_NO: {
    instanceStructure: '',
    warning:
      'Note: Atleast one selection priority must be created for dataset to be reflected in app',
    instances: 'Instances',
  },
  en: {
    instanceStructure: 'Build selection structure for data subjects',
    warning:
      'Note: Atleast one selection priority must be created for dataset to be reflected in app',
    instances: 'Instances',
  },
}

export default defineComponent({
  name: 'selectionHandling',
  components: {
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
