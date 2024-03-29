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
  <div class="flex flex-col flex-grow min-h-0">
    <div
      class="
        flex-initial flex-shrink flex-grow
        min-h-0
        flex-col
        overflow-y-auto
        scrolling-touch
        p-4
        py-10
      "
    >
      <p class="text-3xl text-viva-korall mb-6">{{ t('title') }}</p>
      <div
        class="
          flex-grow
          h-auto
          text-viva-lilla
          viva-description
          overflow-y-scroll
          scrolling-touch
        "
      >
        <p>{{ t('descriptionLine1') }}</p>
        <p>{{ t('descriptionLine2') }}</p>
        <p>{{ t('descriptionLine3') }}</p>
        <p>{{ t('descriptionLine4') }}</p>
      </div>
    </div>
    <div class="flex flex-row h-12 md:h-20 justify-between px-8 py-10">
      <div @click="$emit('slider-back')">
        <SVGSymbol
          class="fill-current text-viva-korall"
          applyClasses="w-4 md:w-8"
          rotation="180"
        />
      </div>
      <div @click="$router.push('/login?page=2')">
        <SVGSymbol
          class="fill-current text-viva-korall"
          applyClasses="w-4 md:w-8"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/store/useAppStore'
const { actions: appActions, getters: appGetters } = useAppStore()

import SVGSymbol from '@/components/base/SVGSymbol.vue'

export default defineComponent({
  components: {
    SVGSymbol,
  },
  setup() {
    const messages = {
      nb_NO: {
        title: 'Dette er VIVA',
        descriptionLine1:
          'I VIVA kan du gjøre opptak som inneholder personopplysninger, også opptak som inneholder særlige kategorier av personopplysninger. Hvis du ikke har lov til eller ikke ønsker å lagre særlige kategorier av personopplysninger, kan deler av opptaket slettes før det sendes til lagring.',
        descriptionLine2:
          'Når du har gjort et opptak, må du se gjennom opptaket og klassifisere det i henhold til UiOs klassifisering (grønne/gule /røde data). Opptaket krypteres og overføres fra enheten din (for eksempel en mobiltelefon) til sikker lagring ved Universitetet i Oslo. Alle opptak logges.',
        descriptionLine3:
          'Du starter med å velge et datasett. Dette datasettet er lagt inn i VIVA-appen av en behandlingsansvarlig ved din utdanningsinstitusjon. Uten et slikt datasett, får du ikke sendt opptakene dine til lagring.',
        descriptionLine4:
          'Behandlingsansvarlig bestemmer også hvor opptaket i ditt datasett kan lagres, hvilke typer data (grønn/gul/rød) du har lov til å lagre og hvilket behandlingsgrunnlag som gjelder. I tillegg kan behandlingsansvarlig bestemme at UiOs digitale samtykkeportal skal benyttes.',
      },
      en: {
        title: 'This is VIVA',
        descriptionLine1:
          'You may use VIVA to record personal data, even recordings that contain sensitive data. Sensitive data may be deleted before the recording is transferred to permanent storage if you are not allowed to or do not want to store sensitive data.',
        descriptionLine2:
          'After each recording you have to review it and classify it based on the UiO classification policy (gree/yellow/red data). The recording is encrypted and transferred from your device (e.g. a mobile phone) to secure storage at the University of Oslo. All recordings are logged.',
        descriptionLine3:
          'You start by selecting a data set. A data set is defined by a data controller and contains rules about storage locations, allowed classification classes of data, and the legal basis for data processig. The data controller may state that the UiO digital consent portal is to be used.',
      },
    }
    const { t } = useI18n({ messages })
    return {
      t,
      isLoggedIn: appGetters.isLoggedIn,
      logout: appActions.logout,
    }
  },
})
</script>

<style scoped>
.bold {
  font-family: 'VAG Rounded Std Bold';
}
.viva-description p {
  margin-top: 1em;
}
</style>
