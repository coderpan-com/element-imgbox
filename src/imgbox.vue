
<template>
  <el-dialog title="我的图片" :visible.sync="visible" id="elx-imgbox" class="elx-imgbox" top="5vh">
    <el-tabs v-model="activeTab" tab-position="left">
      <el-tab-pane label="选择图片" name="pick" class="pick-block">
        <div class="img-list-loading" v-if="isLoading">
          <div class="el-icon-loading"></div>
        </div>

        <div class="elx-main img-list">
          <div class="img-item" v-for="(img, imgKey) in imgRes.list" @click="handleSelectImage(img)">
            <div class="thumb-wp"><img :src="img.thumb" alt="img.name"></div>
            <div class="title">{{img.name}}</div>
            <div class="label" v-if="img.label">{{img.label}}</div>
            <span class="selected" v-if="img.selected"><span class="icon el-icon-check"></span></span>
          </div>
        </div>

        <el-pagination layout="total, prev, pager, next" :total="imgRes.total" @current-change="handlePageChange"></el-pagination>

        <div class="elx-foot">
          <el-badge :value="selectedImgCount" class="item">
            <el-button type="primary" size="medium" :disabled="selectedImgCount == 0" @click="handleConfirmSelect">确定选择</el-button>
          </el-badge>
          <el-button type="primary" size="medium" @click="activeTab='upload'" plain v-if="options.enableUpload">上传图片</el-button>
          <el-button type="text" @click="handleCancelAll" v-if="options.multiple">取消已选</el-button>
        </div>
      </el-tab-pane>

      <el-tab-pane label="上传图片" name="upload" class="upload-block" v-if="options.enableUpload">
        <div class="elx-main">
          <div class="upload-title">请选择本地图片上传：</div>
          <el-upload
            ref="upload"
            class="upload-img-preview"
            list-type="picture-card"
            accept="image/*"
            :action="options.uploadUrl"
            :auto-upload="false"
            :multiple="options.multiple"
            :limit="options.limit"
            :before-upload="beforeUpload"
            :on-change="handleOnChange"
            :on-progress="handleOnProgress"
            :on-success="handleUploadSuccess"
            :on-error="handleUploadError"
            :on-exceed="onExceedTip">
            <i class="el-icon-plus"></i>
          </el-upload>

          <div class="upload-tip">仅支持jpg、gif、png三种格式, 大小不超过2 MB</div>

          <div class="elx-foot">
            <el-button type="primary" size="medium" @click="handleConfirmUpload">确定上传</el-button>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </el-dialog>
</template>


