<template>
  <div>
    <div
      class="pl-4 pt-2 font-vagBold flex flex-row items-center"
      v-if="selectedDataset"
    >
      <SVGSymbol
        v-if="selectedDataset"
        class="text-viva-korall fill-current mr-4 cursor-pointer"
        applyClasses="w-4 md:w-8"
        @click="backToUtvalgSelection()"
        width="25"
        rotation="180"
      ></SVGSymbol>
      <span
        v-if="selectedDataset"
        class="text-black"
        style="width: min-content"
        >{{ selectedDataset.name }}</span
      >
      <!--span v-html="completeSelectionName"></span-->

      <div
        v-for="(u, i) in completeSelectionName"
        :key="i"
        class="flex flex-row items-center"
      >
        <span class="px-1">&gt;</span>
        <SVGSymbol
          v-if="u.locked"
          class="text-viva-korall fill-current px-1"
          applyClasses="w-3"
          symbol="padlock"
        ></SVGSymbol>
        <span>{{ u.title }}</span>
      </div>
    </div>

    <div class="p-4 text-3xl text-viva-korall">
      <p class="text-xl" v-if="!selectionReady">Velg {{ selectionName }}</p>
    </div>
    <div
      v-if="datasets.length === 0"
      class="flex flex-col items-center w-full px-4 py-2 max-h-1/2"
    >
      <p v-if="user" class="pr-2">
        {{ `${user.profile.username} ${t('Not registered')}` }}
        <a class="text-blue-500" href="mailto:ils-kontakt@ils.uio.no"
          >ils-kontakt@ils.uio.no</a
        >
      </p>
    </div>
    <div
      v-if="!selectionReady && listItems.length >= 0"
      class="flex flex-col flex-1 overflow-y-auto scrolling-touch pl-4"
      style="max-height: 300px"
    >
      <transition-group
        v-if="!selectionReady && listItems.length > 0"
        name="slide-fade"
        tag="div"
        :leave-to-class="leaveToClass"
        :enter-class="enterClass"
        mode="out-in"
      >
        <DatasetItem
          class="p-2"
          v-for="(item, index) in listItems"
          :key="index"
          :title="item.title"
          :description="item.description ? item.description : ''"
          :keyName="item.keyName"
          :data="item.data"
          @slider-change="changeSlide"
        />
      </transition-group>
      <NewItem
        v-if="
          selectedDataset &&
          currentSelection.length < selectedDataset.selectionPriority.length
        "
        class="my-2"
        :filter="'[.-\\s]'"
        @new-text="newUtvalgItem"
      />
    </div>
    <div v-if="selectionReady" class="flex flex-col items-center w-full">
      <div
        v-if="
          selectedDataset &&
          selectedDataset.consent.kind == CONSENT_TYPES.samtykke
        "
      >
        <p>{{ t('Link to consent Nettschema') }}</p>
        <Button class="mt-4 ml-2 my-2 w-64" @vclick="copyLink()">{{
          t('Kopier lenke til skjema')
        }}</Button>
        <!--Button :text="t('Send epost med skjema')" class="mt-4 ml-2 my-2 w-64" @click="sendEmail()" /-->
        <Button v-if="!useCordova" class="mt-4 ml-2 my-2 w-64">
          <a :href="mailtoURI">{{ t('Send epost med skjema') }}</a>
        </Button>
      </div>
      <div v-else>
        <p v-if="selectedDataset" class="p-2">
          {{ behandlings[selectedDataset.consent.kind].description }}
        </p>
      </div>
    </div>
    <div
      v-if="selectionReady"
      class="px-4 pt-4 pb-2 text-2xl flex flex-row justify-end items-center"
    >
      <p class="pr-2">{{ t('Nytt opptak') }}</p>
      <SVGSymbol
        class="text-viva-korall fill-current"
        applyClasses="w-6 md:w-8"
        @click="newVideo()"
        symbol="addViva"
      ></SVGSymbol>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, onMounted, ref, Ref } from 'vue'
import router from '@/router'
import { useI18n } from 'vue-i18n'
import { CONSENT_TYPES, behandlings } from '@/constants'
import cordovaService from '@/api/cordovaService'
import { Dataset, DatasetLock, DatasetSelection } from '@/types/main'
import { useAppStore } from '@/store/useAppStore'
import { useDatasetStore } from '@/store/useDatasetStore'
import { useVideoStore } from '@/store/useVideoStore'
import { useNotifyStore } from '@/store/useNotifyStore'
const { actions: notifyActions } = useNotifyStore()
const { actions: appActions, getters: appGetters } = useAppStore()
const { getters: videoGetters, actions: videoActions } = useVideoStore()
const { getters: datasetGetters, actions: datasetActions } = useDatasetStore()

import clipboard from 'clipboard-polyfill'
import DatasetItem from './base/DatasetItem.vue'
import Button from './base/Button.vue'
import NewItem from './base/NewItem.vue'
import SVGSymbol from './base/SVGSymbol.vue'

