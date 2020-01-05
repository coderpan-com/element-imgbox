<template>
  <div class="elx-imgbox">
    <div class="elx-images">
      <ul class="el-upload-list el-upload-list--picture-card">
        <li :tabindex="imgIndex" class="el-upload-list__item" v-for="(img, imgIndex) in theImages" :key="imgIndex">
          <img :src="img.thumb" alt="" class="el-upload-list__item-thumbnail">
          <span class="el-upload-list__item-actions">
            <a class="el-upload-list__item-preview" :href="img.url" target="_blank"><i class="el-icon-zoom-in"></i></a>
            <span class="el-upload-list__item-delete" @click="onRemove(imgIndex, img)"><i class="el-icon-delete"></i></span>
          </span>
        </li>
      </ul>
      <div tabindex="0" class="el-upload el-upload--picture-card" v-if="(multiple && theImages.length < limit) || (!multiple && theImages.length == 0)" @click="dialogVisible=true"><i class="el-icon-plus"></i></div>
    </div>

    <el-dialog title="图片管理器" :visible.sync="dialogVisible" class="elx-imgbox-dialog" top="5vh">
      <el-tabs v-model="theDialogActiveTab" tab-position="left">
        <el-tab-pane label="选择图片" name="pick" class="pick-block">
          <div class="elx-img-list-loading" v-if="isLoading">
            <div class="el-icon-loading"></div>
          </div>

          <div class="elx-main elx-img-list">
            <div class="img-item" v-for="(img, itemIndex) in imgRes.items" @click="onClickListImage(img)" :key="itemIndex">
              <div class="thumb-wp"><img :src="img.thumb" alt="img.name"></div>
              <div class="title">{{img.name}}</div>
              <div class="label" v-if="img.label">{{img.label}}</div>
              <span class="selected" v-if="img.selected"><span class="icon el-icon-check"></span></span>
            </div>
          </div>

          <el-pagination layout="total, prev, pager, next" :total="imgRes.total" @current-change="onPageNumChange"></el-pagination>

          <div class="elx-foot">
            <el-badge :value="theImages.length" class="item">
              <el-button type="primary" size="medium" :disabled="theImages.length == 0" @click="dialogVisible = false">确定</el-button>
            </el-badge>
            <el-button type="primary" size="medium" @click="theDialogActiveTab='upload'" plain v-if="enableUpload">上传图片</el-button>
          </div>
        </el-tab-pane>

        <el-tab-pane label="上传图片" name="upload" class="upload-block" v-if="enableUpload">
          <div class="elx-main">
            <div class="upload-title">请选择本地图片上传：</div>
            <el-upload
              ref="upload"
              class="upload-img-preview"
              list-type="picture-card"
              accept="image/*"
              :headers="headers"
              :with-credentials="withCredentials"
              :data="withData"
              :action="action"
              :auto-upload="false"
              :multiple="multiple"
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
              <el-button type="primary" size="medium" @click="onUploadConfirm">确定上传</el-button>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>
  </div>
</template>

<script type="text/babel">
// 如果是使用vue-cli编译，取消下面两行注释
// import ELEMENT from 'element-ui'
// import axios from 'axios'

