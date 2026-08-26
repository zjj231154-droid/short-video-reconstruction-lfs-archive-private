const API_KEY_STORAGE_KEY = 'jimeng-console.ark-api-key';
const API_KEY_REMEMBER_STORAGE_KEY = 'jimeng-console.remember-api-key';
const state = { presets: new Map(), taskId: '', timer: null, busy: false };
const $ = (selector) => document.querySelector(selector);
const elements = {
  form: $('#generator-form'), apiKey: $('#api-key'), toggleSecret: $('#toggle-secret'),
  rememberKey: $('#remember-key'),
  preset: $('#preset'), presetNote: $('#preset-note'), frameStrip: $('#frame-strip'),
  customImages: $('#custom-images'), referenceFiles: $('#reference-files'), customPreview: $('#custom-preview'),
  model: $('#model'), duration: $('#duration'), resolution: $('#resolution'), ratio: $('#ratio'),
  generateAudio: $('#generate-audio'), prompt: $('#prompt'), promptCount: $('#prompt-count'),
  submitButton: $('#submit-button'), jobPanel: $('#job-panel'), statusBadge: $('#status-badge'),
  taskId: $('#task-id'), jobStatus: $('#job-status'), jobMessage: $('#job-message'), rawResult: $('#raw-result'),
  checkButton: $('#check-button'), saveButton: $('#save-button'), videoLink: $('#video-link'), savedPath: $('#saved-path')
};

function loadSavedApiKey() {
  const remember = localStorage.getItem(API_KEY_REMEMBER_STORAGE_KEY);
  elements.rememberKey.checked = remember == null ? true : remember === 'true';
  if (elements.rememberKey.checked) elements.apiKey.value = localStorage.getItem(API_KEY_STORAGE_KEY) || '';
}

function syncSavedApiKey() {
  localStorage.setItem(API_KEY_REMEMBER_STORAGE_KEY, String(elements.rememberKey.checked));
  if (elements.rememberKey.checked) {
    const value = elements.apiKey.value.trim();
    if (value) localStorage.setItem(API_KEY_STORAGE_KEY, value);
  } else {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
  }
}

function setBusy(value) {
  state.busy = value;
  elements.submitButton.disabled = value;
  elements.checkButton.disabled = value;
  elements.submitButton.querySelector('span').textContent = value ? '正在请求 Seedance…' : '提交 Seedance 2.0 任务';
}

function updatePromptCount() {
  const count = [...elements.prompt.value].length;
  elements.promptCount.textContent = `${count} / 2000`;
  elements.promptCount.classList.toggle('over', count > 1850);
}

function renderFrames(names) {
  elements.frameStrip.innerHTML = '';
  names.forEach((name, index) => {
    const figure = document.createElement('figure');
    figure.innerHTML = `<img src="/api/project-image?name=${encodeURIComponent(name)}" alt="图片${index + 1}" /><figcaption>图片${index + 1} · ${name}</figcaption>`;
    elements.frameStrip.append(figure);
  });
}

function selectPreset() {
  const id = elements.preset.value;
  const preset = state.presets.get(id);
  const custom = id === 'custom';
  elements.customImages.classList.toggle('hidden', !custom);
  elements.frameStrip.classList.toggle('hidden', custom);
  if (!preset) return;
  elements.presetNote.textContent = preset.note;
  renderFrames(preset.frames);
  elements.prompt.value = preset.prompt;
  updatePromptCount();
}

async function loadPresets() {
  const response = await fetch('/api/presets', { cache: 'no-store' });
  const data = await response.json();
  elements.preset.innerHTML = '';
  for (const preset of data.presets) {
    state.presets.set(preset.id, preset);
    const option = document.createElement('option');
    option.value = preset.id;
    option.textContent = preset.name;
    elements.preset.append(option);
  }
  const custom = document.createElement('option');
  custom.value = 'custom';
  custom.textContent = '自定义上传 1–9 张参考图';
  elements.preset.append(custom);
  elements.model.value = data.defaults.model;
  elements.duration.value = data.defaults.duration;
  elements.resolution.value = data.defaults.resolution;
  elements.ratio.value = data.defaults.ratio;
  elements.generateAudio.checked = data.defaults.generateAudio;
  selectPreset();
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (file.size > 10 * 1024 * 1024) return reject(new Error(`${file.name} 超过 10MB。`));
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) return reject(new Error(`${file.name} 格式不受支持。`));
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error(`无法读取 ${file.name}。`));
    reader.readAsDataURL(file);
  });
}

function previewCustomFiles() {
  const files = [...elements.referenceFiles.files];
  elements.customPreview.innerHTML = '';
  if (files.length > 9) return showError(new Error('最多上传 9 张参考图。'));
  files.forEach((file, index) => {
    const figure = document.createElement('figure');
    const url = URL.createObjectURL(file);
    figure.innerHTML = `<img src="${url}" alt="图片${index + 1}" /><figcaption>图片${index + 1} · ${file.name}</figcaption>`;
    elements.customPreview.append(figure);
  });
}

