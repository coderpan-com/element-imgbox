# elx-imgbox

> Image browse and upload plugin base on Vue & element-ui  
> 基于Vue与element-ui的图片选取和上传组件

[Demo](http://imgbox.imcm.me/)

## require
 - Vue 2.5+
 - element-ui 2+
 - axios 0.19+

## props

```
  action: String, // 图片上传URL
  list-url: String, // 图片列表数据URL
  multiple: {type: Boolean, default: true},  // 是否支持选取多个图片
  enable-upload: {type: Boolean, default: true}, // 是否启用图片上传，不启用则只显示图片选取器
  limit: {type: Number, default: 10}, // 最多可选择图片数量
  max-size: {type: Number, default: 2},  // 最大尺寸（M）
  with-data: {type: Object, default: null},  // 上传时附带的额外参数
  with-credentials: {type: Boolean, default: true}, // 支持发送 cookie 凭证信息
  headers: {type: Object, default: null}, // 设置上传的请求头部	Object
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
```json
{
  "item": {
    "name":"图片名",
    "thumb":"图片缩略图链接",
    "url": "图片URL",
    "你需要的其他属性": "其他属性值"
  }
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
