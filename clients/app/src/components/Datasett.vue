<template>
  <div>
    <div
      class="pl-4 pt-2 font-vagBold flex flex-row items-center"
      v-if="selectedDatasett"
    >
      <SVGSymbol
        v-if="selectedDatasett"
        class="text-viva-korall fill-current mr-4 cursor-pointer"
        applyClasses="w-4 md:w-8"
        @click="backToUtvalgSelection()"
        width="25"
        rotation="180"
      ></SVGSymbol>
      <span
        v-if="selectedDatasett"
        class="text-black"
        style="width: min-content"
        >{{ selectedDatasett.navn }}</span
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
      v-if="settings.length === 0"
      class="flex flex-col items-center w-full px-4 py-2 max-h-1/2"
    >
      <p class="pr-2">
        {{ `${user.username} ${$t('Not registered')}` }}
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
          v-for="item in listItems"
          :key="item.id"
          :title="item.title"
          :keyName="item.keyName"
          :data="item.data"
          :description="item.description ? item.description : ''"
          @slider-change="changeSlide"
        />
      </transition-group>
      <NewItem
        v-if="
          selectedDatasett &&
          currentSelection.length < selectedDatasett.utvalgtPriority.length
        "
        class="my-2"
        :filter="'[.-\\s]'"
        @new-text="newUtvalgItem"
      />
    </div>
    <div v-if="selectionReady" class="flex flex-col items-center w-full">
      <div v-if="selectedDatasett.samtykke == 'samtykke'">
        <p>{{ $t('Link to consent Nettschema') }}</p>
        <Button class="mt-4 ml-2 my-2 w-64" @click="copyLink()">{{
          $t('Kopier lenke til skjema')
        }}</Button>
        <!--Button :text="$t('Send epost med skjema')" class="mt-4 ml-2 my-2 w-64" @click="sendEmail()" /-->
        <Button v-if="!useCordova" class="mt-4 ml-2 my-2 w-64">
          <a :href="mailtoURI">{{ $t('Send epost med skjema') }}</a>
        </Button>
      </div>
      <div v-else>
        <p class="p-2">
          {{
            selectedDatasett.samtykkeHandling[selectedDatasett.samtykke].value
          }}
        </p>
      </div>
    </div>
    <div
      v-if="selectionReady"
      class="px-4 pt-4 pb-2 text-2xl flex flex-row justify-end items-center"
    >
      <p class="pr-2">{{ $t('Nytt opptak') }}</p>
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
import {
  defineComponent,
  computed,
  onMounted,
  watch,
  ref,
  PropType,
  Ref,
} from 'vue'
import router from '@/router'
import { useI18n } from 'vue-i18n'
import { copyToClipboard } from '@/api/CordovaService'
import { Video, Dataset, DatasetLock, DatasetSelection } from '@/types/main'
import { useAppStore } from '@/store/useAppStore'
import { useDatasetStore } from '@/store/useDatasetStore'
import { useVideoStore } from '@/store/useVideoStore'
const { actions: appActions, getters: appGetters } = useAppStore()
const { actions: videoActions } = useVideoStore()
const { getters: datasetGetters, actions: datasetActions } = useDatasetStore()

import clipboard from 'clipboard-polyfill'
import DatasetItem from './base/DatasetItem.vue'
import Button from './base/Button.vue'
import NewItem from './base/NewItem.vue'
import SVGSymbol from './base/SVGSymbol.vue'

interface ListData {
  id: string
  title: string
  description: string
  keyName: string
  data: Dataset | DatasetSelection
}

