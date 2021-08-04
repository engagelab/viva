<template>
  <div>
    <div>
      <Set
        v-if="theDataset.selection"
        :nodes="theDataset.selection"
        :selectedPriority="InitialSelectionPriority"
        :label="Object.keys(theDataset.selection)[0]"
        :title="''"
      ></Set>

      <!-- <div v-for="(selections, key) in theDataset.selection" :key="key">
        Key: {{ key }}
        <div v-if="selections.length != 0">
          <div v-for="(selection, index) in selections" :key="index">

          </div>
        </div>
      </div> -->
      <Subset
        v-if="theDataset.selection"
        :title="Object.keys(theDataset.selection)[0]"
        :label="Object.keys(theDataset.selection)[0]"
        :nodes="theDataset.selection[Object.keys(theDataset.selection)[0]]"
        :index="0"
        :path="''"
      ></Subset>
    </div>

    <!-- <div
      class="bg-blue-400 rounded-lg w-4 cursor-pointer"
      @click="setCurrentSelectionPriority(selectionItem)"
    >
      +
    </div> -->
    <!-- <div
      v-if="theDataset.selection && theDataset.selectionPriority.length != 0"
    >
      <div v-for="(item, index) in theDataset.selection" :key="index">
        item: {{ index }}:
        <div v-for="(subItem, subItemIndex) in item" :key="subItemIndex">
          subItem: {{ subItem.title }}
          {{ subItem.selection }}
        </div>
      </div>
      <div
        v-for="(selectionItem, index) in theDataset.selectionPriority"
        :key="index"
      >
        {{ index }} {{ selectionItem }}:
        <div
          class="flex"
          v-for="(titleItem, titleIndex) in theDataset.selection[selectionItem]"
          :key="titleIndex"
        >
          <p>{{ titleItem.title }}{{ titleIndex }}</p>

          <p
            v-if="
              titleItem.selection &&
              Object.keys(titleItem.selection).length != 0
            "
          >
            {{ Object.keys(titleItem.selection)[0] }}:
            {{ titleItem.selection[Object.keys(titleItem.selection)[0]] }}
          </p>

          <div
            class="bg-blue-400 rounded-lg w-4 cursor-pointer"
            @click="setCurrentSelectionPriority(selectionItem)"
          >
            +
          </div>
        </div>
      </div>
    </div> -->

    <!-- Add new subset -->
    <div class="flex justify-start ...">
      <div class="flex flex-row" v-if="showInput">
        <input
          v-model="currentSubset"
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
          >Add {{ currentSelectionPriority }}
        </SlButton>
        <!-- <div v-if="errorMessage" class="text-red-600">
            {{ errorMessage }}
          </div> -->
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import { computed, defineComponent, ref } from 'vue'

import { useDatasetStore } from '@/store/useDatasetStore'
import { DatasetSelection } from '@/types/main'
import Set from '@/components/TreeMenu.vue'
// import AnswerInput from '@/components/base/AnswerInput.vue'
// import SelectionBox from '@/components/base/SelectionBox.vue'
// interface Tree {
//   label: string
//   nodes: Tree[]
// }
import SlButton from '@/components/base/Button.vue'
import Subset from './subset.vue'
export default defineComponent({
  name: 'DatasetItem',
  components: {
    Set,
    // SelectionBox,
    // AnswerInput,
    SlButton,
    Subset,
  },

  setup() {
    const { getters: datasetGetters, actions: datasetActions } =
      useDatasetStore()
    const d = datasetGetters.selectedDataset
    const theDataset = ref(d)
    const showInput = ref(false)
    const currentSubset = ref('')
    let currentSelectionPriority = ref('')

    const InitialSelectionPriority = computed(() => {
      return theDataset.value.selection
        ? theDataset.value.selectionPriority.find(
            (i) => i == Object.keys(theDataset.value.selection)[0]
          )
        : ''
    })
    //Methods
    const setCurrentSelectionPriority = (selectionPriority: string) => {
      let index: number =
        theDataset.value.selectionPriority.indexOf(selectionPriority)
      if (index > -1) {
        currentSelectionPriority.value =
          theDataset.value.selectionPriority[index + 1]
      } else
        currentSelectionPriority.value = theDataset.value.selectionPriority[0]

      showInput.value = !showInput.value
    }

    const addSubset = () => {
      let subset: DatasetSelection = {
        title: currentSubset.value,
        selection: {},
      }

      datasetActions.addSelection(currentSelectionPriority.value, subset)
      showInput.value = !showInput.value
      currentSelectionPriority.value = ''
    }

    return {
      theDataset,
      showInput,
      currentSelectionPriority,
      currentSubset,
      InitialSelectionPriority,
      // Methods
      addSubset,
      setCurrentSelectionPriority,
    }
  },
})
</script>
