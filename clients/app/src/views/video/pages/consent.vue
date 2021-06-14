<template>
  <div class="flex flex-col flex-grow min-h-0">
    <div class="flex flex-row justify-between p-4">
      <SVGSymbol
        class="text-viva-korall fill-current self-start p-2"
        applyClasses="w-4 md:w-8"
        @click="back()"
        width="25"
        rotation="180"
      ></SVGSymbol>
      <Button
        v-if="
          selectedDataset &&
          selectedDataset.consent.kind == CONSENT_TYPES.samtykke &&
          consentList.length > 1
        "
        @click="checkAll()"
        customWidth="130px"
      >
        <p class="text-sm">{{ t('SjekkAlt') }}</p>
      </Button>
    </div>
    <div
      v-if="
        selectedDataset &&
        selectedDataset.consent.kind == CONSENT_TYPES.samtykke
      "
      class="flex flex-col flex-1 overflow-y-auto scrolling-touch p-4"
    >
      <p class="text-xs">{{ t('consentDelayNote') }}</p>
      <p class="pl-4" v-if="selectedVideo && consentList.length === 0">
        {{ `${t('noConsentsFound')} ${selectedVideo.dataset.name}` }}
      </p>
      <div v-if="consentList.length > 0">
        <ConsentItem
          class="flex flex-row pt-4"
          v-for="consent in consentList"
          :key="consent.submission_id"
          :consent="consent"
          v-model="consent.checked"
          checkboxes="true"
          @input-change="dataChanged"
        ></ConsentItem>
      </div>
    </div>
    <div
      v-else
      class="flex flex-col flex-1 overflow-y-auto scrolling-touch p-4"
    >
      <p>{{ t('ManualHandling') }}</p>
      <ConsentItem
        class="flex flex-row pt-4"
        :key="standardConsent.id"
        :consent="standardConsent"
        v-model="standardConsent.checked"
        @input-change="dataChanged"
        checkboxes="true"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, Ref, onMounted, watch } from 'vue'
import router from '@/router'
import { CONSENT_TYPES } from '@/constants'
import { useI18n } from 'vue-i18n'
import { Video, Consent } from '@/types/main'
import { useAppStore } from '@/store/useAppStore'
import { useDatasetStore } from '@/store/useDatasetStore'
import { useVideoStore } from '@/store/useVideoStore'
const { actions: appActions } = useAppStore()
const { actions: videoActions, getters: videoGetters } = useVideoStore()
const { getters: datasetGetters, actions: datasetActions } = useDatasetStore()

import SVGSymbol from '@/components/base/SVGSymbol.vue'
import Button from '@/components/base/Button.vue'
import ConsentItem from '@/components/base/ConsentItem.vue'

interface StandardConsent {
  id: string
  name: string
  checked: boolean
  reference: {
    consenter_name: string
  }
  questions: Record<string, unknown>
}
interface DataChangedEvent {
  checked: boolean
  id: string
}

export default defineComponent({
  components: {
    ConsentItem,
    SVGSymbol,
    Button,
  },
  setup() {
    const messages = {
      nb_NO: {
        SjekkAlt: 'Velg alle',
        ManualHandling: 'Samtykker i dette datasettet håndteres manuelt',
        noConsentsFound: 'Ingen samtykker er gitt for ',
        understood: 'Forstått',
        consentDelayNote:
          'Det kan ta opptil en time før nye samtykker vises her',
      },
      en: {
        SjekkAlt: 'Choose everyone',
        ManualHandling: 'Consents in this data set is handled manually',
        noConsentsFound: 'No consents are given for ',
        understood: 'Understood',
        consentDelayNote:
          'It can take up to an hour before new consents are visible here',
      },
    }
    const { t } = useI18n({ messages })
    const selectedVideo = videoGetters.selectedVideo
    const selectedDataset = datasetGetters.selectedDataset
    const video = ref(new Video(selectedVideo.value))
    const consentList: Ref<Consent[]> = ref([])
    const standardConsent: Ref<StandardConsent> = ref({
      id: 'standardConsent-id',
      name: 'Bekreft',
      checked: false,
      reference: {
        consenter_name: t('understood'),
      },
      questions: {},
    })

    watch(
      () => datasetGetters.consents,
      (newValue) => {
        consentList.value = [...newValue.value]
      }
    )

    onMounted(() => {
      if (selectedVideo.value) {
        video.value.updateStatus(selectedVideo.value.status)
        standardConsent.value.checked = video.value.status.isConsented
        video.value.consents = selectedVideo.value.consents
        const datasetId = selectedVideo.value.dataset.id
        const presetConfig = datasetGetters.presetDatasetConfig.value
        if (presetConfig && !presetConfig.locks[datasetId]) {
          const split =
            selectedVideo.value.dataset.selection[0].title.split(':')
          datasetActions.lockSelection({
            datasetId,
            lock: {
              date: new Date(),
              selection: {
                keyName: split[0],
                title: split[1],
              },
            },
          })
          appActions.updateUserAtServer()
        }
      }
      consentList.value = [...datasetGetters.consents.value]
    })

    function back(): void {
      saveMetadata()
      router.push('/videos/editor?page=0')
    }
    function checkAll(): void {
      consentList.value.forEach((c) => (c.checked = true))
      dataChanged()
    }
    function dataChanged(newValue?: DataChangedEvent): void {
      if (newValue && newValue.checked) {
        video.value.status.isConsented = true
      } else if (consentList.value.every((c) => !c.checked)) {
        video.value.status.isConsented = false
      }
      if (selectedVideo.value) {
        video.value.consents = datasetGetters.consents.value.map((c) => c.name)
        videoActions.setUnsavedChanges(selectedVideo.value?.details.id)
        saveMetadata()
      }
    }
    function saveMetadata(): void {
      console.log(video.value.consents)
      videoActions.updateMetadata(video.value)
    }

    return {
      t,
      consentList,
      standardConsent,
      video,
      selectedVideo,
      selectedDataset,
      back,
      checkAll,
      dataChanged,
      saveMetadata,
      CONSENT_TYPES,
    }
  },
})
</script>

<style scoped>
.bold {
  font-family: 'VAG Rounded Std Bold';
}
.labels {
  color: #f05d5d;
  font-size: 14px;
  padding-right: 400px;
}
</style>
