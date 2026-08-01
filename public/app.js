// ── DOM Elements ──
const fileInput     = document.getElementById('fileInput');
const dropZone      = document.getElementById('dropZone');
const filePreview   = document.getElementById('filePreview');
const previewThumb  = document.getElementById('previewThumb');
const previewName   = document.getElementById('previewName');
const previewMeta   = document.getElementById('previewMeta');
const uploadBtn     = document.getElementById('uploadBtn');
const progressWrap  = document.getElementById('progressWrap');
const progressFill  = document.getElementById('progressFill');
const progressPct   = document.getElementById('progressPct');
const progressStatus= document.getElementById('progressStatus');
const fileList      = document.getElementById('file-list');
const searchInput   = document.getElementById('searchInput');
const sortSelect    = document.getElementById('sortSelect');
const toastContainer= document.getElementById('toastContainer');
const modalOverlay  = document.getElementById('modalOverlay');
const modalFileName = document.getElementById('modalFileName');
const modalConfirm  = document.getElementById('modalConfirm');
const modalCancel   = document.getElementById('modalCancel');

let currentView = 'list';
let deleteTargetId = null;
let selectedFile = null;



dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('dragover'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
dropZone.addEventListener('drop', e => {
  e.preventDefault(); dropZone.classList.remove('dragover');
  if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]);
});
fileInput.addEventListener('change', () => { if (fileInput.files[0]) setFile(fileInput.files[0]); });

function setFile(f) {
  selectedFile = f;
  previewName.textContent = f.name;
  previewMeta.textContent = `${formatSize(f.size)} · ${f.type || 'unknown'}`;
  // Show thumbnail for images
  previewThumb.innerHTML = '';
  if (f.type.startsWith('image/')) {
    const img = document.createElement('img');
    img.src = URL.createObjectURL(f);
    previewThumb.appendChild(img);
  } else {
    previewThumb.textContent = getMimeIcon(f.type);
  }
  filePreview.classList.add('active');
  uploadBtn.disabled = false;
}

document.getElementById('previewRemove').addEventListener('click', () => {
  selectedFile = null;
  fileInput.value = '';
  filePreview.classList.remove('active');
  uploadBtn.disabled = true;
});

// ── Upload ──
uploadBtn.addEventListener('click', () => {
  const file = selectedFile || fileInput.files[0];
  if (!file) return;
  uploadBtn.disabled = true;
  progressWrap.classList.add('active');
  progressPct.textContent = '0%';
  progressFill.style.strokeDashoffset = '226';

  const formData = new FormData();
  formData.append('file', file);
  const xhr = new XMLHttpRequest();
  xhr.open('POST', '/api/upload');

  xhr.upload.addEventListener('progress', e => {
    if (e.lengthComputable) {
      const pct = Math.round((e.loaded / e.total) * 100);
      const offset = 226 - (226 * pct / 100);
      progressFill.style.strokeDashoffset = offset;
      progressPct.textContent = pct + '%';
      progressStatus.textContent = pct < 100 ? 'Uploading…' : 'Processing…';
    }
  });

  xhr.addEventListener('load', () => {
    progressWrap.classList.remove('active');
    try {
      const res = JSON.parse(xhr.responseText);
      if (res.success) {
        showToast('File uploaded successfully!', 'success');
        selectedFile = null; fileInput.value = '';
        filePreview.classList.remove('active');
        loadFiles(); loadStats();
      } else {
        showToast(res.message || 'Upload failed', 'error');
        uploadBtn.disabled = false;
      }
    } catch {
      showToast('Upload failed — server error', 'error');
      uploadBtn.disabled = false;
    }
  });

  xhr.addEventListener('error', () => {
    progressWrap.classList.remove('active');
    showToast('Network error — is the server running?', 'error');
    uploadBtn.disabled = false;
  });

  xhr.send(formData);
});

// ── Load Files ──
async function loadFiles() {
  try {
    const search = searchInput.value.trim();
    const sort = sortSelect.value;
    let url = '/api/files?';
    if (search) url += `search=${encodeURIComponent(search)}&`;
    if (sort) {
      const [field, order] = sort.split('-');
      url += `sort=${field}&order=${order}&`;
    }
    const res = await fetch(url);
    const data = await res.json();
    renderFiles(data.files || []);
  } catch {
    fileList.innerHTML = '<div class="empty-state"><div class="empty-icon">⚠️</div><p>Could not reach server</p></div>';
  }
}

