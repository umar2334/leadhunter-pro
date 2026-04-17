// LeadHunter Pro — Popup script (vanilla JS, no framework needed)

const API_BASE = 'https://leadhunter-api.railway.app'; // Update after deploy
const body = document.getElementById('mainBody');
const savedCountEl = document.getElementById('savedCount');

let currentLead = null;

// ─── Init ──────────────────────────────────────────────────────────────────
async function init() {
  updateSavedCount();

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab?.url?.includes('google.com/maps')) {
    renderNotMaps();
    return;
  }

  renderExtractReady(tab);
}

// ─── Renderers ─────────────────────────────────────────────────────────────
function renderNotMaps() {
  body.innerHTML = `
    <div class="not-maps">
      <div class="not-maps-icon">🗺️</div>
      <div class="not-maps-title">Open Google Maps first</div>
      <div class="not-maps-sub">
        Navigate to <strong>google.com/maps</strong>, search for a business type,
        then click a business to see its detail panel — then come back here.
      </div>
    </div>
  `;
}

function renderExtractReady(tab) {
  body.innerHTML = `
    <div class="status-msg">Click a business on Maps, then extract</div>
    <button class="btn btn-primary" id="extractBtn">🔍 Extract This Business</button>
    ${renderRecentLeads()}
  `;
  document.getElementById('extractBtn').addEventListener('click', () => doExtract(tab));
}

function renderLoading(message) {
  body.innerHTML = `
    <div class="loader">
      <div class="spinner"></div>
      <div class="loader-text">${message}</div>
    </div>
  `;
}

function renderLeadCard(lead) {
  const { name, phone, address, category, website, analysis, opportunity_type, rating, reviewCount } = lead;

  let badgeHtml = '';
  let analysisHtml = '';

  if (opportunity_type === 'no_website') {
    badgeHtml = `<div class="badge badge-fire">🔥 HIGH OPPORTUNITY — No Website</div>`;
  } else if (opportunity_type === 'weak_website') {
    const score = analysis?.score ?? 0;
    const fill = Math.max(score, 4);
    const color = score < 40 ? '#ef4444' : score < 65 ? '#f97316' : '#eab308';
    badgeHtml = `<div class="badge badge-weak">⚠️ Weak Website — Score: ${score}/100</div>`;
    analysisHtml = `
      <div class="score-row">
        <span class="score-label">Website Score</span>
        <div class="score-bar"><div class="score-fill" style="width:${fill}%;background:${color}"></div></div>
        <span class="score-num">${score}/100</span>
      </div>
      ${analysis?.issues?.length ? `
        <div class="issues">
          ${analysis.issues.slice(0, 4).map(i => `<div class="issue-item">${i}</div>`).join('')}
        </div>
      ` : ''}
      <div class="summary">"${analysis?.summary || ''}"</div>
    `;
  } else {
    const score = analysis?.score ?? 0;
    badgeHtml = `<div class="badge badge-ok">✅ Has Website — Score: ${score}/100</div>`;
  }

  body.innerHTML = `
    <div class="card">
      <div class="business-name">${escHtml(name || 'Unknown Business')}</div>
      <div class="business-meta">
        ${category ? `🏷 ${escHtml(category)}` : ''}
        ${address ? `&nbsp;· 📍 ${escHtml(address)}` : ''}
        ${phone ? `<br>📞 ${escHtml(phone)}` : ''}
        ${rating ? `<br>⭐ ${rating}${reviewCount ? ` (${reviewCount} reviews)` : ''}` : ''}
        ${website ? `<br>🌐 <a href="${escHtml(website)}" target="_blank" style="color:#6366f1;font-size:10px">${truncate(website, 40)}</a>` : ''}
      </div>
      ${badgeHtml}
      ${analysisHtml}
    </div>

    <button class="btn btn-success" id="saveBtn">💾 Save to Dashboard</button>
    <button class="btn btn-secondary" id="reExtractBtn">↩ Extract Different Business</button>
  `;

  document.getElementById('saveBtn').addEventListener('click', doSave);
  document.getElementById('reExtractBtn').addEventListener('click', () => {
    currentLead = null;
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => renderExtractReady(tab));
  });
}

function renderSaved(lead) {
  body.innerHTML = `
    <div class="card" style="text-align:center;padding:20px">
      <div style="font-size:24px;margin-bottom:8px">✅</div>
      <div style="font-size:14px;font-weight:700;color:#4ade80">Saved!</div>
      <div style="font-size:12px;color:#64748b;margin-top:4px">${escHtml(lead.name)} added to dashboard</div>
    </div>
    <button class="btn btn-primary" style="margin-top:10px" id="openDashBtn">Open Dashboard</button>
    <button class="btn btn-secondary" id="anotherBtn">Extract Another</button>
  `;
  updateSavedCount();

  document.getElementById('openDashBtn').addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://leadhunter-dashboard.vercel.app' });
  });
  document.getElementById('anotherBtn').addEventListener('click', () => {
    currentLead = null;
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => renderExtractReady(tab));
  });
}

