const http = require('node:http');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const { pipeline } = require('node:stream/promises');
const { Readable } = require('node:stream');

const HOST = '127.0.0.1';
const PORT = Number(process.env.JIMENG_CONSOLE_PORT || 4178);
const ARK_ORIGIN = 'https://ark.cn-beijing.volces.com';
const ARK_TASKS_PATH = '/api/v3/contents/generations/tasks';
const APP_DIR = __dirname;
const PUBLIC_DIR = path.join(APP_DIR, 'public');
const PROJECT_DIR = path.resolve(APP_DIR, '..', '..');
const STORYBOARD_DIR = path.join(PROJECT_DIR, 'storyboards', '咕嘎忍者', 'EP01-忍道之争');
const OUTPUT_DIR = path.join(PROJECT_DIR, 'outputs', 'jimeng-videos');
const MAX_BODY_BYTES = 40 * 1024 * 1024;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_IMAGES = 9;
const completedVideos = new Map();

const PRESETS = {
  segment1: {
    id: 'segment1',
    name: 'EP01 第一段：丸子争夺与水环成形',
    note: '按顺序使用 5 张关键分镜：争丸子、人物对峙、蓝球反弹、砂土分身、水环成形。',
    frames: ['E1S01.png', 'E1S02.png', 'E1S04.png', 'E1S06.png', 'E1S08.png'],
    prompt:
      '严格参考图片1至图片5中的两位原创企鹅角色、服装、图书馆木桌和暖光，保持微缩哑光软陶质感、圆胖Q版比例与角色一致性。0-2秒，图片1中的两只无手指短翅争抢碟中最后一颗橘色丸子。2-4秒，切换到图片2中的近景对峙，DORO松弛半眯眼，咕咕嘎嘎认真护住丸子。4-7秒，咕咕嘎嘎推出亮蓝弹力球，DORO侧移避开，蓝球反弹将咕咕嘎嘎撞进沙盘。7-11秒，按图片4表现咕咕嘎嘎起身并召出三只无五官砂土企鹅。11-15秒，按图片5表现DORO做简化结印，水杯清水升起形成透明水环，末帧让水环完整停住。全程动作可爱、流畅、无伤害；不得改变两位角色的体型、五官、发型和核心配件，不得长出人类手指，不生成字幕、文字、水印或新角色。'
  },
  segment3Collision: {
    id: 'segment3Collision',
    name: 'EP01 第三段：篮球触尖爆开与隔烟对视',
    note: '图片1为碰撞前首帧，图片2为爆炸冲开后隔烟对视尾帧；8秒、16:9、1080p。',
    frames: [
      '../../../outputs/storyboards/ninja-arc/segment-03/start-frame.png',
      '../../../outputs/storyboards/ninja-arc/segment-03/end-frame-v2-eye-contact.png'
    ],
    prompt:
      '严格使用图片1作为首帧、图片2作为尾帧，保持暖色图书馆木桌、侧面构图、微缩哑光软陶质感；咕咕嘎嘎始终在左，DORO始终在右，角色造型、服装、比例和配饰不得变化。0-0.8秒，咕咕嘎嘎把蓝色篮球快速向右推出，DORO向前半步用实体银色飞镖短促直刺，篮球表面准确碰到飞镖最尖端，动作立即发生。0.8-1.6秒，触点立即闪出蓝白亮光，篮球本体一次性从中心爆开，球形轮廓立即瓦解；不要压扁、反复鼓胀、弹跳或延迟爆炸；无火焰、黑烟和硬碎片。1.6-4.2秒，快速拉回双人全景；篮球爆开的同一瞬间，白色棉花状烟雾向左右、向上和贴近桌面方向喷散，同时冲击波把咕咕嘎嘎向左推开、把DORO向右推开。烟雾外扩和两人退开必须同步，不能先出完整烟团再推人；两人各退两步并向外后倾，DORO始终握住同一枚飞镖。4.2-6.1秒，烟雾向四周散开并变薄，只剩低矮残烟、小烟团和少量蓝色残光；两人在左右站稳并放下挡风动作，不遮脸。6.1-8秒，咕咕嘎嘎睁开灰蓝眼睛转向右侧DORO，DORO睁开紫色眼睛转向左侧咕咕嘎嘎；两人隔着残烟准确对视，不看镜头、不闭眼，最后0.6秒保持互瞪并准确贴合图片2。禁止左右互换、换脸换装、角色变形、飞镖消失、人物原地不退、烟雾凭空整团出现、篮球未触尖就爆、火焰、黑烟、受伤、桌面破损、字幕、文字、水印或新角色。'
  },
  segment4KnifeBarrage: {
    id: 'segment4KnifeBarrage',
    name: 'EP01 第四段：飞镖连发与咕咕嘎嘎摔倒',
    note: '图1为上一段尾帧/本段首帧，图2为DORO投掷动作参考，图3为本段尾帧；6秒，16:9，720p。',
    frames: [
      '../../../outputs/storyboards/ninja-arc/segment-04/start-frame-v4-from-segment-03-end.png',
      '../../../outputs/storyboards/ninja-arc/segment-04/start-frame-v3-doro-knife-ready.png',
      '../../../outputs/storyboards/ninja-arc/segment-04/end-frame-v3-gugugaga-dodge-fall.png'
    ],
    prompt:
      '6秒16:9横屏，图1为正式首帧、图2为动作参考、图3为正式尾帧。温暖图书馆木桌场景，Q版原创软陶/毛绒手办质感。咕咕嘎嘎始终左侧：黑色企鹅头套、黄色鸟喙、金属发夹、巨大金属拉链领、白色火焰边忍者外套；DORO始终右侧：圆润矮胖白色企鹅身体、粉色头发、顶部螺旋发髻、紫色蝴蝶结、黑红云纹忍者斗篷。0-0.8秒承接上一段尾帧，白烟变薄，双方隔烟对视。0.8-1.8秒DORO甩出第一枚实体银色三角飞镖，飞镖右向左高速旋转，咕咕嘎嘎侧身闪避，飞镖插入身后木桌。1.8-3秒DORO甩出第二枚低轨迹飞镖，咕咕嘎嘎低头弯膝躲开，拉链领和衣摆晃动。3-4.5秒DORO第三次贴桌面甩飞镖，咕咕嘎嘎连退两步后脚掌打滑，双翼张开，嘴巴小O，搞笑后倒。4.5-6秒咕咕嘎嘎无伤摔倒在左侧，三枚银色飞镖插在周围木桌，DORO在右侧保持投掷收势，最后贴合图3尾帧。禁止飞镖击中角色、血腥、桌面破损、火焰黑烟、蓝球爆炸、人手、水印字幕、左右互换、换脸换装。'
  },
  segment5Rebound: {
    id: 'segment5Rebound',
    name: 'EP01 segment 05 rebound counterpose',
    note: 'Image 1 is segment 04 video end frame, image 2 is segment 05 clear end frame, image 3 is character turnaround reference.',
    frames: [
      '../../../outputs/storyboards/ninja-arc/segment-05/start-frame-v1-from-segment-04-video-end.png',
      '../../../outputs/storyboards/ninja-arc/segment-05/end-frame-v2-clear-rebound-counterpose.png',
      '../../../outputs/storyboards/ninja-arc/segment-05/character-turnaround-contact-sheet-doro-gugugaga.png'
    ],
    prompt: 'segment 05 rebound counterpose placeholder'
  },
  segment2: {
    id: 'segment2',
    name: 'EP01 第二段：泥水高潮与真人手制裁',
    note: '按顺序使用 E1S09 至 E1S13 五张分镜，承接上一段水环末帧。',
    frames: ['E1S09.png', 'E1S10.png', 'E1S11.png', 'E1S12.png', 'E1S13.png'],
    prompt:
      '严格参考图片1至图片5，作为上一段直接续集，保持相同的暖光图书馆、木桌位置、浅景深、微缩哑光软陶风格与两位原创企鹅角色身份。0-3秒，按图片1表现透明水环扫过砂盘，砂土企鹅依次塌成泥团，少量水和细沙形成小泥水旋涡。3-6秒，按图片2让DORO在左、咕咕嘎嘎在右同时前倾，露出自信表情。6-9秒，镜头按图片3突然拉远，仅有两只干净成年真人手从上方进入，分别轻提两位角色护额后方布带，使他们离开桌面轻轻摆动。9-12秒，按图片4表现DORO用光滑无手指的小翅膀擦掉咕咕嘎嘎巨型拉链上的泥点。12-15秒，按图片5快速推近咕咕嘎嘎，他挥动短翅、黄色脚掌悬空乱蹬、眼睛睁大并震惊张嘴，末帧短暂停住。只有真人手拥有手指；角色不得变形、换装或丢失核心配件，不生成字幕、文字、水印、黑场或新角色。'
  }
};

