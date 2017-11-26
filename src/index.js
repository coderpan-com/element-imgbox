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

      if(!imgbox.options.enablePick) {
        imgbox.activeTab = 'upload';
      } else if(!imgbox.options.enableUpload) {
        imgbox.activeTab = 'pick';
      } else if(imgbox.activeTab === 'upload' && imgbox.options.enablePick) {
        // 默认进入选取图片
        imgbox.activeTab = 'pick';
      }

      // 切换为单选时（实际应用一般不会发生），清空所有选项
      if(!imgbox.options.multiple) {
        imgbox.handleCancelAll();
      }

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
