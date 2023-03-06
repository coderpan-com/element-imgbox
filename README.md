# element-imgbox

> Image browse and upload plugin base on Vue & element-ui  
> 基于 Vue 与 element-ui 的图片选取和上传组件
> 支持组件和插件两种模式

# [Example](https://yibafun.github.io/element-imgbox/example/)
- [组件方式 上传单图](https://yibafun.github.io/element-imgbox/example/1.component-single.html)
- [组件方式 上传多图](https://yibafun.github.io/element-imgbox/example/2.component-multiple.html)
- [插件方式 上传单图](https://yibafun.github.io/element-imgbox/example/3.plugin-single.html)
- [插件方式 上传多图](https://yibafun.github.io/element-imgbox/example/4.plugin-multiple.html)

## 本地预览
```shell
git clone https://github.com/erzh/element-imgbox.git
cd element-imgbox
cnpm i
npm run dev
```

## require
 - Vue 2.5+
 - element-ui 2+
 - axios 0.21+

## props

```
{
  action: String, // 图片上传URL
  list-url: String, // 图片列表数据URL
  multiple: {type: Boolean, default: true},  // 是否支持选取多个图片
  enable-upload: {type: Boolean, default: true}, // 是否启用图片上传，不启用则只显示图片选取器
  limit: {type: Number, default: 10}, // 最多可选择图片数量
  max-size: {type: Number, default: 2},  // 最大尺寸（M）
  with-data: {type: Object, default: null},  // 上传时附带的额外参数
  with-credentials: {type: Boolean, default: true}, // 支持发送 cookie 凭证信息
  headers: {type: Object, default: null}, // 设置上传的请求头部	Object
}
```

## 数据绑定
<elx-imgbox v-model="已选图片列表数组"></elx-imgbox>

## 关于上传
- 支持选择单个文件和多个文件；
- 选择文件后，需要点击“确定上传”开始上传图片；
- 上传图片只要有一张成功则回调并关闭上传窗口
- 有错误发生ELEMENT.Message.error()提示

## 交互数据

### 上传返回数据格式
上传成功：
```json
{
  "success": true,
  "item": {
    "name":"图片名",
    "thumb":"图片缩略图链接",
    "url": "图片URL",
    "你需要的其他属性": "其他属性值"
  }
}
```
上传失败：
```json
{
  "message": "错误信息"
}
```

### 列表数据格式
```json
{
  "items":[
    {
      "name": "图片名",
      "thumb": "图片缩略图URL",
      "url": "图片URL",
      "label": "图片长x宽",
      "你需要的其他属性": "其他属性值"
    }
  
  ],
  "total": "总图片数"
}
```

## 本地化
设置 js 变量 `ELX_IMGBOX_LANG`，覆盖如下元素，即可实现本地化。
```js
const ELX_IMGBOX_LANG = {
  confirm: '确定',
  conform_upload: '确定上传',
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
  pick_local_image_tip: '请选择本地图片上传'
}
```
