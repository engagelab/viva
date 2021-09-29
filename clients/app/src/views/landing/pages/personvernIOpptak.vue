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
  <div>
    <div class="p-4">
      <p class="text-3xl text-viva-korall mb-6">{{ t('title') }}</p>
      <div class="text-viva-lilla">
        <p>{{ t('descriptionLine1') }}</p>
        <p>{{ t('descriptionLine2') }}</p>
        <p>{{ t('descriptionLine3') }}</p>
      </div>
    </div>
    <div class="flex flex-row w-full justify-between">
      <div class="pl-16" @click="$emit('slider-back')">
        <SVGSymbol
          class="fill-current text-viva-korall"
          applyClasses="w-4 md:w-8"
          rotation="180"
        />
      </div>
      <div class="pr-16" @click="$router.push('/login?page=3')">
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
        title: 'Personvern i opptak',
        descriptionLine1:
          'Du må se gjennom opptakene før du kan sende dem til lagring. Hvis du for eksempel ønsker å fjerne særlige kategorier av personopplysninger, kan du trimme opptaket og legge på filtre midt i opptaket.',
        descriptionLine2:
          'For eksempel kan VIVA benyttes til å gjøre opptak av undervisnings- og læringsaktiviteter. Dette faller inn under informasjonsklasse begrenset (gule data).',
        descriptionLine3:
          'Det kan være at opptak inneholder utsagn om helsetilstand, politisk tilhørighet eller religiøs overbevisning. Slike utsagn faller inn under informasjonsklasse fortrolig (røde data). Med VIVA kan slike opplysninger slettes før de sendes fra enheten din, altså før de sendes til lagring ved din utdanningsinstitusjon.',
      },
      en: {
        title: 'Privacy in recordings',
        descriptionLine1:
          'You have to review your recordings before sending to permanent storage. If you e.g. have to remove sensitive personal data you may trim recordings and add blur in the middle of a recording.',
        descriptionLine2:
          'You would normally record teaching and learning activities. Such recordings are categorised as restricted (yellow data).',
        descriptionLine3:
          "Recordings may contain utterances about a student's health situation, political or religious preference. Using VIVA such data may be deleted before they are transferred from your device to permanent storage.",
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
</style>
