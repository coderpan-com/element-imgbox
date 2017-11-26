# elx-imgbox

> Image browse and upload plugin base on Vue & element-ui  
> 基于Vue与element-ui的图片选取和上传插件

[Demo](http://imgbox.imcm.me/)

## require
 - Vue 2.5+
 - element-ui 2+
 - jQuery

## options

```
{
  uploadUrl: '',       // 图片上传URL
  listUrl: '',         // 图片列表数据URL
  multiple: true,      // 是否支持选取多个图片
  limit: 10,           // 一批次最多可上传图片数
  callback: null,      // 选择后回调函数
  enablePick: true,    // 是否启用图片选取
  enableUpload: true,  // 是否启用图片上传
  maxSize: 2           // 最大尺寸（M）
}
```

## 关于上传
- 支持选择单个文件和多个文件；
- 选择文件后，需要点击“确定上传”开始上传图片；
- 上传图片只要有一张成功则回调并关闭上传窗口
- 有错误发生ELEMENT.Message.error()提示

## 交互数据

### 上传返回数据格式
```json
{
  "uploadfile_response": {
    "name":"图片名",
    "thumb":"图片缩略图链接",
    "你需要的其他属性": "其他属性值"
  }
}
```

### 列表数据格式
```json
{
  "list":[
    {
      "name": "图片名",
      "thumb": "图片缩略图链接",
      "label": "图片长x宽",
      "你需要的其他属性": "其他属性值"
    }
  
  ],
  "total": "总图片数"
}
```
