# 短视频拆解复刻

这是一个面向 AI 短视频创作的工作区，覆盖“参考视频拆解 → 剧本改写 → 角色与资产固化 → 分镜设计 → 视频生成提示词 → 成片与复盘”的完整流程。仓库保存原创 IP 规则、剧本、提示词、分析文档、工具代码、可复用的 Codex/Agent Skills，以及少量代表性图片；大体积视频、音频和批量生成图片只保留在本地工作区。

> 本仓库含原创角色和生成媒体资产，默认按私有项目管理。使用第三方模型或平台时，请遵守其版权、内容审核与服务条款。

## 可以做什么

- 拆解参考短视频的镜头、节奏、动作、声音与关键帧，并形成结构化分析。
- 将小说、文章或故事大纲改写为适合短视频制作的格式化剧本。
- 孵化原创治愈 IP，制作角色设定卡、三视图、表情动作参考和服装设定。
- 为 DORO（粉粉）、咕咕嘎嘎（小企）、Walulu 等角色维持跨镜头一致性。
- 生成或整理分镜图、首尾帧、多帧导入清单和连续性方案。
- 编写 Seedance 2.x、即梦/火山方舟、可灵 3、Higgsfield 等平台可用的视频提示词。
- 通过本地 Seedance 2.0 视频生成台提交任务、查询状态并保存视频。
- 沉淀提示词、关键帧、成片、复刻记录与版本对比，便于复用和迭代。

## 项目结构

| 目录 | 内容 |
| --- | --- |
| `.agents/skills/` | 项目内可复用的 AI 创作技能 |
| `assets/characters/` | 原创角色权威设定；仓库仅保留核心三视图范例 |
| `references/` | 视频拆解报告、提示词风格参考和一张拆解联系表范例 |
| `stories/` | 剧本大纲、单集脚本与生成提示词 |
| `storyboards/` | 分镜方案、平台导入清单和一张分镜联系表范例 |
| `output/`、`outputs/` | 提示词、分析记录和阶段性结果；批量媒体文件不入库 |
| `walulu异界游/` | Walulu 独立子项目的规则、角色文档、拆解与提示词 |
| `apps/jimeng-api-console/` | 本地 Seedance 2.0/火山方舟视频生成控制台 |
| `warm-original-ip-incubator/` | 治愈系原创 IP 孵化技能 |

## 内置技能

| Skill | 用途 |
| --- | --- |
| `ip角色进阶角色设定` | 从角色表或权威资产深化角色外貌、服装、声音和设定图规格 |
| `novel-to-screenplay` | 将小说或叙事文本改写为格式化短视频剧本 |
| `prompt-assistant` | 将单幕、多镜头或情绪化描述提纯为更易生成的视频提示词 |
| `storyboard-production` | 生成、补齐或重做分镜，并维持角色与相邻镜头连续性 |
| `video-prompt-writing` | 编写 Seedance 2.x 与 Higgsfield Seedance 的电影级视频提示词 |
| `导演剧本skill` | 按“文—资—视—剪”流程完成剧本、资产、分镜与声音设计 |
| `warm-original-ip-incubator` | 从模糊偏好孵化治愈系原创 IP，并规划系列短视频内容 |

## 保留的图片范例

- DORO（粉粉）正面、侧面、背面三视图。
- 咕咕嘎嘎（小企）正面、侧面、背面三视图。
- Walulu 与黑猫侠客各一张三视图。
- 一张参考视频逐秒联系表和一张 EP01 分镜联系表。

其余图片、视频、音频、压缩包和演示文稿由 `.gitignore` 排除，不会上传到 GitHub。完整媒体资产仍留在本机原目录中。

## 工具与平台入口

- [OpenAI Codex CLI](https://developers.openai.com/codex/cli/)：在项目目录中调用 Agent Skills、整理资产和执行工作流。
- [Git](https://git-scm.com/downloads) / [GitHub CLI](https://cli.github.com/)：版本管理、仓库创建与协作。
- [Git LFS](https://git-lfs.com/)：若未来另建媒体仓库，可用它管理视频、音频和批量图片。
- [Node.js](https://nodejs.org/en/download)：运行 `apps/jimeng-api-console/server.js`。
- [FFmpeg](https://ffmpeg.org/download.html)：视频截取、抽帧、转码、音频提取和媒体检查。
- [faster-whisper](https://github.com/SYSTRAN/faster-whisper)：本地语音识别与字幕/对白分析。
- [火山引擎 CLI（ve）](https://www.volcengine.com/docs/83927/1184025)：火山引擎命令行入口；凭据应配置在本机 profile，不写入仓库。
- [火山方舟视频生成 API](https://api.volcengine.com/api-docs/view?action=CreateContentsGenerationsTasks&serviceCode=ark&version=2024-01-01)：即梦/Seedance 视频任务接口。
- [可灵 AI](https://klingai.com/) / [Higgsfield](https://higgsfield.ai/)：项目提示词所适配的外部视频生成平台；账号与登录态仅保存在平台或本机。

## 本地使用

1. 使用 Codex 打开项目根目录；Agent 会自动读取根目录及子项目的 `AGENTS.md` 规则。
2. 如需使用本地视频生成台，安装 Node.js 后运行：

   ```powershell
   cd apps/jimeng-api-console
   node server.js
   ```

3. 浏览器打开 `http://127.0.0.1:4178`，在页面中临时输入火山方舟 API Key。
4. 如需复现完整项目，请从本机或独立素材存储恢复被忽略的媒体文件。

## 安全说明

- 不在代码、Prompt、JSON、日志或提交记录中保存 API Key、AK/SK、Cookie、Token 或 CLI 登录凭据。
- `.env*`、私钥文件、本地工具目录、模型缓存、临时文件和浏览器/API 调试快照已被 `.gitignore` 排除。
- 除上述 10 张范例图外，视频、音频、图片、压缩包、PDF 和 PPTX 默认不进入版本库。
- 即梦控制台仅监听 `127.0.0.1`；API Key 由浏览器输入并在运行时使用，不写入服务端文件或日志。
- 如需共享配置，请只提交脱敏的 `.env.example`，并使用环境变量、平台密钥管理或本机 CLI profile 注入真实凭据。
- 提交前建议执行 `git status`，并再次扫描疑似密钥和超大文件。

## 角色一致性

涉及 DORO、咕咕嘎嘎或 Walulu 子项目角色的图像、分镜和视频生成，必须先阅读对应 `character-profile.md`、三视图与项目 `AGENTS.md`。权威角色资产不得被临时生成图静默覆盖。