// ─── Actions ───────────────────────────────────────────────────────────────
async function doExtract(tab) {
  renderLoading('Reading business data...');

  let rawData;
  try {
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'extract' });
    if (!response?.success || !response?.data?.name) {
      body.innerHTML = `
        <div class="not-maps" style="padding:16px">
          <div class="not-maps-icon">⚠️</div>
          <div class="not-maps-title">No business panel found</div>
          <div class="not-maps-sub">Click on a specific business listing on Maps first, then try again.</div>
          <button class="btn btn-primary" style="margin-top:10px;width:100%" id="retryBtn">Retry</button>
        </div>
      `;
      document.getElementById('retryBtn').addEventListener('click', () => doExtract(tab));
      return;
    }
    rawData = response.data;
  } catch {
    body.innerHTML = `<div class="not-maps"><div class="not-maps-icon">❌</div><div class="not-maps-title">Could not read page</div><div class="not-maps-sub">Reload the Maps tab and try again.</div></div>`;
    return;
  }

  renderLoading('Analyzing website...');

  try {
    const result = await fetchWithTimeout(`${API_BASE}/leads/extract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rawData),
    }, 20000);

    currentLead = result;
    chrome.runtime.sendMessage({ action: 'clear_badge' });
    renderLeadCard(currentLead);
  } catch {
    // Fallback: show raw data without analysis if backend unavailable
    rawData.opportunity_type = rawData.website ? 'has_website' : 'no_website';
    rawData.analysis = { score: 0, issues: [], summary: 'Backend unavailable — analysis skipped.' };
    currentLead = rawData;
    renderLeadCard(currentLead);
  }
}

async function doSave() {
  if (!currentLead) return;
  document.getElementById('saveBtn').disabled = true;
  document.getElementById('saveBtn').textContent = 'Saving...';

  // Always save locally as fallback
  await storeLeadLocally(currentLead);

  try {
    await fetchWithTimeout(`${API_BASE}/leads/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(currentLead),
    }, 8000);
  } catch {
    // Local save already done — backend sync will happen later
  }

  renderSaved(currentLead);
}

// ─── Helpers ──────────────────────────────────────────────────────────────
async function fetchWithTimeout(url, options, ms) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch (e) {
    clearTimeout(id);
    throw e;
  }
}

async function storeLeadLocally(lead) {
  return new Promise((resolve) => {
    chrome.storage.local.get(['leads'], (result) => {
      const leads = result.leads || [];
      const exists = leads.find((l) => l.mapsUrl === lead.mapsUrl);
      if (!exists) leads.unshift({ ...lead, savedAt: new Date().toISOString() });
      chrome.storage.local.set({ leads: leads.slice(0, 500) }, resolve);
    });
  });
}

async function updateSavedCount() {
  chrome.storage.local.get(['leads'], (result) => {
    const count = (result.leads || []).length;
    savedCountEl.textContent = `${count} saved`;
  });
}

function renderRecentLeads() {
  return `<div id="recentSection"></div>`;
}

async function loadRecentLeads() {
  chrome.storage.local.get(['leads'], (result) => {
    const leads = (result.leads || []).slice(0, 3);
    if (!leads.length) return;

    const section = document.getElementById('recentSection');
    if (!section) return;

    const badgeClass = { no_website: 'rb-fire', weak_website: 'rb-weak', has_website: 'rb-ok' };
    const badgeLabel = { no_website: '🔥 No Site', weak_website: '⚠️ Weak', has_website: '✅ OK' };

    section.innerHTML = `
      <div class="recent-section">
        <div class="recent-title">Recent Leads</div>
        ${leads.map(l => `
          <div class="recent-item">
            <div>
              <div class="recent-name">${escHtml(l.name || 'Unknown')}</div>
              <div class="recent-type">${escHtml(l.category || l.address || '')}</div>
            </div>
            <span class="recent-badge ${badgeClass[l.opportunity_type] || 'rb-ok'}">
              ${badgeLabel[l.opportunity_type] || '?'}
            </span>
          </div>
        `).join('')}
      </div>
    `;
  });
}

function escHtml(str) {
  return String(str || '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );
}

function truncate(str, max) {
  return str.length > max ? str.slice(0, max) + '…' : str;
}

// ─── Start ────────────────────────────────────────────────────────────────
init().then(() => loadRecentLeads());
