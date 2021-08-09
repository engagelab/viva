<template>
  <div>
    <div class="grid grid-cols-3 gap-4 bg-gray-200">
      <SelectionBox
        id="select-kind"
        :label="'Storage kind:'"
        :options="
          Object.keys(VIDEO_STORAGE_TYPES).map((r) => ({
            item: r,
            itemName: r,
          }))
        "
        v-model="currentStoragekind"
        @change="setStorageID(selectedStorage)"
      ></SelectionBox>
      <SelectionBox
        id="select-kind"
        :label="'Storage group:'"
        :options="
          FILEGROUPS.map((r) => ({
            item: r,
            itemName: r,
          }))
        "
        v-model="currentStoragegroup"
        @change="setStorageID(selectedStorage)"
      ></SelectionBox>
      <AnswerInput
        class="m-2"
        mode="multiChoice"
        :border="false"
        :label="'Storage category:'"
        :options="[{ title: 'yellow' }, { title: 'red' }]"
        :required="true"
        v-model="currentCategory"
      ></AnswerInput>
      <div>
        <SelectionBox
          class="m-2"
          id="select-kind"
          :label="'Filename'"
          :options="
            selectedStorage.file.name && selectedStorage.file.name.length != 0
              ? FILE.name
                  .filter((i) => !selectedStorage.file.name.includes(i))
                  .map((r) => ({
                    item: r,
                    itemName: r,
                  }))
              : FILE.name.map((r) => ({
                  item: r,
                  itemName: r,
                }))
          "
          v-model="currentFilename"
          @change="setStorageID(selectedStorage)"
        ></SelectionBox>
        <div class="ml-4 flex justify-start ...">
          <p>Filename:</p>
          <div
            v-for="(item, index) in selectedStorage?.file?.name"
            :key="index"
            class="flex"
          >
            <p class="ml-4">{{ item }}</p>
            <p>*</p>
            <p
              class="ml-2"
              v-if="selectedStorage.file?.name.length != index + 1"
            >
              >
            </p>
          </div>
        </div>
      </div>

      <div>
        <SelectionBox
          id="select-kind"
          :label="'Filepath'"
          :options="
            selectedStorage.file.path
              ? FILE.path
                  .filter((i) => !selectedStorage.file.path.includes(i))
                  .map((r) => ({
                    item: r,
                    itemName: r,
                  }))
              : FILE.path.map((r) => ({
                  item: r,
                  itemName: r,
                }))
          "
          v-model="currentFilepath"
          @change="setStorageID(selectedStorage)"
        ></SelectionBox>
        <div class="flex justify-start ...">
          <p>Filepath:</p>
          <div
            v-for="(item, index) in selectedStorage.file?.path"
            :key="index"
            class="flex"
          >
            <p class="ml-4">{{ item }}</p>
            <p>*</p>
            <p
              class="ml-2"
              v-if="selectedStorage.file?.path.length != index + 1"
            >
              >
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import { defineComponent, ref, Ref, watch, PropType } from 'vue'
import { useDatasetStore } from '@/store/useDatasetStore'
// import SlButton from '@/components/base/SlButton.vue'
import AnswerInput from '@/components/base/AnswerInput.vue'
import SelectionBox from '@/components/base/SelectionBox.vue'
import { VIDEO_STORAGE_TYPES, FILE, FILEGROUPS } from '@/constants'
import { DatasetStorage } from '@/types/main'
interface FileListItem {
  itemName: string
  item: string
}

export default defineComponent({
  name: 'Storage',
  components: {
    // SlButton,
    AnswerInput,
    SelectionBox,
  },
  props: {
    selectedStorage: {
      type: Object as PropType<DatasetStorage>,
      required: true,
    },
  },
  setup() {
    const { getters: datasetGetters, actions: datasetActions } =
      useDatasetStore()
    const d = datasetGetters.selectedDataset
    const theDataset = ref(d)

    const currentFilename: Ref<FileListItem> = ref({
      item: '',
      itemName: '',
    })
    const currentCategory: string[] = ref([''])

    const currentFilepath: Ref<FileListItem> = ref({
      item: '',
      itemName: '',
    })
    const currentStoragekind: Ref<FileListItem> = ref({
      item: '',
      itemName: '',
    })
    const currentStoragegroup: Ref<FileListItem> = ref({
      item: '',
      itemName: '',
    })

    const storageId = ref('')

    const setStorageID = (selectedStorage: DatasetStorage) => {
      if (selectedStorage._id) storageId.value = selectedStorage._id
    }
    const addFilename = (value: string) => {
      if (value) datasetActions.addStorageFields(storageId.value, value, 'name')
    }

    const addFilePath = (value: string) => {
      if (value) datasetActions.addStorageFields(storageId.value, value, 'path')
    }
    const addStoragekind = (value: string) => {
      if (value) datasetActions.addStorageFields(storageId.value, value, 'kind')
    }

    const addStoragegroup = (value: string) => {
      if (value)
        datasetActions.addStorageFields(storageId.value, value, 'groupId')
    }
    watch(
      () => currentFilename.value,
      (newValue: FileListItem) => {
        if (newValue.item) addFilename(newValue.item)
      }
    )
    watch(
      () => currentFilepath.value,
      (newValue: FileListItem) => {
        if (newValue.item) addFilePath(newValue.item)
      }
    )

    watch(
      () => currentStoragekind.value,
      (newValue: FileListItem) => {
        if (newValue.item) addStoragekind(newValue.item)
      }
    )
    watch(
      () => currentStoragegroup.value,
      (newValue: FileListItem) => {
        if (newValue.item) addStoragegroup(newValue.item)
      }
    )
    return {
      theDataset,
      VIDEO_STORAGE_TYPES,
      FILE,
      FILEGROUPS,
      currentFilename,
      currentFilepath,
      currentStoragekind,
      currentStoragegroup,
      currentCategory,
      // selectedStorage,
      //Methods
      addFilename,
      setStorageID,
      addFilePath,
    }
  },
})
</script>
