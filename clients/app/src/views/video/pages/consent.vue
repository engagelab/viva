<template>
  <div class="flex flex-col flex-grow min-h-0">
    <div class="flex flex-row justify-between p-4">
      <SVGSymbol
        class="text-viva-korall fill-current self-start p-2"
        applyClasses="w-4 md:w-8"
        @click.native="back()"
        width="25"
        rotation="180"
      ></SVGSymbol>
      <Button
        v-if="selectedDatasett.samtykke == 'samtykke' && consentList.length > 1"
        @click="checkAll()"
        customWidth="130px"
      >
        <p class="text-sm">{{$t('SjekkAlt')}}</p>
      </Button>
    </div>
    <div
      v-if="selectedDatasett.samtykke == 'samtykke'"
      class="flex flex-col flex-1 overflow-y-auto scrolling-touch p-4"
    >
      <p class="text-xs">{{ $t('consentDelayNote') }}</p>
      <p
        class="pl-4"
        v-if="consentList.length === 0"
      >{{`${$t('noConsentsFound')} ${selectedVideo.datasetInfo.name}` }}</p>
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
    <div v-else class="flex flex-col flex-1 overflow-y-auto scrolling-touch p-4">
      <p>{{ $t('ManualHandling')}}</p>
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

<i18n>
{
  "no": {
    "SjekkAlt": "Velg alle",
    "ManualHandling": "Samtykker i dette datasettet håndteres manuelt",
    "noConsentsFound": "Ingen samtykker er gitt for ",
    "understood": "Forstått",
    "consentDelayNote": "Det kan ta opptil en time før nye samtykker vises her"
  },
  "en": {
    "SjekkAlt": "Choose everyone",
    "ManualHandling": "Consents in this data set is handled manually",
    "noConsentsFound": "No consents are given for ",
    "understood": "Understood",
    "consentDelayNote": "It can take up to an hour before new consents are visible here"
  }
}
</i18n>

<script>
import Vue from 'vue';
import { mapGetters, mapActions, mapMutations } from 'vuex';
import SVGSymbol from '../../../components/base/SVGSymbol';
import Button from '../../../components/base/Button';
import ConsentItem from '../../../components/base/ConsentItem';
export default {
  components: {
    ConsentItem,
    SVGSymbol,
    Button,
  },
  data() {
    return {
      consentList: [],
      standardConsent: {
        id: 'standardConsent-id',
        name: 'Bekreft',
        checked: false,
        reference: {
          consenter_name: this.$t('understood'),
        },
        questions: {},
      },
      video: {
        consents: [],
        subState: {
          consented: false,
        },
      },
    };
  },
  mounted() {
    if (this.selectedVideo) {
      this.video.subState = this.selectedVideo.subState;
      this.standardConsent.checked = this.selectedVideo.subState.consented;
      this.video.consents = this.selectedVideo.consents;
      const datasettId = this.selectedVideo.datasetInfo.id;
      if (!this.presetDatasett.locks[datasettId]) {
        const split = this.selectedVideo.datasetInfo.utvalg[0].split(':');
        this.lockUtvalg({
          datasettId,
          utvalg: {
            keyName: split[0],
            title: split[1],
          },
        });
        this.updateUser(this.user);
      }
    }
    this.consentList = [...this.consents];
  },
  watch: {
    consents(newValue) {
      this.consentList = [...newValue];
    },
  },
  computed: {
    ...mapGetters('general', ['user']),
    ...mapGetters('setting', [
      'consents',
      'selectedDatasett',
      'presetDatasett',
    ]),
    ...mapGetters('video', ['selectedVideo']),
  },
  methods: {
    ...mapActions('general', ['updateUser']),
    ...mapActions('video', ['setUnsavedChanges', 'updateDraftMetadata']),
    ...mapMutations('setting', ['lockUtvalg']),
    back() {
      this.saveMetadata();
      this.$router.push('/videos/editor?page=0');
    },
    checkAll() {
      this.consentList.forEach(c => (c.checked = true));
      this.dataChanged(true);
    },
    dataChanged(newValue) {
      if (newValue && newValue.checked) {
        this.video.subState.consented = true;
      } else if (this.consentList.every(c => !c.checked)) {
        this.video.subState.consented = false;
      }
      this.video.consents = [...this.consents];
      this.setUnsavedChanges(this.selectedVideo.fileId);
      this.saveMetadata();
    },
    saveMetadata() {
      // this.video.consents = this.consentList;
      console.log(this.video.consents);
      return this.updateDraftMetadata({
        setting: this.selectedDatasett,
        user: this.user,
        fileId: this.selectedVideo.fileId,
        updates: this.video,
      });
    },
  },
};
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
