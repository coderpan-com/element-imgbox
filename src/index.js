import ElxImgbox from './imgbox.vue';

const ElxImgboxPlugin = {
  install(Vue) {
    const CONSTRUCTOR = Vue.extend(ElxImgbox);
    let imgbox;

    function elxImgbox(options = {}) {
      imgbox || (imgbox = new CONSTRUCTOR);

      for(const i in options) {
        imgbox.options[i] = options[i];
      }

      if (!imgbox.$el) {
        let vm = imgbox.$mount();
        document.querySelector('body').appendChild(vm.$el);
      }

      imgbox.reset();
      imgbox.visible = true;

      return imgbox;
    }

    Vue.elxImgbox = Vue.prototype.$elxImgbox = elxImgbox;
  }
}

if (typeof window !== 'undefined' && window.Vue) {
  window.Vue.use(ElxImgboxPlugin);
}

export default ElxImgboxPlugin;
