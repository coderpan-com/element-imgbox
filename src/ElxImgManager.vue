<template>
  <div class="elx-imgbox">
    <el-dialog :title="__('image_manager')" :visible.sync="visible" class="elx-imgbox-dialog" top="5vh">
      <el-tabs v-model="options.activeTab" tab-position="left">
        <el-tab-pane :label="__('pick_image')" name="pick" class="pick-block">
          <div class="elx-img-list-loading" v-if="isLoading">
            <div class="el-icon-loading"></div>
          </div>

          <div class="no-image" v-if="!isLoading && result.total === 0">{{ __('no_image') }}</div>

          <div class="elx-main elx-img-list">
            <div class="img-item" v-for="(img, itemIndex) in result.items" @click="onClickListImage(img)" :key="itemIndex">
              <div class="thumb-wp"><img :src="img.thumb" alt="img.name"></div>
              <div class="title">{{img.name}}</div>
              <div class="label" v-if="img.label">{{img.label}}</div>
              <span class="selected" v-if="img.selected"><span class="icon el-icon-check"></span></span>
            </div>
          </div>

          <el-pagination layout="total, prev, pager, next" :total="result.total" @current-change="onPageNumChange"></el-pagination>

          <div class="elx-foot">
            <el-badge :value="images.length" class="item">
              <el-button type="primary" size="medium" :disabled="images.length == 0" @click="onConfirm">{{ __('confirm') }}</el-button>
            </el-badge>
            <el-button type="primary" size="medium" @click="options.activeTab='upload'" plain v-if="options.enableUpload">{{ __('upload_image') }}</el-button>
          </div>
        </el-tab-pane>

        <el-tab-pane :label="__('upload_image')" name="upload" class="upload-block" v-if="options.enableUpload">
          <div class="elx-main">
            <div class="upload-title">{{ __('pick_local_image_tip') }}：</div>
            <el-upload
              ref="upload"
              class="upload-img-preview"
              list-type="picture-card"
              accept="image/*"
              :action="options.action"
              :multiple="options.multiple"
              :headers="options.headers"
              :with-credentials="options.withCredentials"
              :data="options.withData"
              :auto-upload="false"
              :limit="uploadNumberLimit()"
              :before-upload="beforeUpload"
              :on-change="onUploadChange"
              :on-progress="onUploadProgress"
              :on-success="onUploadSuccess"
              :on-error="onUploadError"
              :on-exceed="onUploadExceedTip">

              <i class="el-icon-plus"></i>

            </el-upload>

            <div class="upload-tip">{{ uploadTips() }}</div>

            <div class="elx-foot">
              <el-button type="primary" size="medium" @click="onUploadConfirm">{{ __('confirm_upload') }}</el-button>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>
  </div>
</template>

