
<template>
  <el-dialog title="我的图片" :visible.sync="visible" id="elx-imgbox" class="elx-imgbox" top="5vh">
    <el-tabs v-model="activeTab" tab-position="left">
      <el-tab-pane label="选择图片" name="pick" class="pick-block" v-if="options.enablePick">
        <div class="img-list-loading" v-if="isLoading">
          <div class="el-icon-loading"></div>
        </div>

        <div class="elx-main img-list">
          <div class="img-item" v-for="(img, imgKey) in imgRes.list" @click="handleSelectImage(img)">
            <div><img :src="img.thumb" alt="img.name"></div>
            <div class="title">{{img.name}}</div>
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
            :action="options.imgUploadUrl"
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
  export default {
    name: 'ElxImgbox',

    props: {

    },

    data() {
      return {
        isLoading: true,
        visible: true,
        activeTab: 'pick',
        selectedImgs: {},
        selectedImgCount: 0,
        uploadSuccessCount: 0,
        fixUploadInterval: null,
        imgRes: {
          list: [],
          total: 0,
        },

        options: {
          imgUploadUrl: '',
          imgListUrl: '',
          multiple: true,
          limit: 10, // 一批次最多可上传图片数
          callback: null, // 选择后回调函数
          itemUniqueKey: 'path',
          enablePick: true,
          enableUpload: true,
          maxSize: 2 // 最大尺寸（M）
        }
      };
    },

    methods: {

      // 多选时同步已选图片数量
      syncSelectedImgCount() {
        let selectedCount = 0;
        $.each(this.selectedImgs, function (key, val) {
          selectedCount ++;
        });
        this.selectedImgCount = selectedCount;
      },

      handleSelectImage(img){
        const itemUniqueKey = this.options.itemUniqueKey;
        if(typeof this.selectedImgs[img[itemUniqueKey]] == 'object') {
          // 取消选择图片
          img.selected = false;

          let selectedImgs = {};
          if(this.options.multiple) {
            $.each(this.selectedImgs, function (key, val) {
              if (key == img[itemUniqueKey]) {
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
          this.selectedImgs[img[itemUniqueKey]] = JSON.parse(JSON.stringify(img));
        }

        this.syncSelectedImgCount();
      },

      loadImg(page = 1){
        const imgListUrl = this.options.imgListUrl;

        if(!imgListUrl) {
          return;
        }

        let data = this.$data;
        this.isLoading = true;

        $(function () {
          $.getJSON(imgListUrl, {page: page, rows: 15, _r: Math.random()}, function (res) {
            let imgs = [];
            data.imgRes.total = parseInt(res.total);

            let listCount = 0;
            for(const i in res.list) {
              listCount ++;
              if(listCount > 15) {
                break;
              }

              let img = res.list[i];
              if(typeof img[data.options.itemUniqueKey] !== 'string') {
                let err = "图片数据必须包含'" + data.options.itemUniqueKey + "'属性！";
                alert(err);
                throw err;
              }
              img.selected = (typeof data.selectedImgs[img[data.options.itemUniqueKey]] === 'object');
              imgs.push(img);
            }

            data.imgRes.list = imgs;
            data.isLoading = false;
          });
        });
      },

      handlePageChange (page) {
        this.loadImg(page);
      },

      // 取消已选
      handleCancelAll () {
        this.selectedImgCount = 0;
        this.selectedImgs = {};
        for(const i in this.imgRes.list) {
          this.imgRes.list[i].selected = false;
        }
      },

      // 确认选择从列表选择的图片
      handleConfirmSelect () {
        if(typeof this.options.callback !== 'function') {
          ELEMENT.Message.error('请先设置回调函数');
          return false;
        }

        const cb = $.Callbacks();
        cb.add(this.options.callback);

        // 单选返回一个图片
        for(const i in this.selectedImgs) {
          const img = this.selectedImgs[i];
          cb.fire(img);
        }

        // 隐藏，取消已选
        this.visible = false;
        this.handleCancelAll();
      },

      // 确定上传图片
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

      // 上传图片预览改为使用背景图片按比例缩放方式
      fixPreviewThumb() {
        clearInterval(this.fixUploadInterval);
        let timestamp = new Date().getTime();
        let fixUploadInterval = this.fixUploadInterval = setInterval(function () {
          $.each($('.upload-img-preview li'), function (key, val) {
            let thisObj = $('.upload-img-preview li').eq(key);
            if(thisObj.find('img').length > 0) {
              thisObj.css('background-image', 'url(' + thisObj.find('img').attr('src') + ')');
            }
          });

          // 5s后停止
          if((new Date().getTime()) - timestamp >= 5000) {
            clearInterval(fixUploadInterval);
          }
        }, 500);
      },

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

      handleUploadError (err, file, fileList) {
        ELEMENT.Message.info('服务器打了个盹^_^');
        console.log(err)
      },

      handleUploadSuccess (response, file, fileList) {
        if(typeof this.options.callback !== 'function') {
          ELEMENT.Message.error('请先设置回调函数');
          return false;
        }

        const cb = $.Callbacks();
        cb.add(this.options.callback);
        cb.fire(response.uploadfile_response);

        this.uploadSuccessCount ++;

        if(fileList.length === this.uploadSuccessCount) {
          this.uploadSuccessCount = 0;
          this.$refs.upload.clearFiles();
          this.visible = false;
        }
      },

      // 超过文件个数提示
      onExceedTip () {
        ELEMENT.Message.warning('最多只能选择' + this.options.limit + '张图片');
      },

      reset () {

        if(!this.options.enablePick) {
          this.activeTab = 'upload';
        } else if(!this.options.enableUpload) {
          this.activeTab = 'pick';
        } else if(this.activeTab === 'upload' && this.options.enablePick) {
          // 默认进入选取图片
          this.activeTab = 'pick';
        }

        if(typeof this.$refs.upload !== 'undefined') {
          this.$refs.upload.clearFiles();
        }

        this.uploadSuccessCount = 0;
        this.handleCancelAll();
      }
    },

    mounted(){
      this.loadImg();
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

          img {
            width: $imgSize;
            height:$imgSize;
            display: block;
          }

          .title {
            font-size:12px;
            line-height:24px;
            height:24px;
            display: block;
            overflow: hidden;
            background: $bg;
            padding: 0 5px;
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
        background: $bg;
        position: relative;
        padding: 5px;
        margin: 0 24px 0 20px;

        * {
          background: none;
        }
      }
      .el-pagination {
        text-align: right;
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
