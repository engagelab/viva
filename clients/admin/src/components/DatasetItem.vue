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
          label="active"
          :required="true"
          v-model="dataset.status.active"
          @change="unsavedData = true"
        ></AnswerInput>
      </div>

      <!-- Display of groups -->
      <div>
        <p class="text-red-600 mt-4 ml-2">Data collection groups</p>
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
            <label class="mr-2" :for="`group-option-${g.name}`">{{
              g.name
            }}</label>
          </div>
        </div>
      </div>

      <SelectionHandling @updated="selectionUpdated"></SelectionHandling>

      <ConsentHandling @updated="consentUpdated"></ConsentHandling>

      <div>
        <p class="text-red-600 mt-4 ml-2">
          Storage
          <span class="mt-4 ml-6 text-xs text-black"
            >*Note: EduCloud storage not configurable here</span
          >
        </p>
        <div v-for="s in dataset.storages" :key="s._id">
          <StorageHandling :storage="s" @updated="storageUpdated" />
        </div>
        <Button
          class="mt-2 p-0 rounded-lg"
          id="button-accept"
          @click="addStorage"
          >+ Add new storage
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
