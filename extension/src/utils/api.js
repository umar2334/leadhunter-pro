const API_BASE = 'https://leadhunter-api.railway.app'; // Update after deploy

export async function extractAndAnalyzeLead(leadData) {
  const res = await fetch(`${API_BASE}/leads/extract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(leadData),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function saveLead(leadData) {
  const res = await fetch(`${API_BASE}/leads/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(leadData),
  });
  if (!res.ok) throw new Error(`Save error: ${res.status}`);
  return res.json();
}

export async function getStoredLeads() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['leads'], (result) => {
      resolve(result.leads || []);
    });
  });
}

export async function storeLeadLocally(lead) {
  return new Promise((resolve) => {
    chrome.storage.local.get(['leads'], (result) => {
      const leads = result.leads || [];
      // Avoid duplicates by mapsUrl
      const exists = leads.find((l) => l.mapsUrl === lead.mapsUrl);
      if (!exists) leads.unshift(lead);
      chrome.storage.local.set({ leads: leads.slice(0, 500) }, resolve);
    });
  });
}