<script type="text/babel">
let LANG = {
  confirm: '确定',
  confirm_upload: '确定上传',
  image_manager: '图片管理器',
  pick_image: '选择图片',
  upload_image: '上传图片',
  upload_num_limit: '当前最多只能选择 {0} 张图片',
  server_no_response: '服务器打了个盹^_^',
  upload_type_limit: '仅支持上传 jpg/png/gif 图片',
  upload_size_limit: '大小不能超过',
  selected_num: '已有选择 {0} 张图片。',
  uploading_image_num: '即将上传 {0} 张图片。',
  can_upload_num: '还可以选择 {0} 张图片上传',
  pick_local_image_tip: '请选择本地图片上传',
  no_image: '暂无图片'
}
export default {
  name: 'ElxImgManager',

  model: {
    prop: 'images',
    event: 'change'
  },

  data () {
    return {
      images: [], // 已选图片
      options: {
        listUrl: '', // 图片列表数据URL
        action: '', // 图片上传URL
        multiple: false, // 是否支持选取多个图片
        withData: {}, // 上传时附带的额外参数
        withCredentials: true, // 支持发送 cookie 凭证信息
        headers: {}, // 设置上传的请求头部
        limit: 10, // 最多可选择图片数量
        maxSize: 2, // 最大尺寸（M）
        activeTab: 'pick',
        enableUpload: true, // 是否启用图片上传
        callback: null
      },

      isLoading: true,
      visible: false,
      uploadSuccessCount: 0,

      result: {
        items: [],
        total: 0
      }
    }
  },

  methods: {
    setOptions (options) {
      Object.assign(this.options, options)

      // 已选取上传tab但上传未启用，则转到图片选取（仅演示时有这种情况，正式使用不会有）
      if(this.options.activeTab === 'upload' && !this.options.enableUpload) {
        this.options.activeTab = 'pick';
      }
    },

    show () {
      this.visible = true
    },

    hide () {
      this.visible = false
    },

    onConfirm () {
      this.hide()
      if (typeof this.options.callback === 'function') {
        this.options.callback(this.images)
      }
    },

    /**
     * 点击图片时选中或取消选中图片
     * @param img object
     */
    onClickListImage (img) {
      var imgIndex = this.selectedImageIndex(img)

      if (imgIndex >= 0) {
        // 取消图片已选状态
        img.selected = false
        this.images.splice(imgIndex, 1)
        return
      }

      if (!this.options.multiple) {
        // 单选时，先取消已选
        this.images = []
        this.clearListSelected()
      }

      // 选择图片
      if (this.options.multiple && this.images.length >= this.options.limit) {
        ELEMENT.Message.warning(this.__('upload_num_limit', [this.options.limit]))
        return
      }

      img.selected = true
      this.images.push(JSON.parse(JSON.stringify(img)))
    },

    clearListSelected (img) {
      for (let i = 0; i < this.result.items.length; i++) {
        if (img) {
          if (img.url === this.result.items[i].url) {
            this.result.items[i].selected = false
            break
          }
        } else if (this.result.items[i].selected) {
          this.result.items[i].selected = false
        }
      }
    },

    /**
     * 加载图片列表数据
     * @param {int} page
     */
    loadList (page = 1) {
      if (!this.options.listUrl) {
        throw new Error('listUrl is required')
      }

      this.isLoading = true

      /**
       * result = {
       *     "items": [{"url": "img_url", "name": "img_name", "thumb": "img_thumb_url" ...}, ...],
       *     "total": number
       * }
       */
      axios.get(this.options.listUrl, { params: { page: page, ps: 15, _r: Math.random() } }).then(response => {
        const result = response.data
        this.result.total = parseInt(result.total)

        let imageList = []
        let listCount = 0

        for (let i = 0; i < result.items.length; i++) {
          listCount++

          // 每页只显示15条
          if (listCount > 15) {
            break
          }

          let img = result.items[i]

          if (!img.thumb) {
            img.thumb = img.url
          }

          // 图片名
          if (!img.name) {
            img.name = img.url.substr(img.url.lastIndexOf('/') + 1)
          }

          // 图片其他信息
          if (typeof img.label === 'undefined') {
            img.label = ''
          }

          // 图片选中状态
          img.selected = this.selectedImageIndex(img) > -1

          imageList.push(img)
        }

        this.result.items = imageList
        this.isLoading = false
      })
    },

    /**
     * 图片已选则返回下标，未选则返回-1
     */
    selectedImageIndex (img) {
      for (let i = 0; i < this.images.length; i++) {
        const selectedImg = this.images[i];

        if (selectedImg.url === img.url) {
          return i
        }
      }

      return -1
    },

    /**
     * 分页页面变化时刷新数据
     * @param page
     */
    onPageNumChange (page) {
      this.loadList(page)
    },

    /**
     * 提交上传图片
     */
    onUploadConfirm () {
      this.$refs.upload.submit()
    },

    onUploadProgress (event, file, fileList) {
      // console.log('onUploadProgress', event, file, fileList)
    },

    onUploadChange (file, fileList) {
      // console.log('onUploadChange', file, fileList)
    },

    /**
     * 上传图片前检查合法性
     * @param file
     * @returns {boolean}
     */
    beforeUpload (file) {
      const isJPG = file.type === 'image/jpeg'
      const isPNG = file.type === 'image/png'
      const isGif = file.type === 'image/gif'
      const isSize = file.size / (1024 * 1024) < this.options.maxSize

      if (!isJPG && !isPNG && !isGif) {
        ELEMENT.Message.error(this.uploadTypeTip())
        return false
      }

      if (!isSize) {
        ELEMENT.Message.error(this.uploadSizeTip())
        return false
      }

      return true
    },

    uploadNumberLimit () {
      if (!this.options.multiple) {
        return 1
      }

      return this.options.limit - this.images.length
    },

    uploadTypeTip () {
      return this.__('upload_type_limit')
    },

    uploadSizeTip () {
      return this.__('upload_size_limit') + ' ' + this.options.maxSize + 'M'
    },

    uploadTips () {
      let tips = [this.uploadTypeTip(), this.uploadSizeTip()]

      if (!this.options.multiple) {
        return tips.join('，')
      }

      if (this.images.length > 0) {
        tips.push(this.__('selected_num', [this.images.length]))
      }

      const uploadFileNum = this.$refs.upload ? this.$refs.upload.uploadFiles.length : 0
      if (uploadFileNum > 0) {
        tips.push(this.__('uploading_image_num', [uploadFileNum]))
      }

      tips.push(this.__('can_upload_num', [(this.options.limit - this.images.length - uploadFileNum)]))

      return tips.join('，')
    },

    /**
     * 上传错误处理
     * @param {Error} err
     * @param file
     * @param fileList
     */
    onUploadError (err, file, fileList) {
      if (err.message) {
        try {
          var data = JSON.parse(err.message)
          if (data && data.message) {
            ELEMENT.Message.error(data.message)
            return
          }
        } catch(e) {}
      }

      ELEMENT.Message.error(this.__('server_no_response'))
      // console.log('onUploadError', err)
      throw err
    },

    /**
     * 上传成功处理
     * @param response
     * @param file
     * @param fileList
     * @returns {boolean}
     */
    onUploadSuccess (response, file, fileList) {
      if (! response.success) {
        const message = response.message || '上传失败'
        ELEMENT.Message.error(message)
        return false
      }

      if (!this.options.multiple) {
        this.images = []
      }

      this.images.push(response.item)
      this.uploadSuccessCount++

      if (!this.options.multiple || fileList.length === this.uploadSuccessCount) {
        this.onConfirm()

        this.uploadSuccessCount = 0
        this.$refs.upload.clearFiles()
      }
    },

    /**
     * 选择上传文件超过限制文件个数提示
     */
    onUploadExceedTip () {
      ELEMENT.Message.warning(__('upload_num_limit', [this.uploadNumberLimit()]))
    },

    onRemove (imgIndex, img) {
      this.images.splice(imgIndex, 1)
      this.clearListSelected(img)
    },

    /**
     * 获取本地化语言
     * @returns string
     * @private
     * @param {string} key
     * @param {array} args
     */
    __(key, args) {
      let value = LANG[key] ? LANG[key] : key
      if (args) {
        for (let idx in args) {
          value = value.replace('{' + idx + '}', args[idx])
        }
      }
      return value
    }
  },

  mounted () {
    if (typeof ELX_IMGBOX_LANG !== 'undefined') {
      Object.assign(LANG, ELX_IMGBOX_LANG)
    }

    this.loadList()
  },

  computed: {

  }
}
</script>

