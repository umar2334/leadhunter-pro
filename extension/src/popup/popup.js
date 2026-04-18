const API_BASE = 'https://leadhunter-pro-production.up.railway.app';
const SUPABASE_URL = 'https://foneqqcjjqkfecozwxoo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvbmVxcWNqanFrZmVjb3p3eG9vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0MDk5MDUsImV4cCI6MjA5MTk4NTkwNX0.-N1Ur9VGL2G8Sc6JsklGBplppmiCJ3vKWKlDkQAALOk';

const body = document.getElementById('mainBody');
const savedCountEl = document.getElementById('savedCount');
let currentLead = null;
let authToken = null;

async function getStoredAuth() {
  return new Promise(resolve => {
    chrome.storage.local.get(['auth_token', 'auth_email'], result => {
      resolve({ token: result.auth_token || null, email: result.auth_email || null });
    });
  });
}

async function signIn(email, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || data.msg || 'Login failed');
  return data.access_token;
}

async function signOut() {
  await chrome.storage.local.remove(['auth_token', 'auth_email']);
  authToken = null;
  renderLoginForm();
}

function renderLoginForm(error = '') {
  body.innerHTML = `
    <div style="padding:16px">
      <div style="font-size:13px;font-weight:700;color:#1a202c;margin-bottom:4px">Sign In</div>
      <div style="font-size:11px;color:#718096;margin-bottom:14px">Use your LeadHunter dashboard credentials</div>
      ${error ? `<div style="font-size:11px;color:#dc2626;background:#fef2f2;border:1px solid #fca5a5;border-radius:6px;padding:7px 10px;margin-bottom:10px">${escHtml(error)}</div>` : ''}
      <input id="loginEmail" type="email" placeholder="Email" style="width:100%;padding:8px 10px;border:1.5px solid #e8eaf0;border-radius:7px;font-size:12px;font-family:inherit;margin-bottom:8px;outline:none;color:#1a202c" />
      <input id="loginPassword" type="password" placeholder="Password" style="width:100%;padding:8px 10px;border:1.5px solid #e8eaf0;border-radius:7px;font-size:12px;font-family:inherit;margin-bottom:12px;outline:none;color:#1a202c" />
      <button class="btn btn-primary" id="loginBtn">Sign In</button>
    </div>
  `;
  document.getElementById('loginBtn').addEventListener('click', async () => {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    if (!email || !password) return;
    document.getElementById('loginBtn').disabled = true;
    document.getElementById('loginBtn').textContent = 'Signing in...';
    try {
      const token = await signIn(email, password);
      authToken = token;
      await chrome.storage.local.set({ auth_token: token, auth_email: email });
      init();
    } catch (err) {
      renderLoginForm(err.message);
    }
  });
}

async function init() {
  const stored = await getStoredAuth();
  authToken = stored.token;
  if (!authToken) { renderLoginForm(); return; }
  updateSavedCount();
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url?.includes('google.com/maps')) { renderNotMaps(); return; }
  renderExtractReady(tab);
}

function renderNotMaps() {
  body.innerHTML = `<div class="not-maps"><div class="not-maps-icon">🗺️</div><div class="not-maps-title">Open Google Maps first</div><div class="not-maps-sub">Navigate to <strong>google.com/maps</strong>, search for businesses, then use the buttons below.</div></div>${renderSignOutLink()}`;
}

function renderSignOutLink() {
  const div = document.createElement('div');
  div.style.cssText = 'text-align:center;padding:8px 0 4px';
  div.innerHTML = `<button id="signOutBtn" style="font-size:10px;color:#a0aec0;background:none;border:none;cursor:pointer;font-family:inherit;text-decoration:underline">Sign out</button>`;
  setTimeout(() => document.getElementById('signOutBtn')?.addEventListener('click', signOut), 0);
  return div.outerHTML;
}

function renderExtractReady(tab) {
  body.innerHTML = `
    <div class="status-msg">Click a business to extract its full details, or bulk-extract all visible results.</div>
    <button class="btn btn-primary" id="extractBtn">🔍 Extract This Business</button>
    <button class="btn btn-bulk" id="bulkBtn">⚡ Bulk Extract All (up to 50)</button>
    ${renderRecentLeads()}
  `;
  document.getElementById('extractBtn').addEventListener('click', () => doExtract(tab));
  document.getElementById('bulkBtn').addEventListener('click', () => doBulkExtract(tab));
}

function renderLoading(message) {
  body.innerHTML = `<div class="loader"><div class="spinner"></div><div class="loader-text">${message}</div></div>`;
}

