<template>
  <div class="flex flex-col px-4 pt-4 w-full">
    <SVGSymbol
      class="text-viva-korall fill-current"
      applyClasses="w-4 md:w-8"
      @click.native="back()"
      width="25"
      rotation="180"
    ></SVGSymbol>
    <div class="mx-4 mt-4 md:mx-8 md:mt-8">
      <div class="flex justify-left">
        <span>{{$t('infoklasse')}}</span>
        <div class="pl-8">
          <select v-model="selectedCategory" @change="dataChanged()">
            <option :value="null" hidden>{{$t('velg')}}</option>
            <option
              v-for="category in categoryBasedOnSetting"
              :value="category.value"
              :key="category.value"
            >{{ category.label }}</option>
          </select>
        </div>
      </div>

      <div class="flex-1 rounded mt-4">
        <p>{{ $t('filnavn')}}: {{ video.name }}</p>
        <!--NewItem v-if="video.name" class="my-2" :initialName="video.name" @new-text="newVideoName" /-->
      </div>

      <div class="flex-1 rounded mt-4">
        <Input
          v-model="video.description"
          @change="dataChanged()"
          type="textarea"
          rows="5"
          :placeholder="$t('placeholder')"
        />
      </div>
    </div>
  </div>
</template>

<!-- TODO: add language options for labels 'Åpen (grønn)'/'Open (green)' and 'Begrenset (gul)'/'Restricted (yellow)'
           and dialogText 'Vennligst bekreft at du vil slette opptaket.'/'Please confirm delete. The recording will be irrevocable.'-->
<i18n>
{
  "no": {
    "infoklasse": "Klassifiser beskyttelsesverdi for opptaket:",
    "velg": "Velg...",
    "filnavn": "Filnavn",
    "placeholder": "Her kan du gjøre notater til dette opptaket...",
    "green": "Åpen (grønn)",
    "yellow": "Begrenset (gul)",
    "red": "Fortrolig (rød)"
  },
  "en": {
    "infoklasse": "Classify this recording as:",
    "velg": "Choose...",
    "filnavn": "Filename",
    "placeholder": "Optional notes for this recording...",
    "green": "Open (green)",
    "yellow": "Restricted (yellow)",
    "red": "Confidential (red)"
  }
}
</i18n>

<script>
import { mapGetters, mapActions, mapMutations } from 'vuex';
import Input from '../../../components/base/Input';
import NewItem from '../../../components/base/NewItem';
import SVGSymbol from '../../../components/base/SVGSymbol';
import utilities from '../../../api/utilities';
import moment from 'moment';
export default {
  components: {
    Input,
    SVGSymbol,
  },
  data() {
    return {
      fags: ['Norsk', 'Matte', 'Nytt fag'],
      vidStatus: null,
      video: {
        category: '',
        description: '',
        name: '',
        subState: {},
      },
      note: '',
      categoryLists: [
        { label: 'Åpen (grønn)', value: 'green' },
        { label: 'Begrenset (gul)', value: 'yellow' },
        // { label: 'Fortrolig (rød)', value: 'red' },
        //   { label: 'Black', value: 'black' }, We are not yet there :SM
      ],
      selectedCategory: null,
      progressUpdateInterval: undefined,
      firstTimeLoaded: false,
      dialogText: 'Vennligst bekreft at du vil slette opptaket.',
      itemSelected: false,
    };
  },
  mounted() {
    if (this.selectedVideo) {
      this.firstTimeLoaded = true;
      this.video.category = this.selectedVideo.category;
      if (this.video.category != '') {
        this.selectedCategory = this.video.category;
      }
      this.video.name = this.selectedVideo.name;
      this.video.description = this.selectedVideo.description;
      this.video.subState = this.selectedVideo.subState;
    }
  },
  computed: {
    ...mapGetters('general', ['user']),
    ...mapGetters('setting', ['selectedDatasett']),
    ...mapGetters('video', ['selectedVideo']),
    categoryBasedOnSetting() {
      // If yellow is chosen in primary storage in Admin portal ,the user has to reduce the senstivity of the data
      // Or they are not provided with Red choice
      let category = this.categoryLists.map(c => {
        return { label: this.$t(c.value), value: c.value };
      });
      return category;
    },
    formattedCreationDate: function() {
      return utilities.formatDate(this.selectedVideo.created);
    },
    // Triggered when video recording data is ready
    hasNewDataAvailable: function() {
      return this.selectedVideo.hasNewDataAvailable;
    },
  },
  watch: {
    hasNewDataAvailable(newDataAvailable) {
      if (newDataAvailable && !this.firstTimeLoaded) {
        this.dataChanged();
      } else {
        this.firstTimeLoaded = false;
      }
    },
  },
  methods: {
    ...mapMutations('video', ['updateTempVideoAttribs']),
    ...mapActions('video', ['setUnsavedChanges', 'updateDraftMetadata']),
    dataChanged() {
      if (this.selectedCategory != null) {
        this.video.category = this.selectedCategory;
        this.video.subState.classified = true;
      } else {
        this.video.category = '';
        this.video.subState.classified = false;
      }
      this.setUnsavedChanges(this.selectedVideo.fileId);
      this.saveMetadata();
    },
    computeFileName() {
      let filename = '';
      let fileAttributes = [
        ...this.selectedDatasett.storages[0].storagePath.fileName,
      ];
      if (fileAttributes.length != 0) {
        fileAttributes.forEach(attribute => {
          if (attribute == 'datasettName')
            filename =
              filename +
              '-' +
              this.selectedDatasett.navn +
              '_' +
              this.selectedDatasett.dataManager;
          if (attribute == 'fileId')
            filename =
              filename + '-' + this.selectedVideo.fileId.substring(0, 7);
          if (attribute == 'timeStamp') {
            filename =
              filename +
              '-' +
              moment(this.selectedVideo.created).format('Do-MMM-YYYY-h-mm-ss');
          }
          if (attribute == 'dataManager') {
            filename = filename + '-' + this.selectedDatasett.dataManager.name;
          }
          if (attribute == 'UserID') {
            filename = filename + '-' + this.user.username;
          }
        });

        return filename.substring(1, filename.length);
      } else return this.selectedVideo.name;
    },
    back() {
      this.dataChanged(); // Video could be classified in previous login
      this.saveMetadata();
      this.$router.push('/videos/editor?page=0');
    },
    newVideoName(newName) {
      this.video.name = newName;
      this.dataChanged();
    },
    // Save changes into the stored metadata > to Store and indexedDB/Cordova storage
    saveMetadata() {
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
p {
  margin-bottom: 2rem;
}
</style>
