<template>
  <div class="flex flex-row items-center justify-between viva-item max-w-xs">
    <div v-if="!editing" class="flex flex-row items-center">
      <p>{{ initialName }}</p>
      <div @click="editNewitem()">
        <SVGSymbol
          v-if="!initialName"
          class="p-2 text-viva-korall fill-current cursor-pointer"
          applyClasses="w-4 md:w-4"
          rotation="0"
          symbol="addNew"
        />
        <SVGSymbol
          v-else
          class="p-2 text-viva-korall fill-current cursor-pointer"
          applyClasses="w-4 md:w-4"
          rotation="0"
          symbol="edit"
        />
      </div>
    </div>
    <div v-else class="flex">
      <Input @input="newValue => name = newValue" v-model="name" />
      <div class="pl-4" @click="removeNewitem()">
        <SVGSymbol
          class="p-2 text-viva-korall fill-current cursor-pointer"
          applyClasses="w-4 md:w-4"
          rotation="0"
          symbol="remove"
        />
      </div>
      <div class="pl-4" @click="addNewitem()" v-if="name != ''">
        <SVGSymbol
          class="p-2 text-viva-korall fill-current cursor-pointer"
          applyClasses="w-4 md:w-4"
          rotation="0"
          symbol="accept"
        />
      </div>
    </div>
  </div>
</template>

<script>
import SVGSymbol from '../../components/base/SVGSymbol';
import Input from '../../components/base/Input';

export default {
  components: {
    SVGSymbol,
    Input,
  },
  props: {
    initialName: {
      type: String,
      default: '',
    },
    filter: {
      type: String,
      default: '\\W',
    },
  },
  data() {
    return {
      editing: false,
      name: '',
    };
  },
  mounted() {
    if (this.initialName) {
      this.name = this.initialName;
    }
  },
  methods: {
    editNewitem() {
      if (this.initialName) {
        this.name = this.initialName;
      }
      this.editing = true;
    },
    removeNewitem() {
      this.name = this.initialName || '';
      this.editing = false;
    },
    addNewitem() {
      let regex;
      regex = new RegExp(this.filter, 'g');
      const newName = this.name.replace(regex, '');
      this.$emit('new-text', newName);
      this.removeNewitem();
    },
  },
};
</script>