interface ListData {
  title: string
  description?: string
  keyName: string
  data: DatasetSelection | Dataset
}

export default defineComponent({
  name: 'datasett',
  components: {
    DatasetItem,
    NewItem,
    Button,
    SVGSymbol,
  },
  setup() {
    const messages = {
      nb_NO: {
        'Not registered':
          'er ikke registrert for noen datainnsamling. Hvis du mener dette er feil ta kontakt med:',
        'Link to consent Nettschema': 'Lenke til digitalt samtykkeskjema:',
        'Kopier lenke til skjema': 'Kopier lenke til skjema',
        'Send epost med skjema': 'Send epost med skjema',
        'Nytt opptak': 'Nytt opptak',
        mailtoSubject: 'VIVA Samtykke',
        mailtoBody: '',
        linkCopied: 'Lenke er kopiert',
        copyFailed: 'Kopi feil!',
      },
      en: {
        'Not registered':
          'is not enrolled into any data collection. If you think this is incorrect, please contact:',
        'Link to consent Nettschema': 'Link to digital consent form:',
        'Kopier lenke til skjema': 'Copy the link',
        'Send epost med skjema': 'Send link by email',
        'Nytt opptak': 'New recording',
        mailtoSubject: 'VIVA Consent',
        mailtoBody: '',
        linkCopied: 'Link copied',
        copyFailed: 'Copy failed!',
      },
    }
    const { t } = useI18n({ messages })
    const leaveToClass = 'slide-fade-leave-to-right'
    const enterClass = 'slide-fade-enter-right'
    const currentSelection: Ref<ListData[]> = ref([])

    onMounted(() => {
      rebuildPresetUtvalg()
    })

    // Computed functions

    const user = appGetters.user
    const deviceStatus = appGetters.deviceStatus
    const useCordova = appGetters.useCordova
    const datasets = datasetGetters.datasets
    const presetConfig = datasetGetters.presetDatasetConfig
    const selectedDataset = datasetGetters.selectedDataset

    const selectionName = computed(() => {
      if (selectedDataset.value) {
        return selectedDataset.value.selectionPriority[
          currentSelection.value.length
        ]
      }
      return 'datasett'
    })
    const selectionLocked = computed(() => {
      if (presetConfig.value && selectedDataset.value) {
        return !!presetConfig.value.locks[selectedDataset.value._id]
      }
      return false
    })
    const completeSelectionName = computed(() => {
      return currentSelection.value.map((u, index) => {
        return { title: u.title, locked: selectionLocked.value && index === 0 }
      })
    })
    const selectionReady = computed(() => {
      return (
        selectedDataset.value &&
        currentSelection.value.length ==
          selectedDataset.value.selectionPriority.length
      )
    })
    const getConsentUrl = computed(() => {
      const subsetString = currentSelection.value.reduce(
        (acc, u) => acc + `${u.keyName}-${u.title}.`,
        ''
      )
      if (selectedDataset.value) {
        return `https://nettskjema.no/a/${selectedDataset.value.formId}?CBdataset=${selectedDataset.value._id}?CBsubset=${subsetString}`
      } else return ''
    })
    const mailtoURI = computed(() => {
      const string = `mailto:?subject=${t('mailtoSubject')}&body=${
        getConsentUrl.value
      }`
      return encodeURI(string)
    })

    const listItems = computed(() => {
      let items: ListData[] = []
      if (!selectedDataset.value) {
        items = datasets.value.map((d) => {
          return {
            title: d.name,
            description: d.description,
            keyName: '',
            data: d,
          }
        })
      } else if (
        selectedDataset.value.selectionPriority.length >
        currentSelection.value.length
      ) {
        let depth = currentSelection.value.length
        const key = selectedDataset.value.selectionPriority[depth]
        let list: DatasetSelection[] = []
        if (depth === 0) list = selectedDataset.value.selection[key]
        else {
          const s = currentSelection.value[depth - 1].data.selection
          if (s) list = s[key]
        }
        if (list) {
          items = list.map((ds) => ({
            id: Math.random().toString(),
            title: ds.title,
            description: '',
            keyName: key,
            data: ds,
          }))
        }
      }
      return items
    })

    // Methods:

    function newVideo(): void {
      if (presetConfig.value && selectedDataset.value) {
        videoActions
          .createMetadata({
            dataset: selectedDataset.value,
            selection: presetConfig.value.currentSelection,
            user: user.value,
            deviceStatus: appGetters.deviceStatus.value,
          })
          .then(() => {
            const v = videoGetters.selectedVideo.value
            if (v) {
              appActions.addDraftIdToUser(v.details.id)
              return appActions
                .updateUserAtServer(user.value)
                .then(() => videoActions.saveMetadata())
                .then(() => router.push('/videos/editor?page=0'))
            }
          })
      }
    }

    function changeSlide(d: {
      data: Dataset | DatasetSelection
      keyName: string
    }): void {
      if (!selectedDataset.value && d.data instanceof Dataset) {
        datasetActions.selectDataset(d.data)
        if (presetConfig.value && presetConfig.value.locks[d.data._id]) {
          // If this dataset has already viewed consents, the first utvalg level may be locked
          // This mean we should recover the same utvalg as was previously set
          const lock: DatasetLock = presetConfig.value.locks[d.data._id]
          const u = lock.selection
          const list = d.data.selection[u.keyName]
          const data = list.find((item) => item.title == u.title)
          if (data) {
            const su: ListData = { data, keyName: u.keyName, title: u.title }
            currentSelection.value = [su]
          }
        }
      } else if (
        selectedDataset.value &&
        currentSelection.value.length <
          selectedDataset.value.selectionPriority.length
      ) {
        const theData = d.data as DatasetSelection
        const level = selectedDataset.value.selectionPriority.indexOf(d.keyName)
        if (level === currentSelection.value.length) {
          const su: ListData = {
            data: theData,
            keyName: d.keyName,
            title: theData.title,
          }
          currentSelection.value.push(su)
        }
        if (
          currentSelection.value.length ==
          selectedDataset.value.selectionPriority.length
        ) {
          saveSelection()
        }
      }
    }

    function backToUtvalgSelection(): void {
      if (currentSelection.value.length > 0) {
        currentSelection.value.pop()
        if (currentSelection.value.length === 0 && selectionLocked.value) {
          datasetActions.selectDataset(undefined)
        }
      } else datasetActions.selectDataset(undefined)
    }

    function rebuildPresetUtvalg(): void {
      const presetID = presetConfig.value?.id || ''
      const dataset = datasets.value.find((d) => d._id == presetID)
      if (dataset && presetConfig.value) {
        datasetActions.selectDataset(dataset)
        const tempSelection: ListData[] = []
        presetConfig.value.currentSelection.forEach((u, depth) => {
          let list: DatasetSelection[] = []
          if (depth === 0) list = dataset.selection[u.keyName]
          else {
            const s = tempSelection[depth - 1].data.selection
            if (s) list = s[u.keyName]
          }
          const data = list.find((item) => item.title == u.title)
          if (data) {
            const su: ListData = { data, keyName: u.keyName, title: u.title }
            tempSelection.push(su)
          }
        })
        currentSelection.value = tempSelection
      }
    }

    function saveSelection(): void {
      if (
        selectedDataset.value &&
        presetConfig.value &&
        currentSelection.value
      ) {
        const newPresetConfig = {
          id: selectedDataset.value._id,
          locks: presetConfig.value.locks, // A dictionary of Dates referenced by dataset ID
          currentSelection: currentSelection.value.map((l) => ({
            title: l.title,
            keyName: l.keyName,
          })),
        }
        datasetActions.setPresetDatasetConfig(newPresetConfig)
        appActions.updateUserAtServer(user.value)
      }
    }

    function newUtvalgItem(newSelectionName: string): void {
      const path = currentSelection.value.map((u) => u.title)
      if (selectedDataset.value) {
        datasetActions.addSelectionToDataset({
          path,
          newSelectionName,
          dataset: selectedDataset.value,
        })
      }
    }

    function copyLink(): void {
      console.log(getConsentUrl.value)
      console.log(mailtoURI.value)
      const copySuccess = () => {
        notifyActions.setSnackbar({
          visibility: true,
          text: t('linkCopied'),
          type: 'message',
          callback: undefined,
        })
      }
      const copyError = () => {
        notifyActions.setSnackbar({
          visibility: true,
          text: t('copyFailed'),
          type: 'error',
          callback: undefined,
        })
      }
      if (appGetters.useCordova) {
        cordovaService.copyToClipboard(
          getConsentUrl.value,
          copySuccess,
          copyError
        )
      } else {
        clipboard.writeText(getConsentUrl.value).then(copySuccess, copyError)
      }
    }

    return {
      t,
      leaveToClass,
      enterClass,
      currentSelection,
      CONSENT_TYPES,
      behandlings,

      user,
      deviceStatus,
      useCordova,
      datasets,
      presetConfig,
      selectedDataset,
      selectionName,
      selectionLocked,
      completeSelectionName,
      selectionReady,
      getConsentUrl,
      mailtoURI,
      listItems,

      newVideo,
      changeSlide,
      backToUtvalgSelection,
      saveSelection,
      newUtvalgItem,
      copyLink,
    }
  },
})
</script>
<style scoped lang="postcss">
input {
  display: inline;
  max-width: 100%;
}
.slide-fade-enter-active {
  transition: all 0.3s linear;
  transition-delay: 0.3s;
}
.slide-fade-leave-active {
  transition: all 0.3s linear;
}
.slide-fade-enter-right {
  transform: translateX(-100px);
  opacity: 0;
}
.slide-fade-leave-to-right {
  opacity: 0;
}
</style>
