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
        @click.native="backToUtvalgSelection()"
        width="25"
        rotation="180"
      ></SVGSymbol>
      <span
        v-if="selectedDatasett"
        class="text-black"
        style="width: min-content"
        >{{ selectedDatasett.navn }}</span
      >
      <!--span v-html="completeUtvalgName"></span-->

      <div
        v-for="(u, i) in completeUtvalgName"
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
      <p class="text-xl" v-if="!utvalgReady">Velg {{ utvalgName }}</p>
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
      v-if="!utvalgReady && listItems.length >= 0"
      class="flex flex-col flex-1 overflow-y-auto scrolling-touch pl-4"
      style="max-height: 300px"
    >
      <transition-group
        v-if="!utvalgReady && listItems.length > 0"
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
          selectedUtvalg.length < selectedDatasett.utvalgtPriority.length
        "
        class="my-2"
        :filter="'[.-\\s]'"
        @new-text="newUtvalgItem"
      />
    </div>
    <div v-if="utvalgReady" class="flex flex-col items-center w-full">
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
      v-if="utvalgReady"
      class="px-4 pt-4 pb-2 text-2xl flex flex-row justify-end items-center"
    >
      <p class="pr-2">{{ $t('Nytt opptak') }}</p>
      <SVGSymbol
        class="text-viva-korall fill-current"
        applyClasses="w-6 md:w-8"
        @click.native="newVideo()"
        symbol="addViva"
      ></SVGSymbol>
    </div>
  </div>
</template>

<i18n>
{
  "no": {
    "Not registered": "er ikke registrert for noen datainnsamling. Hvis du mener dette er feil ta kontakt med:",
    "Link to consent Nettschema": "Lenke til digitalt samtykkeskjema:",
    "Kopier lenke til skjema": "Kopier lenke til skjema",
    "Send epost med skjema": "Send epost med skjema",
    "Nytt opptak": "Nytt opptak",
    "mailtoSubject": "VIVA Samtykke",
    "mailtoBody": "",
    "linkCopied": "Lenke er kopiert",
    "copyFailed": "Kopi feil!"
  },
  "en": {
    "Not registered": "is not enrolled into any data collection. If you think this is incorrect, please contact:",
    "Link to consent Nettschema": "Link to digital consent form:",
    "Kopier lenke til skjema": "Copy the link",
    "Send epost med skjema": "Send link by email",
    "Nytt opptak": "New recording",
    "mailtoSubject": "VIVA Consent",
    "mailtoBody": "",
    "linkCopied": "Link copied",
    "copyFailed": "Copy failed!"
  }
}
</i18n>

<script>
import clipboard from 'clipboard-polyfill'
import cordovaService from '../api/cordovaService'
import { mapActions, mapGetters, mapMutations } from 'vuex'
import DatasetItem from './base/DatasetItem'
import Button from './base/Button'
import NewItem from './base/NewItem'
import SVGSymbol from './base/SVGSymbol'

