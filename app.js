'use strict';
/* =====================================================================
   Task Manager PWA — frontend (GitHub Pages) talking to Apps Script API
   ===================================================================== */

/* ---------- tiny helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const LS = {
  get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  del(k) { try { localStorage.removeItem(k); } catch {} }
};
const cap = s => s ? s[0].toUpperCase() + s.slice(1) : '';

const ICONS = {
  home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3.5" cy="6" r="1"/><circle cx="3.5" cy="12" r="1"/><circle cx="3.5" cy="18" r="1"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
  user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  share: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/>',
  tag: '<path d="M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1"/>',
  alert: '<path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>',
  check: '<path d="M20 6L9 17l-5-5"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
  refresh: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
  layers: '<path d="M12 2l10 5-10 5L2 7z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>',
  chevron: '<path d="M6 9l6 6 6-6"/>',
  x: '<path d="M18 6L6 18M6 6l12 12"/>',
  copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"/>'
};
const ic = n => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ''}</svg>`;
const hydrate = (root = document) => $$('[data-ic]', root).forEach(el => { if (!el.firstChild) el.innerHTML = ic(el.dataset.ic); });

const PALETTE = ['#00bba5', '#4f8cff', '#f5a623', '#9b6bff', '#ef5da8', '#2fb67c', '#ee6c4d', '#3d9cc9'];
const colorFor = name => { let h = 0; for (const c of String(name || '?')) h = (h * 31 + c.codePointAt(0)) >>> 0; return PALETTE[h % PALETTE.length]; };
const initials = name => { const p = String(name || '?').trim().split(/\s+/); return (p[0][0] + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase(); };
const avatar = (name, size = '', pic = '') =>
  `<span class="avatar ${size}" style="background:${colorFor(name)}">${pic ? `<img src="${esc(pic)}" alt="" referrerpolicy="no-referrer">` : esc(initials(name))}</span>`;

/* ---------- state ---------- */
const PAGE_LIMIT = 8;
const STATUSES = ['Pending', 'In Progress', 'Done'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const S = {
  tasks: [], categories: [], team: [], givenBy: [],
  page: 1, alertsOnly: false, chart: null, loaded: false, lastSync: 0
};
let warnDays = Number(LS.get('tm_warn', 3)) || 3;
let deferredInstall = null;

/* ---------- API ---------- */
async function api(action, payload = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 45000);
  let res;
  try {
    res = await fetch(CONFIG.API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // avoids CORS preflight on Apps Script
      body: JSON.stringify({ action, key: CONFIG.ACCESS_KEY || '', payload }),
      signal: ctrl.signal
    });
  } catch (e) {
    const err = new Error(e.name === 'AbortError' ? 'Request timed out' : 'No internet connection');
    err.code = 'NETWORK'; throw err;
  } finally { clearTimeout(timer); }
  let json;
  try { json = await res.json(); } catch { const err = new Error('Server returned an invalid response'); err.code = 'BAD'; throw err; }
  if (!json.ok) {
    const err = new Error(json.message || 'Error'); err.code = json.code || 'ERROR';
    throw err;
  }
  return json.data;
}

/* ---------- screens ---------- */
function showScreen(name) {
  ['boot', 'setup', 'app'].forEach(id => $('#' + id).classList.toggle('hidden', id !== name));
}
function toast(msg, isErr) {
  const t = $('#toast'); t.textContent = msg; t.classList.toggle('err', !!isErr); t.classList.add('show');
  clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 2800);
}

/* ---------- theme ---------- */
function setTheme(t) {
  document.documentElement.setAttribute('data-theme', t); LS.set('tm_theme', t);
  $('#themeIc').innerHTML = ic(t === 'dark' ? 'sun' : 'moon');
  const m = $('meta[name="theme-color"]'); if (m) m.content = t === 'dark' ? '#11151a' : '#1f242e';
  if (S.chart) { S.chart.destroy(); S.chart = null; renderChart(); }
}

