<template>
  <div
    class="relative flex flex-row items-center text-viva-grey-500 bg-viva-grey-400 my-1"
    @mouseover="hover = true"
    @mouseleave="hover = false"
  >
    <div
      class="text-white text-xs focus:bg-viva-grey-450 rounded-full"
      :class="[annotation.nowActive ? 'bg-yellow-500' : 'bg-viva-grey-450']"
    >
      <p class="p-3">
        {{ annotation.comment }}
      </p>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Annotation } from '../types/main'
import { stringToColour } from '@/utilities'
import { baseUrl } from '@/constants'

const messages = {
  nb_NO: {
    dialogDeleteTitle: 'Slett denne delingen',
    dialogDeleteText:
      'Hvis du sletter, fjernes også alle merknader fra andre, kommentarer og triminnstillinger',
    dialogDeleteConfirm: 'Slette',
    dialogDeleteCancel: 'Avbryt',
  },
  en: {
    dialogDeleteTitle: 'Delete this share',
    dialogDeleteText:
      'Deleting will also remove all annotations from others, comments, and trim settings',
    dialogDeleteConfirm: 'Delete',
    dialogDeleteCancel: 'Cancel',
  },
}

export default defineComponent({
  name: 'AnnotationCard',
  props: {
    annotation: { type: Object as PropType<Annotation>, required: true },
  },
  emits: ['annotate'],
  setup() {
    const { t } = useI18n({ messages })
    const hover = ref(false)
    const menu = ref(false)

    return {
      t,
      stringToColour,
      hover,
      menu,
      baseUrl,
    }
  },
})
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style type="postcss" scoped></style>