function renderLeadCard(lead) {
  const { name, phone, address, category, website, analysis, opportunity_type, rating, reviewCount, email, whatsapp_number, website_phone } = lead;
  let badgeHtml = '';
  let analysisHtml = '';

  if (opportunity_type === 'no_website') {
    badgeHtml = `<div class="badge badge-fire">🔥 High Opportunity — No Website</div>`;
  } else {
    const score = analysis?.score ?? 0;
    const fill = Math.max(score, 3);
    const color = score < 40 ? '#ef4444' : score < 65 ? '#f97316' : '#10b981';
    badgeHtml = opportunity_type === 'weak_website'
      ? `<div class="badge badge-weak">⚠️ Weak Website</div>`
      : `<div class="badge badge-ok">✅ Has Website</div>`;
    analysisHtml = `
      <div class="score-section">
        <div class="score-header">
          <span class="score-label">Website Score</span>
          <span class="score-num" style="color:${color}">${score}</span>
        </div>
        <div class="score-track"><div class="score-fill" style="width:${fill}%;background:${color}"></div></div>
      </div>
      ${analysis?.issues?.length ? `<div class="issues">${analysis.issues.slice(0, 3).map(i => `<div class="issue-row">${escHtml(i)}</div>`).join('')}</div>` : ''}
      ${analysis?.summary ? `<div class="summary">"${escHtml(analysis.summary)}"</div>` : ''}
    `;
  }

  body.innerHTML = `
    <div class="card">
      <div class="biz-name">${escHtml(name || 'Unknown Business')}</div>
      ${category ? `<div class="biz-row"><span class="icon">🏷</span>${escHtml(category)}</div>` : ''}
      ${address ? `<div class="biz-row"><span class="icon">📍</span>${escHtml(address)}</div>` : ''}
      ${phone ? `<div class="biz-row"><span class="icon">📞</span>${escHtml(phone)}${website_phone && website_phone !== phone ? `<span style="font-size:10px;background:#fff7ed;color:#c2410c;border:1px solid #fdba74;border-radius:4px;padding:1px 6px;font-weight:700;margin-left:6px">⚠️ Site: ${escHtml(website_phone)}</span>` : ''}</div>` : ''}
      ${whatsapp_number ? `<div class="biz-row"><span class="icon">💬</span><a href="https://wa.me/${whatsapp_number.replace(/\D/g,'')}" target="_blank" style="color:#16a34a;font-weight:700">${escHtml(whatsapp_number)}</a></div>` : ''}
      ${email ? `<div class="biz-row"><span class="icon">📧</span><span class="biz-email">${escHtml(email)}</span></div>` : ''}
      ${rating ? `<div class="biz-row"><span class="icon">⭐</span>${rating}${reviewCount ? ` (${reviewCount} reviews)` : ''}</div>` : ''}
      ${website ? `<div class="biz-row"><span class="icon">🌐</span><a href="${escHtml(website)}" target="_blank">${truncate(website.replace(/^https?:\/\//, ''), 32)}</a></div>` : ''}
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
    <div class="success-card">
      <div class="success-icon">✅</div>
      <div class="success-title">Saved!</div>
      <div class="success-sub" style="color:#4a5568">${escHtml(lead.name)} added to dashboard</div>
    </div>
    <button class="btn btn-primary" style="margin-top:10px" id="openDashBtn">📊 Open Dashboard</button>
    <button class="btn btn-secondary" id="anotherBtn">Extract Another</button>
  `;
  updateSavedCount();
  document.getElementById('openDashBtn').addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://leadhunter-pro-pied.vercel.app' });
  });
  document.getElementById('anotherBtn').addEventListener('click', () => {
    currentLead = null;
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => renderExtractReady(tab));
  });
}

function renderBulkResult(saved, total) {
  body.innerHTML = `
    <div class="success-card">
      <div class="success-icon">⚡</div>
      <div class="success-title">${saved} Leads Saved!</div>
      <div class="success-sub" style="color:#4a5568">Extracted ${total} businesses from the search results</div>
    </div>
    <button class="btn btn-primary" style="margin-top:10px" id="openDashBtn">📊 Open Dashboard</button>
    <button class="btn btn-secondary" id="anotherBtn">Extract More</button>
  `;
  updateSavedCount();
  document.getElementById('openDashBtn').addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://leadhunter-pro-pied.vercel.app' });
  });
  document.getElementById('anotherBtn').addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => renderExtractReady(tab));
  });
}

// ── Actions ────────────────────────────────────────────────────────────────
async function doExtract(tab) {
  renderLoading('Reading business data...');
  let rawData;
  try {
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'extract' });
    if (!response?.success || !response?.data?.name) {
      body.innerHTML = `<div class="not-maps" style="padding:16px"><div class="not-maps-icon">⚠️</div><div class="not-maps-title">No business panel found</div><div class="not-maps-sub">Click on a specific business listing on Maps first, then try again.</div><button class="btn btn-primary" style="margin-top:10px;width:100%" id="retryBtn">Retry</button></div>`;
      document.getElementById('retryBtn').addEventListener('click', () => doExtract(tab));
      return;
    }
    rawData = response.data;
  } catch {
    body.innerHTML = `<div class="not-maps"><div class="not-maps-icon">❌</div><div class="not-maps-title">Could not read page</div><div class="not-maps-sub">Reload the Maps tab and try again.</div></div>`;
    return;
  }

  renderLoading('Analyzing website & finding email...');
  try {
    const result = await fetchWithTimeout(`${API_BASE}/leads/extract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}) },
      body: JSON.stringify(rawData),
    }, 25000);
    currentLead = result;
    chrome.runtime.sendMessage({ action: 'clear_badge' });
    renderLeadCard(currentLead);
  } catch {
    rawData.opportunity_type = rawData.website ? 'has_website' : 'no_website';
    rawData.analysis = { score: 0, issues: [], summary: 'Backend unavailable — analysis skipped.' };
    currentLead = rawData;
    renderLeadCard(currentLead);
  }
}

