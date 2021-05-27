export default class Datasett {
  constructor(spec) {
    if (spec) {
      const d = spec || {}

      this.id = d.id || ''
      this.navn = d.navn || ''
      this.description = d.description || ''
      this.created = d.created || ''
      this.elementer = d.elementer || ''
      this.dataManager = d.dataManager || {
        oauthId: '',
        name: ''
      }
      this.utvalgtPriority = d.utvalgtPriority || []
      this.utvalg = d.utvalg || {}
      this.dataportenGroups = d.dataportenGroups ? [...d.dataportenGroups] : [];
      this.isSamtykke = d.isSamtykke || 'true';
      this.samtykke = d.samtykke || 'Manual';
      this.samtykkeHandling = { ...d.samtykkeHandling };
      this.formId = d.formId || '';
      this.storages = d.storages ? [...d.storages] : [];
    }
  }
}