function renderFiles(files) {
  if (!files.length) {
    fileList.innerHTML = '<div class="empty-state"><div class="empty-icon">📭</div><p>No files yet — upload your first file above!</p></div>';
    return;
  }
  const isGrid = currentView === 'grid';
  fileList.className = isGrid ? 'grid-view' : '';
  fileList.id = 'file-list';

  fileList.innerHTML = files.map((f, i) => {
    const cat = getCategory(f.mimeType);
    const isImage = f.mimeType.startsWith('image/');
    const delay = Math.min(i * 50, 500);

    if (isGrid) {
      return `
        <div class="file-item" style="animation-delay:${delay}ms" id="item-${f._id}">
          <div class="file-thumb-area">
            ${isImage ? `<img src="/api/files/${f._id}/preview" alt="${f.originalName}" loading="lazy"/>` : `<div class="file-icon-large">${getMimeIcon(f.mimeType)}</div>`}
          </div>
          <div class="file-item-body">
            <div class="file-name" title="${f.originalName}">${f.originalName}</div>
            <div class="file-meta">
              <span class="file-type-badge badge-${cat}">${cat}</span>
              <span>${formatSize(f.fileSize)}</span>
            </div>
          </div>
          <div class="file-actions">
            <button class="btn-icon dl" onclick="downloadFile('${f._id}')" title="Download">⬇</button>
            <button class="btn-icon del" onclick="confirmDelete('${f._id}','${escapeHtml(f.originalName)}')" title="Delete">✕</button>
          </div>
        </div>`;
    }
    return `
      <div class="file-item" style="animation-delay:${delay}ms" id="item-${f._id}">
        <div class="file-icon-wrap ${cat}-type">
          ${isImage ? `<img src="/api/files/${f._id}/preview" alt="" loading="lazy"/>` : getMimeIcon(f.mimeType)}
        </div>
        <div class="file-info">
          <div class="file-name" title="${f.originalName}">${f.originalName}</div>
          <div class="file-meta">
            <span class="file-type-badge badge-${cat}">${cat}</span>
            <span>${formatSize(f.fileSize)}</span>
            <span>${timeAgo(f.createdAt)}</span>
          </div>
        </div>
        <div class="file-actions">
          <button class="btn-icon dl" onclick="downloadFile('${f._id}')" title="Download">⬇</button>
          <button class="btn-icon del" onclick="confirmDelete('${f._id}','${escapeHtml(f.originalName)}')" title="Delete">✕</button>
        </div>
      </div>`;
  }).join('');
}

// ── Stats ──
async function loadStats() {
  try {
    const res = await fetch('/api/stats');
    const data = await res.json();
    if (!data.success) return;
    const s = data.stats;
    animateCounter('statFiles', s.totalFiles);
    document.getElementById('statSize').textContent = formatSize(s.totalSize);
    // Most common type
    const cats = Object.entries(s.breakdown).filter(([,v]) => v > 0).sort((a,b) => b[1]-a[1]);
    document.getElementById('statType').textContent = cats.length ? cats[0][0] : '—';
    document.getElementById('statTypes').textContent = cats.length;
  } catch { /* silent */ }
}

function animateCounter(id, target) {
  const el = document.getElementById(id);
  let current = 0;
  const step = Math.max(1, Math.ceil(target / 30));
  const timer = setInterval(() => {
    current += step;
    if (current >= target) { current = target; clearInterval(timer); }
    el.textContent = current;
  }, 30);
}

// ── Download ──
function downloadFile(id) { window.location.href = `/api/files/${id}`; }

function confirmDelete(id, name) {
  deleteTargetId = id;
  modalFileName.textContent = name;
  modalOverlay.classList.add('active');
}
modalCancel.addEventListener('click', () => { modalOverlay.classList.remove('active'); deleteTargetId = null; });
modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) { modalOverlay.classList.remove('active'); deleteTargetId = null; } });

modalConfirm.addEventListener('click', async () => {
  if (!deleteTargetId) return;
  modalOverlay.classList.remove('active');
  try {
    const res = await fetch(`/api/files/${deleteTargetId}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      const item = document.getElementById(`item-${deleteTargetId}`);
      if (item) { item.style.opacity = '0'; item.style.transform = 'scale(0.95)'; setTimeout(() => { item.remove(); if (!fileList.children.length) loadFiles(); }, 300); }
      showToast('File deleted', 'success');
      loadStats();
    } else { showToast(data.message, 'error'); }
  } catch { showToast('Delete failed', 'error'); }
  deleteTargetId = null;
});

// ── View Toggle ──
document.querySelectorAll('.view-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentView = btn.dataset.view;
    loadFiles();
  });
});

// ── Search & Sort ──
let searchTimer;
searchInput.addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(loadFiles, 300);
});
sortSelect.addEventListener('change', loadFiles);

// ── Toast ──
function showToast(msg, type) {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${type === 'success' ? '✓' : '✕'}</span><span>${msg}</span>`;
  toastContainer.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(30px)'; setTimeout(() => toast.remove(), 300); }, 4000);
}

// ── Helpers ──
function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 ** 2) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 ** 3) return (bytes / 1024 ** 2).toFixed(1) + ' MB';
  return (bytes / 1024 ** 3).toFixed(2) + ' GB';
}

function getMimeIcon(mime) {
  if (!mime) return '📁';
  if (mime.startsWith('image/')) return '🖼️';
  if (mime === 'application/pdf') return '📕';
  if (mime.includes('word')) return '📘';
  if (mime.includes('sheet') || mime.includes('excel') || mime === 'text/csv') return '📗';
  if (mime.includes('presentation') || mime.includes('powerpoint')) return '📙';
  if (mime.startsWith('audio/')) return '🎵';
  if (mime.startsWith('video/')) return '🎬';
  if (mime.includes('zip') || mime.includes('rar') || mime.includes('7z')) return '📦';
  if (mime === 'application/json') return '⚙️';
  if (mime === 'text/plain') return '📝';
  return '📄';
}

function getCategory(mime) {
  if (!mime) return 'other';
  if (mime.startsWith('image/')) return 'image';
  if (/^application\/(pdf|msword|vnd\.)/.test(mime)) return 'document';
  if (/^application\/(zip|x-zip|x-rar|x-7z)/.test(mime)) return 'archive';
  if (/^(audio|video)\//.test(mime)) return 'media';
  if (/^(text\/|application\/json)/.test(mime)) return 'text';
  return 'other';
}

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  if (diff < 604800) return Math.floor(diff / 86400) + 'd ago';
  return new Date(dateStr).toLocaleDateString();
}

function escapeHtml(str) {
  return str.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

// ── Init ──
initParticles();
loadFiles();
loadStats();