export default {
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
  data() {
    return {
      leaveToClass: 'slide-fade-leave-to-right',
      enterClass: 'slide-fade-enter-right',
      selectedUtvalg: [],
    }
  },
  mounted() {
    if (this.presetDatasett) {
      this.rebuildPresetUtvalg()
    }
  },
  computed: {
    ...mapGetters('general', ['user', 'deviceStatus', 'useCordova']),
    ...mapGetters('setting', [
      'settings',
      'presetDatasett',
      'selectedDatasett',
      'selectedDatasetInfo',
    ]),
    utvalgName() {
      if (this.selectedDatasett) {
        return this.selectedDatasett.utvalgtPriority[this.selectedUtvalg.length]
      }
      return 'datasett'
    },
    utvalgLocked() {
      return !!this.presetDatasett.locks[this.selectedDatasett.id]
    },
    completeUtvalgName() {
      return this.selectedUtvalg.map((u, index) => {
        return { title: u.title, locked: this.utvalgLocked && index === 0 }
      })
    },
    utvalgReady() {
      return (
        this.selectedDatasett &&
        this.selectedUtvalg.length ==
          this.selectedDatasett.utvalgtPriority.length
      )
    },
    getConsentUrl() {
      const subsetString = this.selectedUtvalg.reduce(
        (acc, u) => (acc = acc + `${u.keyName}-${u.title}.`),
        ''
      )
      return `https://nettskjema.no/a/${this.selectedDatasett.formId}?CBdataset=${this.selectedDatasett.id}?CBsubset=${subsetString}`
    },
    mailtoURI() {
      const string = `mailto:?subject=${this.$t('mailtoSubject')}&body=${
        this.getConsentUrl
      }`
      const url = encodeURI(string)
      return url
    },
    listItems() {
      let items = []
      if (!this.selectedDatasett) {
        items = this.settings.map((s) => ({
          id: s.id,
          title: s.navn,
          description: s.description,
          keyName: '',
          data: s,
        }))
      } else if (
        this.selectedDatasett.utvalgtPriority.length >
        this.selectedUtvalg.length
      ) {
        let depth = this.selectedUtvalg.length
        const key = this.selectedDatasett.utvalgtPriority[depth]
        const list =
          depth === 0
            ? this.selectedDatasett.utvalg[key]
            : this.selectedUtvalg[depth - 1][key]
            ? this.selectedUtvalg[depth - 1][key]
            : []
        if (list) {
          items = list.map((l) => ({
            id: Math.random(),
            title: l.title,
            description: '',
            keyName: key,
            data: l,
          }))
        }
      }
      return items
    },
  },
  methods: {
    ...mapActions('general', ['updateUser']),
    ...mapMutations('general', ['setSnackbar']),
    ...mapActions('setting', [
      'selectDatasett',
      'setPresetDatasett',
      'addUtvalgToDatasett',
    ]),
    ...mapActions('video', ['createDraftVideo']),
    newVideo() {
      appActions
        .createMetadata({
          dataset: this.selectedDatasett,
          selection: this.selectedDataset.selection,
          user: this.user,
          deviceStatus: appGetters.deviceStatus,
        })
        .then(() => this.$router.push('/videos/editor?page=0'))
    },
    changeSlide({ data, keyName }) {
      if (!this.selectedDatasett) {
        this.selectDatasett(data)
        // If this dataset has already viewed consents, the first utvalg level may be locked
        // This mean we should recover the same utvalg as was previously set
        const lock = this.presetDatasett.locks[this.selectedDatasett.id]
        if (lock) {
          const u = lock.utvalg
          const list = this.selectedDatasett.utvalg[u.keyName]
          const data = list.find((item) => item.title == u.title)
          const su = { ...data, keyName: u.keyName, title: u.title }
          this.selectedUtvalg = [su]
        }
      } else if (
        this.selectedUtvalg.length <
        this.selectedDatasett.utvalgtPriority.length
      ) {
        const level = this.selectedDatasett.utvalgtPriority.indexOf(keyName)
        if (level === this.selectedUtvalg.length) {
          const su = { ...data, keyName }
          this.selectedUtvalg.push(su)
        }
        if (
          this.selectedUtvalg.length ==
          this.selectedDatasett.utvalgtPriority.length
        ) {
          this.saveUtvalg()
        }
      }
    },
    backToUtvalgSelection() {
      if (this.selectedUtvalg.length > 0) {
        this.selectedUtvalg.pop()
        if (this.selectedUtvalg.length === 0 && this.utvalgLocked) {
          this.selectDatasett(undefined)
        }
      } else {
        this.selectDatasett(undefined)
      }
    },
    rebuildPresetUtvalg() {
      const p = this.presetDatasett
      const datasett = this.settings.find((setting) => setting.id == p.id)
      if (!datasett) return
      this.selectDatasett(datasett)
      const selectedUtvalg = []
      this.presetDatasett.utvalg.forEach((u, depth) => {
        const list =
          depth === 0
            ? this.selectedDatasett.utvalg[u.keyName]
            : selectedUtvalg[depth - 1][u.keyName]
        const data = list.find((item) => item.title == u.title)
        const su = { ...data, keyName: u.keyName, title: u.title }
        selectedUtvalg.push(su)
      })
      this.selectedUtvalg = selectedUtvalg
    },
    saveUtvalg() {
      this.setPresetDatasett({
        id: this.selectedDatasett.id,
        locks: this.presetDatasett.locks, // A dictionary of Dates referenced by dataset ID
        utvalg: this.selectedUtvalg.map((l) => ({
          title: l.title,
          keyName: l.keyName,
        })),
      })
      this.updateUserAtServer(this.user)
      // this.$router.push('/videos/list');
    },
    newUtvalgItem(newUtvalgName) {
      const path = this.selectedUtvalg.map((u) => u.title)
      this.addUtvalgToDatasett({
        datasett: this.selectedDatasett,
        newUtvalgName,
        path,
      })
    },
    copyLink() {
      console.log(this.getConsentUrl)
      console.log(this.mailtoURI)
      const copySuccess = () => {
        this.setSnackbar({
          visibility: true,
          text: this.$t('linkCopied'),
          type: 'message',
          callback: undefined,
        })
      }
      const copyError = () => {
        this.setSnackbar({
          visibility: true,
          text: this.$t('copyFailed'),
          type: 'error',
          callback: undefined,
        })
      }
      if (this.useCordova) {
        cordovaService.copyToClipboard(
          this.getConsentUrl,
          copySuccess,
          copyError
        )
      } else {
        clipboard.writeText(this.getConsentUrl).then(copySuccess, copyError)
      }
    },
    sendEmail() {
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
    },
    checkConsent(consent) {
      console.log(consent)
    },
  },
}
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
