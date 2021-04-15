import Vue from 'vue';
import Vuex from 'vuex';

import general from './modules/general';
import video from './modules/video';
import setting from './modules/setting';

Vue.use(Vuex);

export default new Vuex.Store({
  modules: {
    general,
    video,
    setting,
  },
});
