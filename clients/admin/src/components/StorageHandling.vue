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
  <div class="ml-2 flex flex-col">
    <SelectionBox
      id="select-kind"
      :label="t('kind')"
      :options="storageKindOptions"
      v-model="storageKind"
      @change="setStorageKind"
    ></SelectionBox>
    <SelectionBox
      id="select-group"
      :label="t('group')"
      :options="storageGroupOptions"
      v-model="storageGroup"
      @change="setStorageGroup"
    ></SelectionBox>
    <AnswerInput
      mode="multiChoice"
      :border="false"
      :label="t('categories')"
      :options="storageCategoryOptions"
      :required="true"
      v-model="storageCategory"
      @change="setStorageCategory"
    ></AnswerInput>
    <p class="text-red-600 mt-4">{{ t('path') }}</p>
    <div class="flex flex-row m-2">
      <div class="flex flex-col">
        <h3>{{ t('available options') }}</h3>
        <draggable
          class="flex flex-col p-1 border border-gray-400"
          style="min-height: 45px"
          :list="storagePathOptions"
          group="path"
          itemKey="itemName"
        >
          <template #item="{ element }">
            <span class="border border-black bg-white p-1 my-1">{{
              element.itemName
            }}</span>
          </template>
        </draggable>
      </div>

      <div class="flex flex-col ml-6 flex-grow">
        <div>
          <h3>{{ t('path structure') }}</h3>
        </div>
        <draggable
          class="flex flex-row p-1 h-12 border border-green-300 items-center"
          :list="storagePath"
          group="path"
          @change="setStoragePathAndFile"
          itemKey="itemName"
        >
          <template #item="{ element }">
            <div>
              <span class="border border-black bg-white p-1">{{
                element.itemName
              }}</span>
              <span>&nbsp;/&nbsp;</span>
            </div>
          </template>
        </draggable>
      </div>
    </div>
    <p class="text-red-600 mt-4">{{ t('fileName') }}</p>
    <div class="flex flex-row m-2">
      <div class="flex flex-col">
        <h3>{{ t('available options') }}</h3>
        <draggable
          class="flex flex-col border border-gray-400"
          style="min-height: 45px"
          :list="storageFileOptions"
          group="filename"
          itemKey="itemName"
        >
          <template #item="{ element }">
            <span class="border border-black bg-white p-1 m-1">{{
              element.itemName
            }}</span>
          </template>
        </draggable>
      </div>

      <div class="flex flex-col ml-6 flex-grow">
        <div>
          <h3>{{ t('fileName structure') }}</h3>
        </div>
        <draggable
          class="flex flex-row p-1 h-12 border border-green-300 items-center"
          :list="storageFilename"
          group="filename"
          @change="setStoragePathAndFile"
          itemKey="itemName"
        >
          <template #item="{ element }">
            <div>
              <span class="border border-black bg-white p-1">{{
                element.itemName
              }}</span>
              <span>&nbsp;/&nbsp;</span>
            </div>
          </template>
        </draggable>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch, Ref, toRefs, PropType } from 'vue'
import draggable from 'vuedraggable'
import { useI18n } from 'vue-i18n'
import AnswerInput from '@/components/base/AnswerInput.vue'
import SelectionBox from '@/components/base/SelectionBox.vue'
import { VIDEO_STORAGE_TYPES, STORAGE_KEYS } from '@/constants'
import { DatasetStorage } from '@/types/main'
const messages = {
  nb_NO: {
    kind: 'Kind',
    group: 'Group',
    categories: 'Categories',
    path: 'Path',
    'available options': 'Available options',
    'path structure': 'Path structure',
    fileName: 'File name',
    'fileName structure': 'File name structure',
  },
  en: {
    kind: 'Kind',
    group: 'Group',
    categories: 'Categories',
    path: 'Path',
    'available options': 'Available options',
    'path structure': 'Path structure',
    fileName: 'File name',
    'fileName structure': 'File name structure',
  },
}
interface StorageStringListItem {
  itemName: string
  item: string
}

