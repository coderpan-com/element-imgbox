import Imgbox from './imgbox.vue';

const ElxImgboxPlugin = {
  install(Vue) {
    const CONSTRUCTOR = Vue.extend(Imgbox);

    // 定义插件
    Vue.elxImgbox = Vue.prototype.$elxImgbox = function(options = {}, selectedImgs) {
      let imgbox = new CONSTRUCTOR;
      if (typeof selectedImgs === 'undefined') {
        imgbox.selectedImgs = {}
      } else {
        imgbox.selectedImgs = JSON.parse(JSON.stringify(selectedImgs))
        for (let i = 0; i < imgbox.selectedImgs.length; i++) {
          imgbox.selectedImgs[i].selected = true
        }
      }

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