async function apiPost(endpoint, payload) {
  const response = await fetch(endpoint, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
  });
  const data = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
  if (!response.ok || data.ok === false) {
    const message = data.result?.error?.message || data.result?.message || data.error || `HTTP ${response.status}`;
    const error = new Error(message);
    error.payload = data;
    throw error;
  }
  return data;
}

function showResult(payload, label = '') {
  elements.jobPanel.classList.remove('hidden');
  elements.rawResult.textContent = JSON.stringify(payload, null, 2);
  elements.jobMessage.textContent = payload?.result?.error?.message || payload?.result?.message || label || '—';
}

function showError(error) {
  clearInterval(state.timer);
  state.timer = null;
  elements.jobPanel.classList.remove('hidden');
  elements.statusBadge.textContent = '失败';
  elements.statusBadge.dataset.kind = 'error';
  elements.jobStatus.textContent = '请求失败';
  elements.jobMessage.textContent = error.message;
  elements.rawResult.textContent = error.payload ? JSON.stringify(error.payload, null, 2) : '';
}

async function submitTask(event) {
  event.preventDefault();
  syncSavedApiKey();
  clearInterval(state.timer);
  state.timer = null;
  state.taskId = '';
  elements.savedPath.textContent = '';
  elements.videoLink.classList.add('hidden');
  elements.saveButton.classList.add('hidden');
  setBusy(true);
  try {
    const payload = {
      apiKey: elements.apiKey.value.trim(), presetId: elements.preset.value === 'custom' ? '' : elements.preset.value,
      model: elements.model.value.trim(), duration: Number(elements.duration.value), resolution: elements.resolution.value,
      ratio: elements.ratio.value, generateAudio: elements.generateAudio.checked, prompt: elements.prompt.value.trim()
    };
    if (elements.preset.value === 'custom') {
      const files = [...elements.referenceFiles.files];
      if (files.length < 1 || files.length > 9) throw new Error('请选择 1–9 张参考图。');
      payload.imagesDataUrls = await Promise.all(files.map(fileToDataUrl));
    }
    const data = await apiPost('/api/submit', payload);
    showResult(data, '任务已提交');
    const taskId = data.result?.id;
    if (!taskId) throw Object.assign(new Error('接口未返回任务 ID，请查看原始响应。'), { payload: data });
    state.taskId = String(taskId);
    elements.taskId.textContent = state.taskId;
    elements.statusBadge.textContent = '已提交';
    elements.statusBadge.dataset.kind = 'queue';
    elements.jobStatus.textContent = 'queued';
    elements.jobMessage.textContent = 'Seedance 任务已创建';
    state.timer = setInterval(checkStatus, 6000);
  } catch (error) {
    showError(error);
  } finally { setBusy(false); }
}

async function checkStatus() {
  if (!state.taskId || state.busy) return;
  setBusy(true);
  try {
    const data = await apiPost('/api/status', { apiKey: elements.apiKey.value.trim(), taskId: state.taskId });
    showResult(data);
    const status = data.result?.status || 'unknown';
    elements.jobStatus.textContent = status;
    elements.statusBadge.textContent = status === 'succeeded' ? '已完成' : status === 'running' ? '生成中' : status === 'failed' ? '失败' : '排队中';
    elements.statusBadge.dataset.kind = status === 'succeeded' ? 'done' : status === 'failed' ? 'error' : 'queue';
    elements.jobMessage.textContent = data.result?.error?.message || data.result?.message || '—';
    const videoUrl = data.result?.content?.video_url;
    if (['succeeded', 'failed', 'canceled'].includes(status) || videoUrl) { clearInterval(state.timer); state.timer = null; }
    if (videoUrl) {
      elements.videoLink.href = videoUrl;
      elements.videoLink.classList.remove('hidden');
      elements.saveButton.classList.remove('hidden');
    }
  } catch (error) { showError(error); }
  finally { setBusy(false); }
}

async function saveVideo() {
  if (!state.taskId || state.busy) return;
  setBusy(true);
  try {
    const data = await apiPost('/api/save', { taskId: state.taskId });
    elements.savedPath.textContent = `已保存：${data.path}`;
  } catch (error) { showError(error); }
  finally { setBusy(false); }
}

elements.toggleSecret.addEventListener('click', () => {
  const visible = elements.apiKey.type === 'text';
  elements.apiKey.type = visible ? 'password' : 'text';
  elements.toggleSecret.textContent = visible ? '显示 Key' : '隐藏 Key';
});
elements.apiKey.addEventListener('input', syncSavedApiKey);
elements.rememberKey.addEventListener('change', syncSavedApiKey);
elements.preset.addEventListener('change', selectPreset);
elements.referenceFiles.addEventListener('change', previewCustomFiles);
elements.prompt.addEventListener('input', updatePromptCount);
elements.form.addEventListener('submit', submitTask);
elements.checkButton.addEventListener('click', checkStatus);
elements.saveButton.addEventListener('click', saveVideo);
loadSavedApiKey();
loadPresets().catch(showError);
