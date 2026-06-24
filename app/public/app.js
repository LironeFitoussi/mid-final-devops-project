'use strict';

const state = { status: 'all', q: '' };

const $ = (sel) => document.querySelector(sel);
const rowsEl = $('#rows');
const emptyEl = $('#empty');

async function api(path, options) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.status === 204 ? null : res.json();
}

function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function fmtNum(n) {
  return n.toLocaleString();
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );
}

async function loadStats() {
  const s = await api('/api/stats');
  $('#stat-total').textContent = fmtNum(s.total);
  $('#stat-published').textContent = fmtNum(s.published);
  $('#stat-drafts').textContent = fmtNum(s.drafts);
  $('#stat-views').textContent = fmtNum(s.totalViews);
}

async function loadVersion() {
  try {
    const v = await api('/version');
    $('#version').textContent = `v${v.version}`;
  } catch {
    $('#version').textContent = 'v?';
  }
}

function rowTemplate(m) {
  return `
    <tr>
      <td>
        <div class="meme-cell">
          <div class="thumb ${m.gradient}">${m.emoji}</div>
          <div>
            <div class="meme-title">${escapeHtml(m.title)}</div>
            <div class="meme-id">#${m.id}</div>
          </div>
        </div>
      </td>
      <td>${escapeHtml(m.category)}</td>
      <td>${escapeHtml(m.author)}</td>
      <td><span class="badge ${m.status}">${m.status === 'published' ? '● Published' : '○ Draft'}</span></td>
      <td>${fmtNum(m.views)}</td>
      <td>${fmtDate(m.updatedAt)}</td>
      <td>
        <div class="row-actions">
          <button class="btn" data-edit="${m.id}">Edit</button>
          <button class="btn" data-del="${m.id}">Delete</button>
        </div>
      </td>
    </tr>`;
}

async function loadMemes() {
  const params = new URLSearchParams();
  if (state.status !== 'all') params.set('status', state.status);
  if (state.q) params.set('q', state.q);
  const memes = await api(`/api/memes?${params.toString()}`);
  rowsEl.innerHTML = memes.map(rowTemplate).join('');
  emptyEl.hidden = memes.length > 0;
}

async function refresh() {
  await Promise.all([loadStats(), loadMemes()]);
}

function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => (el.hidden = true), 2400);
}

// ---- Modal ----
const modal = $('#modal');

async function openModal(meme) {
  const categories = await api('/api/categories');
  $('#f-category').innerHTML = categories
    .map((c) => `<option value="${c}">${c}</option>`)
    .join('');
  if (meme) {
    $('#modal-title').textContent = 'Edit Meme';
    $('#meme-id').value = meme.id;
    $('#f-title').value = meme.title;
    $('#f-category').value = meme.category;
    $('#f-author').value = meme.author;
    $('#f-status').value = meme.status;
  } else {
    $('#modal-title').textContent = 'New Meme';
    $('#meme-form').reset();
    $('#meme-id').value = '';
  }
  modal.hidden = false;
}

function closeModal() {
  modal.hidden = true;
}

// ---- Events ----
$('#new-btn').addEventListener('click', () => openModal(null));
$('#modal-close').addEventListener('click', closeModal);
$('#cancel-btn').addEventListener('click', closeModal);
modal.addEventListener('click', (e) => {
  if (e.target === modal) closeModal();
});

$('#meme-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = $('#meme-id').value;
  const payload = {
    title: $('#f-title').value,
    category: $('#f-category').value,
    author: $('#f-author').value,
    status: $('#f-status').value,
  };
  try {
    if (id) {
      await api(`/api/memes/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
      toast('Meme updated');
    } else {
      await api('/api/memes', { method: 'POST', body: JSON.stringify(payload) });
      toast('Meme created');
    }
    closeModal();
    await refresh();
  } catch (err) {
    toast(err.message);
  }
});

rowsEl.addEventListener('click', async (e) => {
  const editId = e.target.getAttribute('data-edit');
  const delId = e.target.getAttribute('data-del');
  if (editId) {
    const meme = await api(`/api/memes/${editId}`);
    openModal(meme);
  } else if (delId) {
    if (!confirm('Delete this meme?')) return;
    try {
      await api(`/api/memes/${delId}`, { method: 'DELETE' });
      toast('Meme deleted');
      await refresh();
    } catch (err) {
      toast(err.message);
    }
  }
});

document.querySelectorAll('.chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.chip').forEach((c) => c.classList.remove('active'));
    chip.classList.add('active');
    state.status = chip.getAttribute('data-status');
    loadMemes();
  });
});

let searchTimer;
$('#search').addEventListener('input', (e) => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    state.q = e.target.value.trim();
    loadMemes();
  }, 200);
});

// ---- Init ----
loadVersion();
refresh().catch((err) => toast(err.message));