/* ---------- date + deadline warning ---------- */
const todayMid = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); };
function daysLeft(iso) { const [y, m, d] = iso.split('-').map(Number); return Math.round((new Date(y, m - 1, d) - todayMid()) / 864e5); }
function dueInfo(t) {
  if (!t.deadline || t.status === 'Done') return null;
  const d = daysLeft(t.deadline);
  if (d < 0) return { level: 'overdue', text: `Overdue ${-d}d` };
  if (d === 0) return { level: 'today', text: 'Due today' };
  if (d <= warnDays) return { level: 'soon', text: d === 1 ? 'Due tomorrow' : `${d} days left` };
  return null;
}
const dueBadge = t => { const i = dueInfo(t); return i ? `<span class="due ${i.level}" title="Deadline alert">${ic('alert')}${i.text}</span>` : ''; };
function fmtDate(iso) {
  if (!iso) return '-';
  const p = String(iso).split('-'); if (p.length !== 3) return iso;
  return `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][+p[1] - 1]} ${+p[2]}, ${p[0]}`;
}
function alertCounts() {
  let danger = 0, soon = 0;
  S.tasks.forEach(t => { const i = dueInfo(t); if (!i) return; if (i.level === 'soon') soon++; else danger++; });
  return { danger, soon, total: danger + soon };
}

const cacheKey = () => 'tm_cache';

/* ---------- data load ---------- */
function applyData(d) {
  S.tasks = d.tasks || []; S.categories = d.categories || []; S.team = d.team || []; S.givenBy = d.givenBy || [];
  S.loaded = true; S.lastSync = Date.now();
}
async function refresh(manual) {
  if (manual) toast('Refreshing…');
  try {
    const d = await api('bootstrap', {});
    applyData(d); LS.set(cacheKey(), d);
    showScreen('app'); renderAll();
    if (manual) toast('Up to date ✓');
  } catch (e) {
    if (S.loaded) { toast(e.code === 'NETWORK' ? 'Offline — showing saved data' : e.message, true); return; }
    const boot = $('#boot'); showScreen('boot');
    boot.innerHTML = `<img class="boot-mark" style="animation:none" src="icons/logo-mark.png" alt=""><p style="color:var(--muted);text-align:center">${esc(e.message)}</p><button class="btn primary" data-act="retry">Retry</button>`;
  }
}

/* ---------- rendering ---------- */
function renderAll() { renderChrome(); renderFilters(); renderStats(); renderBanner(); renderTasks(); renderChart(); }