function json(res, status, value) {
  const body = JSON.stringify(value);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store'
  });
  res.end(body);
}

function text(res, status, value, contentType = 'text/plain; charset=utf-8') {
  res.writeHead(status, {
    'Content-Type': contentType,
    'Content-Length': Buffer.byteLength(value),
    'Cache-Control': 'no-store'
  });
  res.end(value);
}

function safeError(error) {
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [已隐藏]').slice(0, 1600);
}

async function readJson(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new Error('请求过大，请减少参考图数量或压缩图片。');
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new Error('请求不是有效的 JSON。');
  }
}

function validateApiKey(body) {
  const apiKey = String(body.apiKey || '').trim();
  if (!apiKey) throw new Error('请填写火山方舟 API Key。');
  if (apiKey.length < 8 || apiKey.length > 512 || /\s/.test(apiKey)) throw new Error('API Key 格式异常。');
  return apiKey;
}

function validateOptions(body) {
  const model = String(body.model || 'doubao-seedance-2-0-260128').trim();
  const prompt = String(body.prompt || '').replace(/\bSEGMENT05_REBOUND\b/g, '').trim();
  const duration = Number(body.duration || 15);
  const resolution = String(body.resolution || '720p').trim();
  const ratio = String(body.ratio || '9:16').trim();
  if (!/^[A-Za-z0-9_.-]{3,160}$/.test(model)) throw new Error('模型 ID 格式不正确。');
  if (!prompt) throw new Error('请填写视频提示词。');
  if ([...prompt].length > 2000) throw new Error('提示词过长，请控制在 2000 字以内。');
  if (!Number.isInteger(duration) || duration < 4 || duration > 15) throw new Error('Seedance 2.0 时长应为 4–15 秒。');
  if (!['480p', '720p', '1080p'].includes(resolution)) throw new Error('分辨率只支持 480p、720p 或 1080p。');
  if (!['9:16', '16:9', '1:1', '4:3', '3:4', 'adaptive'].includes(ratio)) throw new Error('画幅比例不受支持。');
  return { model, prompt, duration, resolution, ratio };
}