<script type="text/babel">
  /**
   * 仅作为插件方式提供外部js调用，不提供组件标签
   */
  export default {
    name: 'ElxImgbox',

    props: {

    },

    data() {
      return {
        options: {
          uploadUrl: '',      // 图片上传URL
          listUrl: '',        // 图片列表数据URL
          multiple: true,     // 是否支持选取多个图片
          limit: 10,          // 一批次最多可上传图片数
          onSelect: null,     // 选择后回调函数
          enableUpload: true, // 是否启用图片上传
          maxSize: 2          // 最大尺寸（M）
        },

        isLoading: true,
        visible: true,
        activeTab: 'pick',
        selectedImgs: {},
        selectedImgCount: 0,
        uploadSuccessCount: 0,
        fixThumbInterval: null,
        imgRes: {
          list: [],
          total: 0,
        }
      };
    },

    methods: {

      /**
       * 多选时同步已选图片数量
       */
      syncSelectedImgCount() {
        let selectedCount = 0;
        $.each(this.selectedImgs, function (key, val) {
          selectedCount ++;
        });
        this.selectedImgCount = selectedCount;
      },

      /**
       * 点击图片时选中或取消选中图片
       * @param img object
       */
      handleSelectImage(img){
        if(typeof this.selectedImgs[img.thumb] === 'object') {
          // 取消选择图片
          img.selected = false;

          let selectedImgs = {};
          if(this.options.multiple) {
            $.each(this.selectedImgs, function (key, val) {
              if (key === img.thumb) {
                return;
              }
              selectedImgs[key] = val;
            });
          }

          this.selectedImgs = selectedImgs;
        } else {
          // 选择图片
          if(this.options.limit > 0 && this.selectedImgCount >= this.options.limit) {
            this.$message({
              message: '最多只能选择' + this.options.limit + '张图片',
              type: 'warning'
            });
            return;
          }

          if(!this.options.multiple) {
            // 单选时，取消已选
            this.handleCancelAll();
          }

          img.selected = true;
          this.selectedImgs[img.thumb] = JSON.parse(JSON.stringify(img));
        }

        this.syncSelectedImgCount();
      },

      /**
       * 加载图片列表数据
       * @param page
       */
      loadImgList(page = 1){
        const listUrl = this.options.listUrl;

        if(!listUrl) {
          return;
        }

        let data = this.$data;
        this.isLoading = true;

        $(function () {
          /**
           * res = {
           *     list: [{name: img_name, thumb: img_thumb_url ...}, ...],
           *     total: number
           * }
           */
          $.getJSON(listUrl, {page: page, rows: 15, _r: Math.random()}, function (res) {
            let imgs = [];
            data.imgRes.total = parseInt(res.total);

            let listCount = 0;
            for(const i in res.list) {
              listCount ++;

              // 每页只显示15条
              if(listCount > 15) {
                break;
              }

              let img = res.list[i];

              // 图片缩略图
              if(typeof img.thumb !== 'string') {
                let err = "图片数据必须包含'thumb'属性！";
                alert(err);
                throw err;
              }

              // 图片名
              if(typeof img.name !== 'string') {
                img.name = img.thumb.substr(img.thumb.lastIndexOf('/') + 1);
              }

              // 图片其他信息
              if(typeof img.label !== 'string') {
                img.label = '';
              }

              // 图片选中状态
              img.selected = (typeof data.selectedImgs[img.thumb] === 'object');

              imgs.push(img);
            }

            data.imgRes.list = imgs;
            data.isLoading = false;
          });
        });
      },

      /**
       * 分页页面变化时刷新数据
       * @param page
       */
      handlePageChange (page) {
        this.loadImgList(page);
      },

      /**
       *  取消已选
       */
      handleCancelAll () {
        this.selectedImgCount = 0;
        this.selectedImgs = {};
        for(const i in this.imgRes.list) {
          this.imgRes.list[i].selected = false;
        }
      },

      /**
       * 确认选择从列表选择的图片
       * @returns {boolean}
       */
      handleConfirmSelect () {
        if(typeof this.options.onSelect !== 'function') {
          ELEMENT.Message.error('请先设置回调函数');
          return false;
        }

        const cb = $.Callbacks();
        cb.add(this.options.onSelect);

        // 单选返回一个图片
        for(const i in this.selectedImgs) {
          const img = this.selectedImgs[i];
          cb.fire(img);
        }

        // 隐藏，取消已选
        this.visible = false;
        this.reset();
      },

      /**
       * 提交上传图片
       */
      handleConfirmUpload () {
        this.$refs.upload.submit();
      },

      handleOnProgress(event, file, fileList){

      },

      handleOnChange(file, fileList) {
        // 单张图片上传保留最后一张图片
        if(!this.options.multiple && fileList.length > 1) {
          fileList = fileList.shift();
        }

        this.fixPreviewThumb();
      },

      /**
       * 上传图片预览改为使用背景图片按比例缩放方式
       */
      fixPreviewThumb() {
        clearInterval(this.fixThumbInterval);
        let timestamp = new Date().getTime();
        let fixThumbInterval = this.fixThumbInterval = setInterval(function () {
          $.each($('.upload-img-preview li'), function (key, val) {
            let thisObj = $('.upload-img-preview li').eq(key);
            if(thisObj.find('img').length > 0) {
              thisObj.css('background-image', 'url(' + thisObj.find('img').attr('src') + ')');
            }
          });

          // 5s后停止
          if((new Date().getTime()) - timestamp >= 5000) {
            clearInterval(fixThumbInterval);
          }
        }, 500);
      },

      /**
       * 上传图片前检查合法性
       * @param file
       * @returns {boolean}
       */
      beforeUpload (file) {
        const isJPG = file.type === 'image/jpeg';
        const isPNG = file.type === 'image/png';
        const isGif = file.type === 'image/gif';
        const isSize = file.size / (1024*1024) < this.options.maxSize;

        if (!isJPG && !isPNG &&!isGif) {
          ELEMENT.Message.error('仅支持 JPG/PNG/GIF 3种格式');
          return false;
        }

        if (!isSize) {
          ELEMENT.Message.error('上传图片大小不能超过 ' + this.options.maxSize + 'M');
          return false;
        }

        return true;
      },

      /**
       * 上传错误处理
       * @param err
       * @param file
       * @param fileList
       */
      handleUploadError (err, file, fileList) {
        ELEMENT.Message.info('服务器打了个盹^_^');
        console.log(err)
      },

      /**
       * 上传成功处理
       * @param response
       * @param file
       * @param fileList
       * @returns {boolean}
       */
      handleUploadSuccess (response, file, fileList) {
        if(typeof this.options.onSelect !== 'function') {
          ELEMENT.Message.error('请先设置回调函数');
          return false;
        }

        const cb = $.Callbacks();
        cb.add(this.options.onSelect);
        cb.fire(response.uploadfile_response);

        this.uploadSuccessCount ++;

        if(fileList.length === this.uploadSuccessCount) {
          this.visible = false;
          this.reset();
        }
      },

      /**
       * 选择上传文件超过限制文件个数提示
       */
      onExceedTip () {
        ELEMENT.Message.warning('最多只能选择' + this.options.limit + '张图片');
      },

      /**
       * 重置参数
       */
      reset () {
        if(typeof this.$refs.upload !== 'undefined') {
          this.$refs.upload.clearFiles();
        }

        this.uploadSuccessCount = 0;
        this.handleCancelAll();
      }
    },

    mounted(){
      this.loadImgList();
    },

    computed: {

    }
  };
</script>
<style lang="scss">
  .elx-imgbox {
    $bg: #f6f6f6;

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

      .img-list-loading {
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

      .img-list {
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
        .el-upload--picture-card, .el-upload-list--picture-card .el-upload-list__item {
          width: 90px;
          height: 90px;
          line-height: 98px;
          background-size: cover;
          background-position: 50% 50%;
          .el-upload-list__item-thumbnail {
            display: none;
          }
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

    .el-upload-list--picture-card .el-upload-list__item-status-label i {
      margin-top: 12px;
      vertical-align: top;
    }
  }
</style>
