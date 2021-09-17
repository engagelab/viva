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
  <div>
    <p class="text-red-600 ml-2">{{ t('dataset') }}</p>
    <div class="flex flex-col flex-grow">
      <div class="w-4/5 flex flex-col">
        <AnswerInput
          class="m-2"
          mode="text"
          :border="false"
          :label="t('name')"
          :required="true"
          v-model="dataset.name"
          @change="unsavedData = true"
        ></AnswerInput>
        <!--AnswerInput
          class="m-2"
          mode="text"
          :border="false"
          :label="t('owner')"
          :required="true"
          v-model="dataset.users.owner.profile.username"
        ></AnswerInput-->
        <AnswerInput
          class="m-2"
          mode="text"
          :border="false"
          :label="t('description')"
          :required="true"
          v-model="dataset.description"
          @change="unsavedData = true"
        ></AnswerInput>
        <AnswerInput
          class="m-2"
          mode="binary"
          :border="false"
          :label="t('active')"
          :required="true"
          v-model="dataset.status.active"
          @change="unsavedData = true"
        ></AnswerInput>
      </div>

      <!-- Display of groups -->
      <div>
        <p class="text-red-600 mt-4 ml-2">{{ t('canvas courses') }}</p>
        <div class="flex flex-col">
          <div v-for="(g, index) in groups" :key="index" class="py-1 ml-2">
            <input
              class="mr-1 mb-1"
              type="checkbox"
              :id="g.id"
              :value="g.id"
              v-model="dataset.users.groups"
              @change="unsavedData = true"
            />
            <label class="mr-2" :for="`group-option-${g.name}`"
              >{{ g.id }}-{{ g.name }}</label
            >
          </div>
        </div>
      </div>

      <SelectionHandling @updated="selectionUpdated"></SelectionHandling>

      <ConsentHandling @updated="consentUpdated"></ConsentHandling>

      <div>
        <p class="text-red-600 mt-4 ml-2">
          {{ t('storage') }}
          <span class="mt-4 ml-6 text-xs text-black">*{{ t('warning1') }}</span>
        </p>
        <div v-for="s in dataset.storages" :key="s._id">
          <StorageHandling :storage="s" @updated="storageUpdated" />
        </div>
        <Button
          class="mt-2 p-0 rounded-lg"
          id="button-accept"
          @click="addStorage"
          >+ {{ t('Add') }}
        </Button>
      </div>

      <Button
        class="mt-4 bg-green-highlight"
        v-if="unsavedData"
        @vclick="save()"
        >{{ t('save') }}</Button
      >
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, Ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { uuid } from '@/utilities'
import { useDatasetStore } from '@/store/useDatasetStore'
import { Dataset, DatasetStorage, DatasetConsent } from '@/types/main'
import SelectionHandling from '@/components/SelectionHandling.vue'
import AnswerInput from '@/components/base/AnswerInput.vue'
import ConsentHandling from '@/components/ConsentHandling.vue'
import Button from '@/components/base/Button.vue'
import StorageHandling from '@/components/StorageHandling.vue'
import { VIDEO_STORAGE_TYPES } from '@/constants'
import { useAppStore } from '@/store/useAppStore'
const messages = {
  nb_NO: {
    dataset: 'Registrering',
    name: 'Name',
    owner: 'Owner',
    description: 'Til forsiden',
    active: 'Aktiv',
    'canvas courses': 'Canvas courses',
    storage: '',
    warning1: '',
    add: '',
  },
  en: {
    dataset: 'Dataset',
    name: 'Name',
    owner: 'Owner',
    description: ' Description',
    active: 'active',
    'canvas courses': 'Canvas courses',
    storage: 'Storage',
    warning1: 'Note: EduCloud storage not configurable here',
    add: 'Add new storage',
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
    AnswerInput,
    SelectionHandling,
    ConsentHandling,
    StorageHandling,
  },
  setup() {
    const { t } = useI18n({ messages })
    const unsavedData = ref(false)
    const showInput = ref(false)
    const { getters: datasetGetters, actions: datasetActions } =
      useDatasetStore()

    const { getters: appGetters } = useAppStore()
    const currentSubset = ref('')
    const groups: OptionListItem[] = []
    let dataset: Ref<Dataset> = ref(new Dataset())

    const resetData = (d: Dataset) => {
      groups.length = 0
      dataset.value = new Dataset(d)
    }

    watch(
      () => datasetGetters.selectedDataset.value,
      (d) => resetData(d)
    )
    resetData(datasetGetters.selectedDataset.value)

    const addStorage = () => {
      const newStorage: DatasetStorage = {
        _id: uuid(),
        kind: VIDEO_STORAGE_TYPES.lagringshotell,
        groupId: '',
        file: {
          name: [],
          path: [],
        },
        category: [],
      }
      dataset.value.storages.push(newStorage)
    }

    const selectionUpdated = (s: string[]) => {
      dataset.value.selection = {}
      dataset.value.selectionPriority = s
      unsavedData.value = true
    }
    const consentUpdated = (c: DatasetConsent) => {
      dataset.value.consent = c
      unsavedData.value = true
    }
    const storageUpdated = (s: DatasetStorage) => {
      const storage = dataset.value.storages.find((st) => st._id === s._id)
      if (storage) {
        storage.kind = s.kind
        storage.groupId = s.groupId
        storage.file = s.file
        storage.category = s.category
      }
      unsavedData.value = true
    }

    // Save updated dataset
    const save = () => {
      datasetActions.updateDataset(dataset.value)
      unsavedData.value = false
    }
    return {
      t,
      dataset,
      groups: appGetters.user.value.profile.groups,
      showInput,
      currentSubset,
      selectionUpdated,
      consentUpdated,
      storageUpdated,
      unsavedData,
      addStorage,
      save,
    }
  },
})
</script>

<style scoped></style>