function stripDataUrl(value) {
  const source = String(value || '');
  const match = source.match(/^data:(image\/(?:png|jpeg|jpg|webp));base64,([A-Za-z0-9+/=\r\n]+)$/i);
  if (!match) return null;
  return { mime: match[1].toLowerCase().replace('image/jpg', 'image/jpeg'), encoded: match[2].replace(/\s/g, '') };
}

function bufferToDataUrl(buffer, fileName) {
  const ext = path.extname(fileName).toLowerCase();
  const mime = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
  if (!buffer.length || buffer.length > MAX_IMAGE_BYTES) throw new Error(`${fileName} 必须小于 10MB。`);
  return `data:${mime};base64,${buffer.toString('base64')}`;
}

function validateDataUrl(value, index) {
  const parsed = stripDataUrl(value);
  if (!parsed) throw new Error(`第 ${index + 1} 张参考图不是有效的 PNG/JPEG/WebP。`);
  const buffer = Buffer.from(parsed.encoded, 'base64');
  if (!buffer.length || buffer.length > MAX_IMAGE_BYTES) throw new Error(`第 ${index + 1} 张参考图必须小于 10MB。`);
  return `data:${parsed.mime};base64,${parsed.encoded}`;
}

async function imagesFor(body) {
  if (body.presetId === 'segment2' && typeof body.prompt === 'string' && body.prompt.includes('SEGMENT05_REBOUND') && PRESETS.segment5Rebound) {
    const preset = PRESETS.segment5Rebound;
    return Promise.all(
      preset.frames.map(async (fileName) => bufferToDataUrl(await fsp.readFile(path.join(STORYBOARD_DIR, fileName)), fileName))
    );
  }
  if (body.presetId === 'segment2' && typeof body.prompt === 'string' && body.prompt.includes('飞镖') && PRESETS.segment4KnifeBarrage) {
    const preset = PRESETS.segment4KnifeBarrage;
    return Promise.all(
      preset.frames.map(async (fileName) => bufferToDataUrl(await fsp.readFile(path.join(STORYBOARD_DIR, fileName)), fileName))
    );
  }
  if (body.presetId && PRESETS[body.presetId]) {
    const preset = PRESETS[body.presetId];
    return Promise.all(
      preset.frames.map(async (fileName) => bufferToDataUrl(await fsp.readFile(path.join(STORYBOARD_DIR, fileName)), fileName))
    );
  }
  if (!Array.isArray(body.imagesDataUrls) || body.imagesDataUrls.length < 1 || body.imagesDataUrls.length > MAX_IMAGES) {
    throw new Error(`请选择项目预设，或上传 1–${MAX_IMAGES} 张参考图。`);
  }
  return body.imagesDataUrls.map(validateDataUrl);
}

