# Seedance 2.0 视频生成台

这是一个仅运行在本机的即梦同源视频模型输入口，使用火山方舟单个 API Key
进行 Bearer 鉴权。

## 启动

双击 `start.cmd`，然后打开：

`http://127.0.0.1:4178`

也可以在本目录执行 `node server.js`。

## 使用

1. 只填写一个火山方舟 API Key，不需要 AK/SK。页面默认会在本机浏览器长期记住这个 Key。
2. 选择 EP01 第一段或第二段预设；每段会自动加载 5 张关键分镜。
3. 默认模型为 `doubao-seedance-2-0-260128`，默认生成 15 秒、720p、9:16。
4. 提交后页面每 6 秒自动查询任务。
5. 完成后可以打开视频，或保存到项目的 `outputs/jimeng-videos/`。

## 安全约束

- 服务只监听 `127.0.0.1`。
- API Key 不写入项目文件、不写入服务日志。按当前项目工作流，页面会把 Key 存入本机浏览器 localStorage，方便长期使用。
- 请求域名固定为 `ark.cn-beijing.volces.com`，不能通过页面修改。
- 如果需要替换 Key，直接在页面输入新 Key；如果不想继续保存，取消“长期记住这个 Key”。
- 工具不会绕过版权和内容审核，接口错误会原样显示。

## 模型与素材

- 默认使用 `doubao-seedance-2-0-260128`。
- 支持 4–15 秒、480p/720p/1080p 和多图参考。
- 项目预设按参考顺序使用“图片1、图片2……”组织提示词。
- 自定义模式可上传 1–9 张 PNG、JPEG 或 WebP 图片。

官方视频生成 API：
<https://api.volcengine.com/api-docs/view?action=CreateContentsGenerationsTasks&serviceCode=ark&version=2024-01-01>