export default defineComponent({
  name: 'datasett',
  components: {
    DatasetItem,
    NewItem,
    Button,
    SVGSymbol,
  },
  props: {
    page: {
      type: String,
      default: 'first',
    },
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
      return `https://nettskjema.no/a/${this.selectedDatasett.formId}?CBdataset=${this.selectedDatasett.id}?CBsubset=${subsetString}`
    })
    const mailtoURI = computed(() => {
      const string = `mailto:?subject=${this.$t('mailtoSubject')}&body=${
        getConsentUrl.value
      }`
      return encodeURI(string)
    })
    const listItems = computed(() => {
      let items: ListData[] = []
      if (!selectedDataset.value) {
        items = datasets.value.map((d) => ({
          id: d._id,
          title: d.name,
          description: d.description,
          keyName: '',
          data: d,
        }))
      } else if (
        selectedDataset.value.selectionPriority.length >
        currentSelection.value.length
      ) {
        let depth = currentSelection.value.length
        const key = selectedDataset.value.selectionPriority[depth]
        let list: DatasetSelection[] = []
        if (depth === 0) list = selectedDataset.value.selection[key]
        else if (currentSelection.value[depth - 1].data[key])
          list = currentSelection.value[depth - 1].data[key]
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
            selection: presetConfig.value.selection,
            user: user.value,
            deviceStatus: appGetters.deviceStatus.value,
          })
          .then(() => router.push('/videos/editor?page=0'))
      }
    }

    function changeSlide(d: {
      data: Dataset | DatasetSelection
      keyName: string
    }): void {
      if (!selectedDataset.value && d.data instanceof Dataset) {
        datasetActions.selectDataset(d.data)
        if (presetConfig.value) {
          // If this dataset has already viewed consents, the first utvalg level may be locked
          // This mean we should recover the same utvalg as was previously set
          const lock: DatasetLock = presetConfig.value.locks[d.data._id]
          if (lock) {
            const u = lock.selection
            const list = d.data.selection[u.keyName]
            const data = list.find((item) => item.title == u.title)
            const su: ListData = { ...data, keyName: u.keyName, title: u.title }
            currentSelection.value = [su]
          }
        }
      } else if (
        d.data instanceof DatasetSelection &&
        currentSelection.value.length <
          selectedDataset.value.selectionPriority.length
      ) {
        const level = selectedDataset.value?.selectionPriority.indexOf(
          d.keyName
        )
        if (level === currentSelection.value.length) {
          const su: ListData = { ...d.data, keyName: d.keyName }
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
      const p = presetConfig.value
      if (p) {
        const dataset = datasets.value.find((d) => d._id == p.id)
        if (dataset) {
          datasetActions.selectDataset(dataset)
          const tempSelection: ListData[] = []
          p.selection.forEach((u, depth) => {
            const list =
              depth === 0
                ? dataset.selection[u.keyName]
                : tempSelection[depth - 1][u.keyName]
            const data = list.find((item) => item.title == u.title)
            const su: ListData = { ...data, keyName: u.keyName, title: u.title }
            tempSelection.push(su)
          })
          this.currentSelection = tempSelection
        }
      }
    }

    function saveSelection(): void {
      if (
        selectedDataset.value &&
        presetConfig.value &&
        currentSelection.value
      ) {
        datasetActions.setDatasetConfig({
          id: selectedDataset.value._id,
          locks: presetConfig.value.locks, // A dictionary of Dates referenced by dataset ID
          selection: currentSelection.value.map((l) => ({
            title: l.title,
            keyName: l.keyName,
          })),
        })
        appActions.updateUserAtServer(user.value)
      }
    }

    function newUtvalgItem(newselectionName): void {
      const path = this.currentSelection.map((u) => u.title)
      this.addUtvalgToDatasett({
        datasett: this.selectedDatasett,
        newselectionName,
        path,
      })
    }

    function copyLink(): void {
      console.log(getConsentUrl.value)
      console.log(mailtoURI.value)
      const copySuccess = () => {
        appActions.setSnackbar({
          visibility: true,
          text: this.$t('linkCopied'),
          type: 'message',
          callback: undefined,
        })
      }
      const copyError = () => {
        appActions.setSnackbar({
          visibility: true,
          text: this.$t('copyFailed'),
          type: 'error',
          callback: undefined,
        })
      }
      if (this.useCordova) {
        copyToClipboard(this.getConsentUrl, copySuccess, copyError)
      } else {
        clipboard.writeText(this.getConsentUrl).then(copySuccess, copyError)
      }
    }

    function sendEmail(): void {
      function Mailto_url() {
        var encode_mailto_component = function (str) {
          try {
            return encodeURIComponent(str)
          } catch (e) {
            return escape(str)
          }
        }
        var AddressList = function () {
          var list = []
          this.length = 0
          this.add = function (address) {
            if (address) {
              list.push(address)
              this.length = list.length
            }
          }
          this.get = function () {
            return list.join(';')
          }
        }
        var subject = '',
          body = '',
          mainList = new AddressList(),
          ccList = new AddressList(),
          bccList = new AddressList()
        this.setSubject = function (str) {
          subject = encode_mailto_component(str)
        }
        this.setBody = function (str) {
          body = encode_mailto_component(str)
        }
        this.addMain = function (x) {
          mainList.add(x)
        }
        this.addCC = function (x) {
          ccList.add(x)
        }
        this.addBCC = function (x) {
          bccList.add(x)
        }
        this.getURL = function (allow_empty_mainList) {
          var out = ['mailto:']
          var extras = []
          if (mainList.length === 0 && !allow_empty_mainList) {
            throw 'Mailto_url: no main addressees'
          } else {
            out.push(mainList.get())
          }
          if (subject) {
            extras.push('subject=' + subject)
          }
          if (ccList.length) {
            extras.push('cc=' + ccList.get())
          }
          if (bccList.length) {
            extras.push('bcc=' + bccList.get())
          }
          if (body) {
            extras.push('body=' + body)
          }
          if (extras.length) {
            out.push('?' + extras.join('&'))
          }
          return out.join('')
        }
      }

      const link = document.createElement('a')
      const mailTo = new Mailto_url()
      const consentFormURL = this.getConsentUrl()
      mailTo.addMain('exampleuser@uio.no')
      mailTo.setSubject(this.$t('mailtoSubject'))
      mailTo.setBody(this.$t('mailtoBody') + '\n' + consentFormURL)

      link.href = mailTo.getURL(true)
      link.style.display = 'none'
      link.download = 'consent.eml'
      link.click()
    }

    function checkConsent(consent): void {
      console.log(consent)
    }

    return {
      t,
      leaveToClass,
      enterClass,
      currentSelection,

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
      sendEmail,
      checkConsent,
    }
  },
})
</script>
<style scoped>
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