async function arkRequest(apiKey, method, taskId, body) {
  const suffix = taskId ? `/${encodeURIComponent(taskId)}` : '';
  const response = await fetch(`${ARK_ORIGIN}${ARK_TASKS_PATH}${suffix}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(120_000)
  });
  const raw = await response.text();
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    data = { error: { message: raw.slice(0, 1400) || `HTTP ${response.status}` } };
  }
  return { status: response.status, data };
}

async function handleSubmit(req, res) {
  const body = await readJson(req);
  const apiKey = validateApiKey(body);
  const options = validateOptions(body);
  const images = await imagesFor(body);
  const parameterSuffix = `--ratio ${options.ratio} --dur ${options.duration} --resolution ${options.resolution}`;
  const content = [
    { type: 'text', text: `${options.prompt}\n${parameterSuffix}` },
    ...images.map((dataUrl) => ({
      type: 'image_url',
      image_url: { url: dataUrl },
      role: 'reference_image'
    }))
  ];
  const result = await arkRequest(apiKey, 'POST', '', {
    model: options.model,
    content,
    generate_audio: Boolean(body.generateAudio),
    return_last_frame: true
  });
  json(res, result.status >= 400 ? result.status : 200, {
    ok: result.status >= 200 && result.status < 300 && Boolean(result.data?.id),
    httpStatus: result.status,
    result: result.data
  });
}

async function handleStatus(req, res) {
  const body = await readJson(req);
  const apiKey = validateApiKey(body);
  const taskId = String(body.taskId || '').trim();
  if (!/^cgt-[A-Za-z0-9_-]{3,180}$/.test(taskId)) throw new Error('任务 ID 格式不正确。');
  const result = await arkRequest(apiKey, 'GET', taskId);
  const videoUrl = result.data?.content?.video_url;
  if (typeof videoUrl === 'string' && videoUrl.startsWith('https://')) completedVideos.set(taskId, videoUrl);
  json(res, result.status >= 400 ? result.status : 200, {
    ok: result.status >= 200 && result.status < 300,
    httpStatus: result.status,
    result: result.data
  });
}

async function handleSave(req, res) {
  const body = await readJson(req);
  const taskId = String(body.taskId || '').trim();
  const videoUrl = completedVideos.get(taskId);
  if (!videoUrl) throw new Error('当前服务内没有该任务的完成结果，请先点击查询状态。');
  await fsp.mkdir(OUTPUT_DIR, { recursive: true });
  const safeTaskId = taskId.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 160);
  const destination = path.join(OUTPUT_DIR, `${safeTaskId}.mp4`);
  const response = await fetch(videoUrl, { signal: AbortSignal.timeout(180_000) });
  if (!response.ok || !response.body) throw new Error(`下载失败：HTTP ${response.status}`);
  const contentLength = Number(response.headers.get('content-length') || 0);
  if (contentLength > 300 * 1024 * 1024) throw new Error('视频文件超过 300MB，已停止下载。');
  await pipeline(Readable.fromWeb(response.body), fs.createWriteStream(destination));
  json(res, 200, { ok: true, path: destination });
}

async function serveStatic(res, filePath) {
  const extensions = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp'
  };
  const data = await fsp.readFile(filePath);
  res.writeHead(200, {
    'Content-Type': extensions[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
    'Content-Length': data.length,
    'Cache-Control': filePath.endsWith('.html') ? 'no-store' : 'public, max-age=300'
  });
  res.end(data);
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${HOST}:${PORT}`);
    if (req.method === 'GET' && url.pathname === '/api/health') {
      return json(res, 200, { ok: true, localOnly: true, auth: 'bearer-api-key', apiHost: new URL(ARK_ORIGIN).host });
    }
    if (req.method === 'GET' && url.pathname === '/api/presets') {
      return json(res, 200, {
        presets: Object.values(PRESETS),
        defaults: {
          model: 'doubao-seedance-2-0-260128',
          duration: 15,
          resolution: '720p',
          ratio: '9:16',
          generateAudio: false,
          apiHost: new URL(ARK_ORIGIN).host
        }
      });
    }
    if (req.method === 'GET' && url.pathname === '/api/project-image') {
      const name = path.basename(url.searchParams.get('name') || '');
      const allowed = new Set(Object.values(PRESETS).flatMap((preset) => preset.frames));
      if (!allowed.has(name)) return text(res, 404, 'Not found');
      return serveStatic(res, path.join(STORYBOARD_DIR, name));
    }
    if (req.method === 'POST' && url.pathname === '/api/submit') return await handleSubmit(req, res);
    if (req.method === 'POST' && url.pathname === '/api/status') return await handleStatus(req, res);
    if (req.method === 'POST' && url.pathname === '/api/save') return await handleSave(req, res);
    if (req.method !== 'GET') return text(res, 405, 'Method not allowed');
    const requested = url.pathname === '/' ? 'index.html' : url.pathname.replace(/^\/+/, '');
    const resolved = path.resolve(PUBLIC_DIR, requested);
    if (!resolved.startsWith(`${PUBLIC_DIR}${path.sep}`) && resolved !== path.join(PUBLIC_DIR, 'index.html')) {
      return text(res, 403, 'Forbidden');
    }
    return await serveStatic(res, resolved);
  } catch (error) {
    const status = error?.code === 'ENOENT' ? 404 : 400;
    return json(res, status, { ok: false, error: safeError(error) });
  }
});

server.listen(PORT, HOST, async () => {
  await fsp.mkdir(OUTPUT_DIR, { recursive: true });
  console.log(`即梦 API 输入口已启动：http://${HOST}:${PORT}`);
  console.log('Bearer API Key 仅在内存中使用，不写入磁盘或日志。');
});