<style lang="scss">
  .elx-images {
    .el-upload-list__item, .el-upload--picture-card {
      width: 78px;
      height: 78px;
      line-height: 82px;
      border-radius: 5px;
    }
  }

  .no-image {
    line-height: 120px;
    text-align: center;
    color: #999;
  }

  .elx-imgbox-dialog {
    $bg: #f6f6f6;

    .el-badge {
      vertical-align: bottom;
    }

    .el-dialog {
      width: 720px;

      .el-dialog__header {
        border-bottom:1px solid #e8e8e8;
      }

      .el-dialog__body {
        padding:0;
        background: $bg;
      }
    }

    .el-tabs {
      .el-tabs__header {
        margin-right: 0;
        margin-top: 5px;
        .el-tabs__nav-wrap::after {
          background: $bg;
        }
      }
      .el-tabs__item.is-active {
        background: #fff;
      }
      .el-tabs--left .el-tabs__nav-wrap {
        padding-top: 15px;
      }

      .el-tabs__content {
        height: 560px;
        background: #fff;
      }
    }

    .elx-foot {
      padding: 15px 0 0 10px;
      .el-button {
        margin:0 0 0 10px;
      }
    }

    .pick-block {
      position: relative;

      .elx-img-list-loading {
        position: absolute;
        z-index:9;
        left: 0;
        right: 0;
        width: 100%;
        height: 450px;
        background: #fff;
        text-align: center;

        .el-icon-loading {
          font-size:50px;
          color:#409EFF;
          line-height:250px;
        }
      }

      .elx-img-list {
        padding:10px;
        height:433px;

        .img-item {
          $imgSize: 100px;
          float: left;
          margin: 10px;
          width: $imgSize;
          cursor: pointer;
          position: relative;
          font-size:12px;

          img {
            width: $imgSize;
            height:$imgSize;
            display: block;
          }

          .title {
            line-height:24px;
            height:24px;
            display: block;
            overflow: hidden;
            background: $bg;
            padding: 0 5px;
          }

          .label {
            position: absolute;
            z-index:9;
            left: 0;
            bottom: 24px;
            width:100%;
            height:21px;
            line-height:21px;
            text-align: center;
            color:#fff;

            &:after {
              content: ' ';
              position: absolute;
              left: 0;
              bottom: 0;
              width:100%;
              height:21px;
              background: #000;
              opacity: .3;
              z-index:-1;
            }
          }

          .selected {
            position: absolute;
            right: -3px;
            top: -3px;
            width:100%;
            height:100%;
            border:3px solid #409eff;
            border-radius: 3px;
            text-align: right;
            .icon {
              background: #409eff;
              text-align: center;
              height:24px;
              width:24px;
              line-height:24px;
              display: inline-block;
              font-size:16px;
              color: #fff;
              border-radius: 0 0 0 3px;
              position: absolute;
              right: 0;
              top: 0;
            }
          }
        }

        &::after{
          content:" ";
          display:table;
          height:0;
          clear:both;
          visibility:hidden;
        }
      }

      .el-pagination {
        background: #f9f9f9;
        position: relative;
        padding: 5px;
        margin: 0 24px 0 20px;
        text-align: right;
        float: none;

        * {
          background: none;
        }
      }
    }

    .upload-block {
      .upload-img-preview {
        padding:20px;

        /* 上传图片预览改为使用背景图片按比例缩放方式 */
        .el-upload--picture-card, .el-upload-list--picture-card .el-upload-list__item, .el-upload-list--picture-card .el-upload-list__item .wp {
          width: 90px;
          height: 90px;
          line-height: 98px;
          background-size: cover;
          background-position: 50% 50%;
        }

        .el-upload-list--picture-card .el-upload-list__item-status-label i {
          margin-top: 12px;
          vertical-align: top;
        }
      }

      .upload-tip {
        padding: 0 20px;
        font-size: 13px;
        color:#999;
      }

      .upload-title {
        font-size:16px;
        color: #666;
        padding: 20px 0 0 20px;
      }

    }
  }

  .el-upload-list__item-actions {
    a {
      i {
        color: #fff;
      }
    }
  }
</style>
