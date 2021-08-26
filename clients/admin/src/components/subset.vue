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
            showInputBox(
              {
                currentKey: localSelectionPriority[depth - 1],
                nextKey: '',
                currentValue: title,
                path: path,
                title: '',
              },
              'current'
            )
          "
        >
          ⬇️
        </div>
        <p v-if="localSelectionPriority && nodes">
          {{ localSelectionPriority[depth - 1] }}:{{ title }}
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
            showInputBox(
              {
                currentKey: localSelectionPriority[depth - 1],
                nextKey: localSelectionPriority[depth],
                currentValue: title,
                path: path,
                title: '',
              },
              'new'
            )
          "
        >
          +
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
      <div class="flex justify-start ...">
        <div class="flex flex-row" v-if="showInput">
          <input
            v-model="currentDataPath.title"
            type="String"
            class="border-2 text-center rounded-full"
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
            @click="addSubset(currentDataPath, depth)"
            >Add {{ currentDataPath.currentKey }}{{ newInstancePath
            }}{{ currentDataPath }}
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
import { defineComponent, PropType, ref, Ref } from 'vue'
import { DatasetSelection, DataPath } from '@/types/main'
import { useDatasetStore } from '@/store/useDatasetStore'

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
    // localSelectionPriority: {
    //   type: Array as PropType<string[]>,
    //   required: true,
    // },
    // localSelection: {
    //   type: Object as PropType<{ [key: string]: DatasetSelection[] }>,
    //   required: true,
    // },
  },

  setup(props) {
    const { getters: datasetGetters } = useDatasetStore()
    const d = datasetGetters.selectedDataset
    // const theDataset = ref(d)
    const { actions: datasetActions } = useDatasetStore()
    let currentDataPath = ref<DataPath>({
      path: '',
      currentKey: '',
      nextKey: '',
      currentValue: '',
      title: '',
    })
    let mode = ref('')
    const showInput = ref(false)
    const localSelectionPriority: Ref<string[]> = ref(d.value.selectionPriority)
    const localSelection: Ref<{ [key: string]: DatasetSelection[] }> = ref(
      d.value.selection
    )

    //Methods
    const showInputBox = (path: DataPath, modeValue: string) => {
      mode.value = modeValue
      console.log(props.path)
      currentDataPath.value = path
      showInput.value = !showInput.value
    }

    const addSubset = (currentDataPath: DataPath, depth: number) => {
      console.log(currentDataPath.path, depth, currentDataPath.title)
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
      console.log(newPath)

      showInput.value = !showInput.value
      //  Match the path and add the subset
      let p = ''
      let depthIndex = 0
      const subsetPath = (subsets: DatasetSelection[]) => {
        subsets.forEach((set) => {
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
            console.log(set)
          }
          // console.log(set)
          if (set.selection) {
            subsetPath(set.selection[Object.keys(set.selection)[0]])
          } else {
            p = ''
            depthIndex = 0
          }
        })
      }
      if (Object.keys(localSelection.value).length > 0) {
        subsetPath(localSelection.value[Object.keys(localSelection.value)[0]])
      } else {
        Object.assign(localSelection.value, {
          [currentDataPath.nextKey]: [nySubset],
        })
      }
      console.log(localSelection.value)
      datasetActions.addSelection(localSelection.value)
      showInput.value = false
    }
    return {
      // selectionPriority: computed(() =>
      //   theDataset.value.selectionPriority.findIndex((i) => i == props.label)
      // ),
      // theDataset,
      localSelection,
      localSelectionPriority,
      showInput,
      currentDataPath,
      // Methods
      showInputBox,
      addSubset,
    }
  },
})
</script>
