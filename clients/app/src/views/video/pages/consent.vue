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
        @vclick="checkAll()"
        customWidth="130px"
      >
        <p class="text-sm">{{ t('SjekkAlt') }}</p>
      </Button>
    </div>
    <div class="flex flex-col flex-1 overflow-y-auto scrolling-touch p-4">
      <p class="text-xs">{{ t('consentDelayNote') }}</p>
      <p class="pl-4" v-if="selectedVideo && consentList.length === 0">
        {{ `${t('noConsentsFound')} ${selectedVideo.dataset.name}` }}
      </p>
      <p v-if="manualConsent">{{ t('ManualHandling') }}</p>
      <div v-if="consentList.length > 0">
        <ConsentItem
          class="flex flex-row pt-4"
          v-for="consent in consentList"
          :key="consent.value.submission_id"
          :consent="consent"
          checkboxes="true"
          @change="dataChanged"
        ></ConsentItem>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, Ref, onMounted, watch } from 'vue'
import router from '@/router'
import { CONSENT_TYPES } from '@/constants'
import { useI18n } from 'vue-i18n'
import { Video, Consent } from '@/types/main'
import { useDatasetStore } from '@/store/useDatasetStore'
import { useVideoStore } from '@/store/useVideoStore'
const { actions: videoActions, getters: videoGetters } = useVideoStore()
const { getters: datasetGetters } = useDatasetStore()

import SVGSymbol from '@/components/base/SVGSymbol.vue'
import Button from '@/components/base/Button.vue'
import ConsentItem from '@/components/base/ConsentItem.vue'

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
    let manualConsent = true
    const video = ref(new Video().updateFromVideo(selectedVideo.value))
    const consentList: Ref<Ref<Consent>[]> = ref([])
    const standardConsent: Ref<Consent> = ref({
      id: 'standardConsent-id',
      name: 'Bekreft',
      checked: false,
      submission_id: 'standardConsent',
      reference: {
        username: t('understood'),
      },
      questions: {},
    })

    watch(
      () => datasetGetters.consents,
      (newValue) => {
        consentList.value = newValue.value.map((c) => ref(c))
      }
    )

    onMounted(() => {
      const v = selectedVideo.value
      manualConsent = !(
        !!selectedDataset.value &&
        selectedDataset.value.consent.kind == CONSENT_TYPES.samtykke
      )
      if (v) {
        video.value.updateStatus(v.status)
        standardConsent.value.checked = video.value.status.isConsented
        video.value.consents = v.consents

        // 8/2021: Locking to a specific Utvalg selection causes problems if the Dataset is later modified to remove the
        // 'selection priority' that leads to this lock
        // Decided for this point in time to remove the lock feature

        /* const datasetId = v.dataset.id
        const presetConfig = datasetGetters.presetDatasetConfig.value
        if (
          presetConfig &&
          !presetConfig.locks[datasetId] &&
          v.dataset.selection.length
        ) {
          const s = v.dataset.selection[0]
          datasetActions.lockSelection({
            datasetId,
            lock: {
              date: new Date(),
              selection: {
                keyName: s.keyName,
                title: s.title,
              },
            },
          })
          appActions.updateUserAtServer()
        } */
      }
      consentList.value = manualConsent
        ? [standardConsent]
        : datasetGetters.consents.value.map((c) => ref(c))
    })

    function back(): void {
      videoActions.updateMetadata(video.value)
      router.push('/videos/editor?page=0')
    }
    function checkAll(): void {
      consentList.value.forEach((c) => (c.value.checked = true))
      dataChanged()
    }
    function dataChanged(newValue?: DataChangedEvent): void {
      if (newValue) {
        if (newValue.checked) video.value.status.isConsented = true
        const consent = consentList.value.find(
          (c) => c.value.submission_id === newValue.id
        )
        if (consent) consent.value.checked = newValue.checked
      }
      if (consentList.value.every((c) => !c.value.checked)) {
        video.value.status.isConsented = false
      }
      if (selectedVideo.value) {
        video.value.consents = consentList.value
          .filter((c) => c.value.checked)
          .map(
            (c) =>
              c.value.reference.username ||
              c.value.reference.user_fullname ||
              c.value.submission_id
          )
        videoActions.setUnsavedChanges(selectedVideo.value?.details.id)
        videoActions.updateMetadata(video.value)
      }
    }

    return {
      t,
      manualConsent,
      consentList,
      standardConsent,
      video,
      selectedVideo,
      selectedDataset,
      back,
      checkAll,
      dataChanged,
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
