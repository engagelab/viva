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
    <div>
      <div
        v-if="
          (localSelection && Object.entries(localSelection).length === 0) ||
          depth > 0
        "
        class="flex space-x-2"
        :class="`ml-${depth * 4}`"
      >
        <div
          v-if="nodes"
          class="cursor-pointer"
          @click="
            showInputBox({
              currentKey: localSelectionPriority[depth - 1],
              nextKey: '',
              currentValue: title,
              path: path,
              title: '',
              mode: 'current',
            })
          "
        >
          ⬇️
        </div>
        <p v-if="localSelectionPriority && nodes">
          {{ localSelectionPriority[depth - 1] }}:{{ title }}
          <span
            class="cursor-pointer"
            @click="
              addSubset({
                currentKey: localSelectionPriority[depth - 1],
                nextKey: '',
                currentValue: title,
                path: path,
                title: '',
                mode: 'delete',
              })
            "
          >
            ˟
          </span>
        </p>

        <div
          v-if="
            (nodes &&
              nodes.length == 0 &&
              depth != localSelectionPriority.length) ||
            (localSelectionPriority.length > 0 && !nodes)
          "
          class="
            rounded-full
            h-4
            w-4
            flex
            items-center
            justify-center
            bg-blue-400
            cursor-pointer
          "
          @click="
            showInputBox({
              currentKey: localSelectionPriority[depth - 1],
              nextKey: localSelectionPriority[depth],
              currentValue: title,
              path: path,
              title: '',
              mode: 'new',
            })
          "
        >
          ＋
        </div>
      </div>
      <div v-if="localSelectionPriority">
        <Subset
          class="my-2"
          :class="`my-${depth * 0.5}`"
          v-for="node in nodes"
          :title="node.title"
          :label="node.selection ? Object.keys(node.selection)[0] : ''"
          :nodes="
            node.selection ? node.selection[Object.keys(node.selection)[0]] : []
          "
          :key="node"
          :depth="depth + 1"
          :path="
            localSelectionPriority[depth - 1]
              ? path.toLowerCase() +
                '+' +
                localSelectionPriority[depth - 1].toLowerCase() +
                '-' +
                title.toLowerCase()
              : ''
          "
          :newInstancePath="
            localSelectionPriority[depth - 1]
              ? path.toLowerCase() +
                '+' +
                localSelectionPriority[depth - 1].toLowerCase() +
                '-' +
                title.toLowerCase()
              : ''
          "
        >
        </Subset>
      </div>
      <!-- Add new subset -->

      <div class="flex justify-start" v-if="currentDataPath.mode != 'delete'">
        <div class="flex flex-row" v-if="showInput">
          <input
            v-model="currentDataPath.title"
            type="text"
            class="border-2 text-center"
            placeholder="Add value to selected instance"
          />
          <SlButton
            class="
              ml-4
              p-2
              self-center
              capitalize
              rounded-lg
              bg-blue-300
              hover:bg-blue-500
            "
            @click="addSubset(currentDataPath)"
            >Add
            <p v-if="mode == 'new'">{{ currentDataPath.nextKey }}</p>
            <p v-else>{{ currentDataPath.currentKey }}</p>
          </SlButton>
          <!-- <div v-if="errorMessage" class="text-red-600">
            {{ errorMessage }}
          </div> -->
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, watch, ref, Ref } from 'vue'
import { DatasetSelection, DataPath } from '@/types/main'
import { useDatasetStore } from '@/store/useDatasetStore'
import { useI18n } from 'vue-i18n'
const messages = {
  nb_NO: {
    dataset: 'Registrering',
  },
  en: {
    dataset: 'Registrering',
  },
}
export default defineComponent({
  name: 'Subset',
  components: {},
  props: {
    path: { type: String, required: true },
    newInstancePath: { type: String, required: true },

    depth: { type: Number, required: true },
    title: { type: String, required: true },
    label: { type: String, required: true },
    nodes: { type: Object as PropType<DatasetSelection[]>, required: true },
  },

  setup(props) {
    const { getters: datasetGetters, actions: datasetActions } =
      useDatasetStore()
    const d = datasetGetters.selectedDataset
    const { t } = useI18n({ messages })
    let currentDataPath = ref<DataPath>({
      path: '',
      currentKey: '',
      nextKey: '',
      currentValue: '',
      title: '',
      mode: '',
    })
    let mode = ref('')
    const showInput = ref(false)
    const localSelectionPriority: Ref<string[]> = ref(d.value.selectionPriority)
    const localSelection: Ref<{ [key: string]: DatasetSelection[] }> = ref(
      d.value.selection
    )

    //Methods

    const showInputBox = (path: DataPath) => {
      mode.value = path.mode
      currentDataPath.value = path
      showInput.value = !showInput.value
    }

    // Check the datapath and if it matches and the new subset
    const addSubset = (currentDataPath: DataPath) => {
      let nySubset: DatasetSelection = {
        title: currentDataPath.title,
        selection: {},
      }
      let newPath =
        props.path +
        '+' +
        currentDataPath.currentKey?.toLowerCase() +
        '-' +
        currentDataPath.currentValue?.toLowerCase()

      //  Match the path and add the subset
      let p = ''
      let depthIndex = 0

      // recursive to iterate throught the nested Object
      const subsetPath = (subsets: DatasetSelection[]) => {
        subsets?.forEach((set, index) => {
          depthIndex = depthIndex + 1
          p = localSelectionPriority.value[depthIndex - 1]
            ? p.toLowerCase() +
              '+' +
              localSelectionPriority.value[depthIndex - 1].toLowerCase() +
              '-' +
              set.title.toLowerCase()
            : ''

          if (p === props.path && mode.value == 'current') {
            set.selection[currentDataPath.currentKey].push(nySubset)
          } else if (p === newPath && mode.value == 'new') {
            Object.assign(set, {
              selection: { [currentDataPath.nextKey]: [nySubset] },
            })
          } else if (
            p === newPath &&
            set.title == currentDataPath.currentValue &&
            currentDataPath.mode == 'delete'
          ) {
            subsets.splice(index, 1)
          }
          if (set.selection) {
            subsetPath(set.selection[Object.keys(set.selection)[0]])
          } else {
            p = ''
            depthIndex = 0
          }
        })
      }
      if (
        props.depth == 1 &&
        props.path == '' &&
        currentDataPath.nextKey == '' &&
        currentDataPath.mode != 'delete'
      ) {
        localSelection.value[currentDataPath.currentKey].push(nySubset)
      } else if (Object.keys(localSelection.value).length > 0) {
        subsetPath(localSelection.value[Object.keys(localSelection.value)[0]])
      } else {
        // first instance added
        Object.assign(localSelection.value, {
          [currentDataPath.nextKey]: [nySubset],
        })
      }

      datasetActions.addSelection(localSelection.value, 'selection')
      showInput.value = false
    }
    function reloadData() {
      localSelectionPriority.value = [...d.value.selectionPriority]
      localSelection.value = d.value.selection
    }
    watch(
      () => d.value,
      () => reloadData()
    )
    reloadData()
    return {
      t,
      localSelection,
      localSelectionPriority,
      showInput,
      currentDataPath,
      mode,
      // Methods
      showInputBox,
      addSubset,
    }
  },
})
</script>