function renderChrome() {
  const h = new Date().getHours();
  $('#greet').textContent = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

function fillSelect(id, values, allLabel) {
  const el = $('#' + id); const cur = el.value;
  el.innerHTML = `<option value="">${allLabel}</option>` + values.map(v => `<option value="${esc(v)}">${esc(v)}</option>`).join('');
  if (values.includes(cur)) el.value = cur;
}
function renderFilters() {
  fillSelect('fMonth', MONTHS, 'All months');
  fillSelect('fCategory', S.categories.map(c => c.name), 'All categories');
  fillSelect('fAssigned', S.team.map(m => m.name), 'All managers');
  fillSelect('fStatus', STATUSES, 'All status');
}

function renderStats() {
  const c = s => S.tasks.filter(t => t.status === s).length;
  const cards = [
    ['s-total', 'list', 'Total tasks', S.tasks.length], ['s-pending', 'bell', 'Pending', c('Pending')],
    ['s-progress', 'refresh', 'In progress', c('In Progress')], ['s-done', 'check', 'Completed', c('Done')]
  ];
  $('#stats').innerHTML = cards.map(([cls, i, label, n]) => `<div class="stat ${cls}"><div class="s-ic">${ic(i)}</div><div class="s-label">${label}</div><div class="s-num">${n}</div></div>`).join('');
}

function renderBanner() {
  const c = alertCounts(); const el = $('#banner');
  $('#alertChipTxt').textContent = c.total ? `Alerts (${c.total})` : 'Alerts';
  $('#alertChip').classList.toggle('on', S.alertsOnly);
  if (!c.total) { el.innerHTML = ''; return; }
  const parts = [];
  if (c.danger) parts.push(`${c.danger} overdue / due today`);
  if (c.soon) parts.push(`${c.soon} due within ${warnDays} day${warnDays > 1 ? 's' : ''}`);
  el.innerHTML = `<div class="banner ${c.danger ? 'danger' : ''}">${ic('alert')}<span class="grow">${parts.join(' · ')}</span><button data-act="show-alerts">View</button></div>`;
}

function getFiltered() {
  const v = id => $('#' + id).value, q = ($('#q').value || '').toLowerCase().trim();
  const month = v('fMonth'), cat = v('fCategory'), who = v('fAssigned'), st = v('fStatus');
  const rank = { overdue: 0, today: 1, soon: 2 }, order = { 'In Progress': 1, 'Pending': 2, 'Done': 3 };
  return S.tasks.map((t, i) => ({ ...t, _i: i })).filter(t =>
    (!month || t.month === month) && (!cat || t.category === cat) && (!who || t.assignedTo === who) && (!st || t.status === st) &&
    (!q || (t.taskName + ' ' + t.givenBy + ' ' + t.category).toLowerCase().includes(q)) && (!S.alertsOnly || dueInfo(t))
  ).sort((a, b) => {
    const oa = order[a.status] || 4, ob = order[b.status] || 4; if (oa !== ob) return oa - ob;
    const ra = rank[dueInfo(a)?.level] ?? 9, rb = rank[dueInfo(b)?.level] ?? 9; if (ra !== rb) return ra - rb;
    return b._i - a._i;
  });
}
const whoHtml = n => n ? `<span class="who">${avatar(n, 'sm')}${esc(n)}</span>` : '<span class="t-sub">Unassigned</span>';
function actionsHtml(t) {
  const id = esc(t.id);
  return `<div class="row-actions">${t.status !== 'Done' ? `<button class="icon-btn sm good" data-act="done-task" data-id="${id}" title="Mark done">${ic('check')}</button>` : ''}<button class="icon-btn sm" data-act="edit-task" data-id="${id}" title="Edit">${ic('edit')}</button><button class="icon-btn sm" data-act="delete-task" data-id="${id}" title="Delete">${ic('trash')}</button></div>`;
}
function renderTasks() {
  const list = getFiltered(); const pages = Math.max(1, Math.ceil(list.length / PAGE_LIMIT));
  if (S.page > pages) S.page = pages;
  const slice = list.slice((S.page - 1) * PAGE_LIMIT, S.page * PAGE_LIMIT);
  if (!slice.length) {
    const msg = `<div class="empty">${S.tasks.length ? 'No tasks match these filters.' : 'No tasks yet. Tap + to create your first task.'}</div>`;
    $('#tbody').innerHTML = `<tr><td colspan="7">${msg}</td></tr>`; $('#cards').innerHTML = msg; $('#pager').innerHTML = ''; return;
  }
  $('#tbody').innerHTML = slice.map(t => {
    const lv = dueInfo(t)?.level || '';
    return `<tr class="lv-${lv}">
      <td><div class="t-name">${esc(t.taskName)}</div><div class="t-sub">${esc(t.category)}</div></td>
      <td>${whoHtml(t.assignedTo)}</td><td class="nowrap">${fmtDate(t.date)}</td>
      <td class="nowrap">${fmtDate(t.deadline)}${dueBadge(t)}</td>
      <td><span class="badge ${t.status.replace(/\s+/g, '-')}">${esc(t.status)}</span></td>
      <td class="nowrap" style="color:var(--text)">${esc(t.givenBy || '-')}</td><td>${actionsHtml(t)}</td></tr>`;
  }).join('');
  $('#cards').innerHTML = slice.map(t => {
    const lv = dueInfo(t)?.level || '';
    return `<div class="tcard lv-${lv}">
      <div class="tc-top"><div><div class="t-name">${esc(t.taskName)}</div><div class="t-sub">${esc(t.category)}</div></div><span class="badge ${t.status.replace(/\s+/g, '-')}">${esc(t.status)}</span></div>
      <div class="tc-meta">${whoHtml(t.assignedTo)}<span>${t.deadline ? 'Due ' + fmtDate(t.deadline) : 'No deadline'}${dueBadge(t)}</span></div>
      <div class="tc-foot"><span>${t.givenBy ? 'By ' + esc(t.givenBy) : ''}</span>${actionsHtml(t)}</div></div>`;
  }).join('');
  let ph = '';
  if (pages > 1) {
    ph = `<button class="pg" ${S.page === 1 ? 'disabled' : ''} data-act="page" data-p="${S.page - 1}">‹</button>`;
    const from = Math.max(1, Math.min(S.page - 2, pages - 4)), to = Math.min(pages, from + 4);
    for (let i = from; i <= to; i++) ph += `<button class="pg ${i === S.page ? 'active' : ''}" data-act="page" data-p="${i}">${i}</button>`;
    ph += `<button class="pg" ${S.page === pages ? 'disabled' : ''} data-act="page" data-p="${S.page + 1}">›</button>`;
  }
  $('#pager').innerHTML = ph;
}

function renderChart() {
  const map = {};
  S.tasks.forEach(t => { const p = t.assignedTo || 'Unassigned'; (map[p] ||= { name: p, total: 0, done: 0 }); map[p].total++; if (t.status === 'Done') map[p].done++; });
  const stats = Object.values(map).sort((a, b) => b.done - a.done);
  $('#legend').innerHTML = stats.length ? stats.map(s => `<div class="lg-row"><span><i class="dot" style="background:${colorFor(s.name)}"></i><b>${esc(s.name)}</b></span><small>${s.done}/${s.total} done (${s.total ? Math.round(s.done / s.total * 100) : 0}%)</small></div>`).join('') : '<div class="empty">No data yet.</div>';
  if (!window.Chart) return;
  const totalDone = stats.reduce((n, s) => n + s.done, 0);
  const dark = document.documentElement.dataset.theme === 'dark';
  const data = { labels: totalDone ? stats.map(s => s.name) : ['No tasks done yet'], datasets: [{ data: totalDone ? stats.map(s => s.done) : [1], backgroundColor: totalDone ? stats.map(s => colorFor(s.name)) : [dark ? '#2a313b' : '#e4e9ea'], borderWidth: 4, borderColor: dark ? '#1a1f26' : '#ffffff', hoverOffset: 14 }] };
  if (S.chart) { S.chart.data = data; S.chart.update(); return; }
  S.chart = new Chart($('#pie').getContext('2d'), { type: 'doughnut', data, options: { responsive: true, maintainAspectRatio: false, cutout: '62%', plugins: { legend: { display: false } } } });
}

/* ---------- modal framework ---------- */
function openModal(title, body) {
  $('#modalRoot').innerHTML = `<div class="overlay" data-act="overlay"><div class="modal" role="dialog" aria-modal="true"><div class="modal-head"><h2>${title}</h2><button class="icon-btn sm" data-act="close-modal" aria-label="Close">${ic('x')}</button></div><div class="modal-body">${body}</div></div></div>`;
}
const closeModal = () => { $('#modalRoot').innerHTML = ''; };

/* ---------- task form ---------- */
function optionList(values, selected, extra) {
  const set = [...values]; if (selected && !set.includes(selected)) set.push(selected);
  return set.map(v => `<option value="${esc(v)}" ${v === selected ? 'selected' : ''}>${esc(v)}</option>`).join('') + (extra || '');
}
function openTaskModal(id) {
  if (!S.team.length) { toast('Add a team member first', true); openListModal('team'); return; }
  const t = id ? S.tasks.find(x => x.id === id) : null; if (id && !t) return;
  const names = S.givenBy.map(g => g.name).sort((a, b) => a.localeCompare(b));
  openModal(t ? 'Edit task' : 'Create new task', `
    <div class="form">
      <div class="field"><label>Task name *</label><input id="fName" maxlength="200" placeholder="e.g. Social media campaign" value="${esc(t?.taskName || '')}"></div>
      <div class="row2">
        <div class="field"><label>Category</label><select id="fCat"><option value="">—</option>${optionList(S.categories.map(c => c.name), t?.category || '')}</select></div>
        <div class="field"><label>Manager *</label><select id="fWho">${optionList(S.team.map(m => m.name), t?.assignedTo || '')}</select></div>
      </div>
      <div class="row2">
        <div class="field"><label>Deadline</label><input id="fDue" type="date" value="${esc(t?.deadline || '')}"></div>
        <div class="field"><label>Status</label><select id="fSt">${optionList(STATUSES, t?.status || 'Pending')}</select></div>
      </div>
      <div class="field"><label>Given by</label>
        <select id="fGiven"><option value="">— Not set —</option>${optionList(names, t?.givenBy || '', '<option value="__new__">➕ Add new name…</option>')}</select>
        <input id="fGivenNew" class="hidden" maxlength="60" placeholder="Type the new name" style="margin-top:8px">
      </div>
      <div class="field"><label>Notes</label><textarea id="fNote" maxlength="1000" placeholder="Optional details">${esc(t?.description || '')}</textarea></div>
      <div class="form-actions"><button class="btn" data-act="close-modal">Cancel</button><button class="btn primary" id="saveBtn" data-act="save-task" data-id="${esc(id || '')}">Save</button></div>
    </div>`);
  setTimeout(() => $('#fName')?.focus(), 50);
}
async function saveTask(id) {
  const name = $('#fName').value.trim(); if (!name) { toast('Task name is required', true); return; }
  let given = $('#fGiven').value; if (given === '__new__') given = $('#fGivenNew').value.trim();
  const payload = { taskName: name, category: $('#fCat').value, assignedTo: $('#fWho').value, deadline: $('#fDue').value, status: $('#fSt').value, givenBy: given, description: $('#fNote').value.trim() };
  const btn = $('#saveBtn'); btn.disabled = true; btn.textContent = 'Saving…';
  try {
    const r = id ? await api('updateTask', { id, ...payload }) : await api('addTask', payload);
    if (id) { const i = S.tasks.findIndex(x => x.id === id); if (i > -1) S.tasks[i] = r.task; } else S.tasks.push(r.task);
    if (r.givenBy) S.givenBy = r.givenBy;
    closeModal(); renderAll(); toast(id ? 'Task updated' : 'Task added');
  } catch (e) { btn.disabled = false; btn.textContent = 'Save'; toast(e.message, true); }
}
async function quickDone(id) {
  const t = S.tasks.find(x => x.id === id); if (!t) return;
  const prev = t.status; t.status = 'Done'; renderAll();
  try { await api('updateStatus', { id, status: 'Done' }); toast('Marked as done ✓'); }
  catch (e) { t.status = prev; renderAll(); toast(e.message, true); }
}
async function deleteTask(id) {
  const t = S.tasks.find(x => x.id === id); if (!t || !confirm(`Delete "${t.taskName}"?`)) return;
  const idx = S.tasks.indexOf(t); S.tasks.splice(idx, 1); renderAll();
  try { await api('deleteTask', { id }); toast('Task deleted'); }
  catch (e) { S.tasks.splice(idx, 0, t); renderAll(); toast(e.message, true); }
}

/* ---------- lists: categories / team / given-by ---------- */
const LISTS = {
  categories: { title: 'Categories', ph: 'New category name', add: 'addCategory', del: 'deleteCategory', hint: '' },
  team: { title: 'Team members', ph: 'Member name', add: 'addTeamMember', del: 'deleteTeamMember', hint: 'Team members are the names you can assign tasks to.' },
  givenBy: { title: 'Given by names', ph: 'Name', add: 'addGivenBy', del: 'deleteGivenBy', hint: 'Names are saved automatically when you type a new one in the task form.' }
};
function openListModal(kind) {
  const L = LISTS[kind];
  openModal(L.title, `<div class="add-row"><input id="listInput" maxlength="60" placeholder="${L.ph}" data-enter="list-add" data-kind="${kind}"><button class="btn primary" data-act="list-add" data-kind="${kind}">Add</button></div><div class="list" id="listBody"></div>${L.hint ? `<p class="hint">${L.hint}</p>` : ''}`);
  renderList(kind);
}
function renderList(kind) {
  const body = $('#listBody'); if (!body) return;
  const items = [...S[kind]].sort((a, b) => a.name.localeCompare(b.name));
  body.innerHTML = items.length ? items.map(it => `<div class="li"><div class="li-main">${kind === 'team' ? avatar(it.name, 'sm') : ''}<span>${esc(it.name)}</span></div><button class="icon-btn sm" data-act="list-del" data-kind="${kind}" data-id="${esc(it.id)}" title="Delete">${ic('trash')}</button></div>`).join('') : '<div class="empty">Nothing here yet.</div>';
}
async function listAdd(kind) {
  const input = $('#listInput'); const name = input.value.trim(); if (!name) return;
  if (S[kind].some(i => i.name.toLowerCase() === name.toLowerCase())) { toast('Already in the list', true); return; }
  input.disabled = true;
  try { const r = await api(LISTS[kind].add, { name }); S[kind].push(r.item); input.value = ''; renderList(kind); renderFilters(); renderChart(); }
  catch (e) { toast(e.message, true); } finally { input.disabled = false; input.focus(); }
}
async function listDel(kind, id) {
  const it = S[kind].find(i => i.id === id); if (!it || !confirm(`Remove "${it.name}"?`)) return;
  try { await api(LISTS[kind].del, { id }); S[kind] = S[kind].filter(i => i.id !== id); renderList(kind); renderFilters(); }
  catch (e) { toast(e.message, true); }
}

/* ---------- menus ---------- */
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
function openManageModal() {
  const item = (act, kind, i, label) => `<button class="menu-item" data-act="${act}" ${kind ? `data-kind="${kind}"` : ''}><span class="m-ic">${ic(i)}</span>${label}</button>`;
  openModal('Manage', `<div class="menu-list">${item('open-list', 'categories', 'tag', 'Categories')}${item('open-list', 'team', 'users', 'Team members')}${item('open-list', 'givenBy', 'user', 'Given by names')}</div>`);
}
function openMeModal() {
  const warnOpts = [1, 2, 3, 4, 5, 7].map(n => `<option value="${n}" ${n === warnDays ? 'selected' : ''}>${n} day${n > 1 ? 's' : ''} before deadline</option>`).join('');
  const install = deferredInstall ? `<button class="menu-item" data-act="install"><span class="m-ic">${ic('download')}</span>Install app</button>`
    : (isIOS && !isStandalone() ? `<p class="hint">To install on iPhone: tap the Share button in Safari, then “Add to Home Screen”.</p>` : '');
  openModal('Settings', `
    <div class="menu-list">
      <button class="menu-item" data-act="toggle-theme"><span class="m-ic">${ic('moon')}</span>Dark / light mode</button>
      ${install}
    </div>
    <div class="field" style="margin-top:12px"><label>Deadline warning</label><select id="warnSel">${warnOpts}</select></div>`);
}

/* ---------- events ---------- */
const ACT = {
  'new-task': () => openTaskModal(), 'edit-task': el => openTaskModal(el.dataset.id),
  'save-task': el => saveTask(el.dataset.id || ''), 'done-task': el => quickDone(el.dataset.id), 'delete-task': el => deleteTask(el.dataset.id),
  'close-modal': closeModal, 'overlay': closeModal, 'retry': () => { $('#boot').innerHTML = '<img class="boot-mark" src="icons/logo-mark.png" alt=""><div class="spinner"></div>'; refresh(); },
  'refresh': () => refresh(true), 'toggle-theme': () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'),
  'page': el => { S.page = +el.dataset.p; renderTasks(); $('#tasksSection').scrollIntoView({ behavior: 'smooth', block: 'start' }); },
  'nav-home': () => { setNav('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); },
  'nav-tasks': () => { setNav('tasks'); $('#tasksSection').scrollIntoView({ behavior: 'smooth', block: 'start' }); },
  'toggle-alerts': () => { S.alertsOnly = !S.alertsOnly; S.page = 1; renderBanner(); renderTasks(); },
  'show-alerts': () => { S.alertsOnly = true; S.page = 1; renderBanner(); renderTasks(); $('#tasksSection').scrollIntoView({ behavior: 'smooth' }); },
  'open-list': el => openListModal(el.dataset.kind), 'list-add': el => listAdd(el.dataset.kind), 'list-del': el => listDel(el.dataset.kind, el.dataset.id),
  'open-manage': openManageModal, 'open-me': openMeModal,
  'install': async () => { if (!deferredInstall) return; deferredInstall.prompt(); await deferredInstall.userChoice; deferredInstall = null; closeModal(); }
};
function setNav(w) {
  $$('.nav-item[data-act="nav-home"], .nav-item[data-act="nav-tasks"]').forEach(b => b.classList.toggle('active', b.dataset.act === 'nav-' + w));
  $('#bnHome').classList.toggle('active', w === 'home'); $('#bnTasks').classList.toggle('active', w === 'tasks');
}
function bindEvents() {
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-act]'); if (!el) return;
    if (el.dataset.act === 'overlay' && e.target !== el) return;
    ACT[el.dataset.act]?.(el, e);
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
    if (e.key === 'Enter' && e.target.dataset?.enter) { e.preventDefault(); ACT[e.target.dataset.enter]?.(e.target); }
  });
  document.addEventListener('change', e => {
    const t = e.target;
    if (t.id === 'fGiven') { const n = $('#fGivenNew'); n.classList.toggle('hidden', t.value !== '__new__'); if (t.value === '__new__') n.focus(); }
    else if (t.id === 'warnSel') { warnDays = +t.value; LS.set('tm_warn', warnDays); renderBanner(); renderTasks(); }
    else if (t.classList.contains('filter')) { S.page = 1; renderTasks(); }
  });
  ['q', 'q2'].forEach(id => $('#' + id).addEventListener('input', e => { $('#q').value = $('#q2').value = e.target.value; S.page = 1; renderTasks(); }));
  document.addEventListener('visibilitychange', () => { if (!document.hidden && S.loaded && Date.now() - S.lastSync > 60000) refresh(); });
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredInstall = e; });
  window.addEventListener('appinstalled', () => { deferredInstall = null; });
}

/* ---------- init ---------- */
async function init() {
  hydrate(); bindEvents();
  setTheme(document.documentElement.dataset.theme || 'light');
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
  const cfg = window.CONFIG || {};
  if (!cfg.API_URL || /PASTE_/.test(cfg.API_URL)) { showScreen('setup'); return; }
  const cached = LS.get(cacheKey(), null);
  if (cached) { try { applyData(cached); showScreen('app'); renderAll(); } catch { LS.del(cacheKey()); } }
  refresh();
}
document.addEventListener('DOMContentLoaded', init);
