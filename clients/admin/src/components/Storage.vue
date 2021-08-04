<template>
  <div>
    <div
      class="m-2"
      v-for="(storage, index) in theDataset.storages"
      :key="index"
    >
      <div class="grid grid-cols-3 gap-4 bg-gray-200">
        <div>
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
            @change="setStorageID(storage._id)"
          ></SelectionBox>
        </div>
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
          @change="setStorageID(storage._id)"
        ></SelectionBox>
        <!-- <AnswerInput
          class="m-2"
          mode="text"
          :border="false"
          :label="'Storage group:'"
          :required="true"
          v-model="storage.groupId"
        ></AnswerInput> -->
        <AnswerInput
          class="m-2"
          mode="multiChoice"
          :border="false"
          :label="'Storage category:'"
          :options="[{ title: 'yellow' }, { title: 'red' }]"
          :required="true"
          v-model="storage.category"
        ></AnswerInput>
        <div>
          <SelectionBox
            class="m-2"
            id="select-kind"
            :label="'Filename'"
            :options="
              storage.file.name && storage.file.name.length != 0
                ? FILE.name
                    .filter((i) => !storage.file.name.includes(i))
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
            @change="setStorageID(storage._id)"
          ></SelectionBox>
          <div class="ml-4 flex justify-start ...">
            <p>Filename:</p>
            <div
              v-for="(item, index) in storage.file?.name"
              :key="index"
              class="flex"
            >
              <p class="ml-4">{{ item }}</p>
              <p>*</p>
              <p class="ml-2" v-if="storage.file?.name.length != index + 1">
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
              storage.file.path && storage.file.path.length != 0
                ? FILE.path
                    .filter((i) => !storage.file.path.includes(i))
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
            @change="setStorageID(storage._id)"
          ></SelectionBox>
          <div class="flex justify-start ...">
            <p>Filepath:</p>
            <div
              v-for="(item, index) in storage.file?.path"
              :key="index"
              class="flex"
            >
              <p class="ml-4">{{ item }}</p>
              <p>*</p>
              <p class="ml-2" v-if="storage.file?.path.length != index + 1">
                >
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    <SlButton
      class="ml-2 p-0 self-center rounded-lg"
      id="button-accept"
      @click="addStorage"
      >+ Add new storage
    </SlButton>
  </div>
</template>
<script lang="ts">
import { defineComponent, ref, Ref, watch } from 'vue'
import { useDatasetStore } from '@/store/useDatasetStore'
import SlButton from '@/components/base/SlButton.vue'
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
    SlButton,
    AnswerInput,
    SelectionBox,
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

    const addStorage = () => {
      const newStorage: Ref<DatasetStorage> = ref({
        _id: '',
        kind: VIDEO_STORAGE_TYPES.educloud,
        groupId: '',
        file: {
          name: [],
          path: [],
        },
        category: [],
      })
      datasetActions.addStorageFields('', newStorage.value, 'new')
    }
    const setStorageID = (id: string) => {
      storageId.value = id
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
      //Methods
      addStorage,
      addFilename,
      setStorageID,
      addFilePath,
    }
  },
})
</script>