async function doBulkExtract(tab) {
  renderLoading('Scanning all businesses on page...');
  let businesses = [];
  try {
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'extract_all' });
    if (!response?.success || !response?.businesses?.length) {
      body.innerHTML = `<div class="not-maps" style="padding:16px"><div class="not-maps-icon">⚠️</div><div class="not-maps-title">No businesses found in list</div><div class="not-maps-sub">Search for a business type (e.g. "clinics in Dubai") and make sure the results list is visible, then try again.</div><button class="btn btn-primary" style="margin-top:10px;width:100%" id="retryBtn">Retry</button></div>`;
      document.getElementById('retryBtn').addEventListener('click', () => {
        chrome.tabs.query({ active: true, currentWindow: true }, ([t]) => doBulkExtract(t));
      });
      return;
    }
    businesses = response.businesses;
  } catch {
    body.innerHTML = `<div class="not-maps"><div class="not-maps-icon">❌</div><div class="not-maps-title">Error reading page</div><div class="not-maps-sub">Reload Maps and try again.</div></div>`;
    return;
  }

  renderLoading(`Saving ${businesses.length} leads to dashboard...`);

  // Mark all as no_website initially (no detail data from list view)
  const rows = businesses.map(b => ({
    ...b,
    opportunity_type: 'no_website',
    analysis_score: 0,
    analysis_issues: ['Bulk extracted — click lead to analyze website'],
    analysis_summary: 'Extracted from search results list. Open lead detail to run full analysis.',
  }));

  // Save locally
  for (const row of rows) await storeLeadLocally(row);

  // Send to backend
  try {
    const result = await fetchWithTimeout(`${API_BASE}/leads/bulk-save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}) },
      body: JSON.stringify({ leads: rows }),
    }, 15000);
    renderBulkResult(result.saved || rows.length, businesses.length);
  } catch {
    renderBulkResult(rows.length, businesses.length);
  }
}

async function doSave() {
  if (!currentLead) return;
  document.getElementById('saveBtn').disabled = true;
  document.getElementById('saveBtn').textContent = 'Saving...';
  await storeLeadLocally(currentLead);
  try {
    await fetchWithTimeout(`${API_BASE}/leads/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}) },
      body: JSON.stringify(currentLead),
    }, 8000);
  } catch {}
  renderSaved(currentLead);
}

// ── Helpers ────────────────────────────────────────────────────────────────
async function fetchWithTimeout(url, options, ms) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch (e) { clearTimeout(id); throw e; }
}

async function storeLeadLocally(lead) {
  return new Promise((resolve) => {
    chrome.storage.local.get(['leads'], (result) => {
      const leads = result.leads || [];
      const exists = leads.find((l) => l.mapsUrl === lead.mapsUrl && lead.mapsUrl);
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
            <span class="recent-badge ${badgeClass[l.opportunity_type] || 'rb-ok'}">${badgeLabel[l.opportunity_type] || '?'}</span>
          </div>`).join('')}
      </div>`;
  });
}


function escHtml(str) {
  return String(str || '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function truncate(str, max) {
  return str.length > max ? str.slice(0, max) + '…' : str;
}

init().then(() => loadRecentLeads());
