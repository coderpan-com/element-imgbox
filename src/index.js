import Imgbox from './imgbox.vue';

const ElxImgboxPlugin = {
  install(Vue) {
    const CONSTRUCTOR = Vue.extend(Imgbox);

    // 插件实例（共享）
    let imgbox;

    Vue.elxImgbox = Vue.prototype.$elxImgbox = function(options = {}) {
      imgbox || (imgbox = new CONSTRUCTOR);

      for(const i in options) {
        imgbox.options[i] = options[i];
      }

      if (!imgbox.$el) {
        let vm = imgbox.$mount();
        document.querySelector('body').appendChild(vm.$el);
      }

      // 已选取上传tab但上传未启用，则转到图片选取（仅演示时有这种情况，正式使用不会有）
      if(imgbox.activeTab === 'upload' && !imgbox.options.enableUpload) {
        imgbox.activeTab = 'pick';
      }

      // 切换为单选时（实际应用一般不会发生），清空所有选项
      if(!imgbox.options.multiple) {
        imgbox.handleCancelAll();
      }

      imgbox.visible = true;

      return imgbox;
    }
  }
}

// 自动启用插件
if (typeof window !== 'undefined' && window.Vue) {
  window.Vue.use(ElxImgboxPlugin);
}

export default ElxImgboxPlugin;