export default {
  name: 'ElxImgbox',
  model: {
    prop: 'images',
    event: 'change'
  },

  props: {
    action: String, // 图片上传URL
    listUrl: String, // 图片列表数据URL
    multiple: { type: Boolean, default: true }, // 是否支持选取多个图片
    enableUpload: { type: Boolean, default: true }, // 是否启用图片上传
    limit: { type: Number, default: 10 }, // 最多可选择图片数量
    maxSize: { type: Number, default: 2 }, // 最大尺寸（M）
    withData: { type: Object, default: () => {} }, // 上传时附带的额外参数
    withCredentials: { type: Boolean, default: true }, // 支持发送 cookie 凭证信息
    headers: { type: Object, default: () => {} }, // 设置上传的请求头部
    images: { type: Array, default: () => [] }, // 已选图片
    dialogActiveTab: { type: String, default: 'pick' }
  },

  data () {
    return {
      isLoading: true,
      dialogVisible: false,
      theDialogActiveTab: this.dialogActiveTab,
      theImages: this.images,
      uploadSuccessCount: 0,

      imgRes: {
        items: [],
        total: 0
      }
    }
  },

  watch: {
    theImages: function () {
      this.$emit('change', this.theImages)
    }
  },

  methods: {
    /**
     * 点击图片时选中或取消选中图片
     * @param img object
     */
    onClickListImage (img) {
      var imgIndex = this.selectedImageIndex(img)

      if (imgIndex >= 0) {
        // 取消图片已选状态
        img.selected = false
        this.theImages.splice(imgIndex, 1)
        return
      }

      if (!this.multiple) {
        // 单选时，先取消已选
        this.theImages = []
        this.clearListSelected()
      }

      // 选择图片
      if (this.multiple && this.theImages.length >= this.limit) {
        ELEMENT.Message.warning('最多只能选择' + this.limit + '张图片')
        return
      }

      img.selected = true
      this.theImages.push(JSON.parse(JSON.stringify(img)))
    },

    clearListSelected (img) {
      for (let i = 0; i < this.imgRes.items.length; i++) {
        if (img) {
          if (img.url === this.imgRes.items[i].url) {
            this.imgRes.items[i].selected = false
            break
          }
        } else if (this.imgRes.items[i].selected) {
          this.imgRes.items[i].selected = false
        }
      }
    },

    /**
     * 加载图片列表数据
     * @param page
     */
    loadListImage (page = 1) {
      if (!this.listUrl) {
        throw new Error('listUrl is required')
      }

      this.isLoading = true

      /**
       * result = {
       *     "items": [{"url": "img_url", "name": "img_name", "thumb": "img_thumb_url" ...}, ...],
       *     "total": number
       * }
       */
      axios.get(this.listUrl, { params: { page: page, rows: 15, _r: Math.random() } }).then(response => {
        const result = response.data
        this.imgRes.total = parseInt(result.total)

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

        this.imgRes.items = imageList
        this.isLoading = false
      })
    },

    /**
     * 图片已选则返回下标，未选则返回-1
     */
    selectedImageIndex (img) {
      for (let i = 0; i < this.theImages.length; i++) {
        var selectedImg = this.theImages[i]

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
      this.loadListImage(page)
    },

    /**
     * 提交上传图片
     */
    onUploadConfirm () {
      this.$refs.upload.submit()
    },

    onUploadProgress (event, file, fileList) {

    },

    onUploadChange (file, fileList) {
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
      const isSize = file.size / (1024 * 1024) < this.maxSize

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
      if (!this.multiple) {
        return 1
      }

      return this.limit - this.theImages.length
    },

    uploadTypeTip () {
      return '仅支持 jpg/png/gif 图片'
    },

    uploadSizeTip () {
      return '大小不能超过 ' + this.maxSize + 'M'
    },

    uploadTips () {
      let tips = [this.uploadTypeTip(), this.uploadSizeTip()]

      if (!this.multiple) {
        return tips.join('，')
      }

      if (this.theImages.length > 0) {
        tips.push('已有' + this.theImages.length + '张图片')
      }

      const uploadFileNum = this.$refs.upload ? this.$refs.upload.uploadFiles.length : 0
      if (uploadFileNum > 0) {
        tips.push('即将上传' + uploadFileNum + '张图片')
      }

      tips.push('还可以选择' + (this.limit - this.theImages.length - uploadFileNum) + '张图片上传')

      return tips.join('，')
    },

    /**
     * 上传错误处理
     * @param err
     * @param file
     * @param fileList
     */
    onUploadError (err, file, fileList) {
      ELEMENT.Message.info('服务器打了个盹^_^')
      // console.log(err)
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
      if (!this.multiple) {
        this.theImages = []
      }

      this.theImages.push(response.item)
      this.uploadSuccessCount++

      if (!this.multiple || fileList.length === this.uploadSuccessCount) {
        this.dialogVisible = false
        this.uploadSuccessCount = 0
        this.$refs.upload.clearFiles()
      }
    },

    /**
     * 选择上传文件超过限制文件个数提示
     */
    onUploadExceedTip () {
      ELEMENT.Message.warning('当前最多只能选择' + this.uploadNumberLimit() + '张图片上传')
    },

    onRemove (imgIndex, img) {
      this.theImages.splice(imgIndex, 1)
      this.clearListSelected(img)
    }
  },

  mounted () {
    this.loadListImage()
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
