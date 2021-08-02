<template>
  <div>
    <div>
      <div v-if="index > 0" class="flex space-x-2" :class="`ml-${index * 4}`">
        <div
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
              currentKey: theDataset.selectionPriority[index - 1],
              currentValue: title,
              path: path,
              title: '',
            })
          "
        >
          +
        </div>
        <p>{{ theDataset.selectionPriority[index - 1] }}:{{ title }}</p>
      </div>
      <Subset
        v-for="node in nodes"
        :title="node.title"
        :label="node.selection ? Object.keys(node.selection)[0] : ''"
        :nodes="
          node.selection ? node.selection[Object.keys(node.selection)[0]] : []
        "
        :key="node"
        :index="index + 1"
        :path="
          theDataset.selectionPriority[index - 1]
            ? theDataset.selectionPriority[index - 1] + '-' + title
            : title
        "
      >
      </Subset>
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
            @click="addSubset()"
            >Add
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
import { defineComponent, computed, PropType, ref } from 'vue'
import { DatasetSelection, DataPath } from '@/types/main'
import { useDatasetStore } from '@/store/useDatasetStore'

export default defineComponent({
  name: 'subset',
  components: {},
  props: {
    path: String,
    index: { type: Number, required: true },
    title: { type: String, required: true },
    label: String,
    nodes: { type: Object as PropType<DatasetSelection[]>, required: true },
  },

  setup(props) {
    const { getters: datasetGetters, actions: datasetActions } =
      useDatasetStore()
    const d = datasetGetters.selectedDataset
    const theDataset = ref(d)
    let currentDataPath = ref<DataPath>({
      path: '',
      currentKey: '',
      currentValue: '',
      title: '',
    })
    const showInput = ref(false)
    //Methods

    const showInputBox = (path: DataPath) => {
      currentDataPath.value = path
      showInput.value = !showInput.value
    }

    const addSubset = () => {
      datasetActions.addSelection(currentDataPath.value)
      showInput.value = !showInput.value
    }
    return {
      selectionPriority: computed(() =>
        theDataset.value.selectionPriority.findIndex((i) => i == props.label)
      ),
      theDataset,
      showInput,
      currentDataPath,
      // Methods
      showInputBox,
      addSubset,
    }
  },
})
</script>