export default defineComponent({
  name: 'storageHandling',
  components: {
    draggable,
    AnswerInput,
    SelectionBox,
  },
  props: {
    storage: {
      type: Object as PropType<DatasetStorage>,
      required: true,
    },
  },
  emits: ['updated'],
  setup(props, context) {
    const { t } = useI18n({ messages })
    const { storage } = toRefs(props)
    const localStorage: Ref<DatasetStorage> = ref({
      _id: '',
      kind: VIDEO_STORAGE_TYPES.lagringshotell,
      groupId: '',
      file: { name: [], path: [] },
      category: [],
    })

    function reloadData() {
      localStorage.value = {
        _id: storage.value._id,
        kind: storage.value.kind,
        groupId: storage.value.groupId,
        file: storage.value.file,
        category: storage.value.category,
      }
      storageKind.value = {
        item: storage.value.kind,
        itemName: storage.value.kind,
      }
      storageGroup.value = {
        item: storage.value.groupId,
        itemName: storage.value.groupId,
      }
      storageCategory.value = storage.value.category
      storagePath.value = storage.value.file.path.map((i) => ({
        itemName: i,
        item: i,
      }))
      storageFilename.value = storage.value.file.name.map((i) => ({
        itemName: i,
        item: i,
      }))
      if (storageFilename.value.length === 0) {
        const defaultFileKey = STORAGE_KEYS.name.length
          ? STORAGE_KEYS.name[0]
          : ''
        storageFilename.value.push({
          itemName: defaultFileKey,
          item: defaultFileKey,
        })
      }
    }

    function storageWasUpdated() {
      context.emit('updated', localStorage.value)
    }

    const storageKindOptions: StorageStringListItem[] = Object.keys(
      VIDEO_STORAGE_TYPES
    )
      .filter((i) => i !== VIDEO_STORAGE_TYPES.educloud)
      .map((r) => ({
        item: r,
        itemName: r,
      }))
    const storageKind: Ref<StorageStringListItem> = ref({
      item: '',
      itemName: '',
    })
    const setStorageKind = (value: StorageStringListItem) => {
      localStorage.value.kind = value.item as VIDEO_STORAGE_TYPES
      storageWasUpdated()
    }

    const storageGroupOptions: StorageStringListItem[] =
      STORAGE_KEYS.groups.map((sg) => ({
        item: sg,
        itemName: sg,
      }))
    const storageGroup: Ref<StorageStringListItem> = ref({
      item: '',
      itemName: '',
    })
    const setStorageGroup = (value: StorageStringListItem) => {
      localStorage.value.groupId = value.item
      storageWasUpdated()
    }

    const storageCategory: Ref<string[]> = ref([])
    const storageCategoryOptions: StorageStringListItem[] = [
      { item: 'yellow', itemName: 'yellow' },
      { item: 'red', itemName: 'red' },
    ]
    const setStorageCategory = (value: string[]) => {
      localStorage.value.category = value
      storageWasUpdated()
    }

    const storagePathOptions: Ref<StorageStringListItem[]> = ref(
      STORAGE_KEYS.path.map((i) => ({ itemName: i, item: i }))
    )
    const storagePath: Ref<StorageStringListItem[]> = ref([])

    const storageFileOptions: Ref<StorageStringListItem[]> = ref(
      STORAGE_KEYS.name.map((i) => ({ itemName: i, item: i }))
    )
    const storageFilename: Ref<StorageStringListItem[]> = ref([])
    const setStoragePathAndFile = () => {
      localStorage.value.file.name = storageFilename.value.map((i) => i.item)
      localStorage.value.file.path = storagePath.value.map((i) => i.item)
      storageWasUpdated()
    }

    watch(
      () => storage.value,
      () => reloadData()
    )
    reloadData()

    return {
      t,
      VIDEO_STORAGE_TYPES,
      localStorage,
      storageWasUpdated,

      storageKind,
      storageKindOptions,
      setStorageKind,

      storageGroup,
      storageGroupOptions,
      setStorageGroup,

      storageCategory,
      storageCategoryOptions,
      setStorageCategory,

      storagePathOptions,
      storagePath,
      storageFileOptions,
      storageFilename,
      setStoragePathAndFile,
    }
  },
})
</script>

<style scoped></style>
