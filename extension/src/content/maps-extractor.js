(function () {
  let lastExtracted = null;

  // ── Single business extract ──────────────────────────────────────────────
  function extractBusinessData() {
    const data = {};

    const nameEl = document.querySelector('h1.DUwDvf') ||
      document.querySelector('h1[class*="fontHeadlineLarge"]') ||
      document.querySelector('h1');
    data.name = nameEl?.textContent?.trim() || null;

    const phoneBtn = document.querySelector('[data-tooltip="Copy phone number"]');
    if (phoneBtn) {
      data.phone = phoneBtn.getAttribute('aria-label')?.replace('Phone: ', '').trim() || null;
    } else {
      const telLink = document.querySelector('a[href^="tel:"]');
      data.phone = telLink ? telLink.href.replace('tel:', '') : null;
    }

    const websiteBtn = document.querySelector('a[data-tooltip="Open website"]');
    if (websiteBtn) {
      data.website = websiteBtn.href || null;
    } else {
      const websiteLink = [...document.querySelectorAll('a[href]')].find(a =>
        a.getAttribute('data-item-id') === 'authority' ||
        a.getAttribute('aria-label')?.toLowerCase().includes('website')
      );
      data.website = websiteLink?.href || null;
    }

    const addressBtn = document.querySelector('[data-tooltip="Copy address"]');
    if (addressBtn) {
      data.address = addressBtn.getAttribute('aria-label')?.replace('Address: ', '').trim() || null;
    } else {
      const addressEl = document.querySelector('[data-item-id="address"]');
      data.address = addressEl?.textContent?.trim() || null;
    }

    const categoryEl = document.querySelector('button.DkEaL') ||
      document.querySelector('[jsaction*="category"]');
    data.category = categoryEl?.textContent?.trim() || null;

    const ratingEl = document.querySelector('[aria-label*="stars"]');
    if (ratingEl) {
      const match = ratingEl.getAttribute('aria-label')?.match(/[\d.]+/);
      data.rating = match ? parseFloat(match[0]) : null;
    }

    const reviewEl = document.querySelector('[aria-label*="reviews"]');
    if (reviewEl) {
      const match = reviewEl.getAttribute('aria-label')?.match(/[\d,]+/);
      data.reviewCount = match ? parseInt(match[0].replace(',', '')) : null;
    }

    data.mapsUrl = window.location.href;
    data.extractedAt = new Date().toISOString();
    return data;
  }

  // ── Bulk extract: all business cards in search results list ─────────────
  function extractAllBusinesses() {
    const results = [];
    // Google Maps result cards — multiple selector strategies
    const cardSelectors = [
      'a[href*="/maps/place/"]',
      '[role="article"]',
      '.Nv2PK',
      '[data-result-index]',
    ];

    let cards = [];
    for (const sel of cardSelectors) {
      const found = [...document.querySelectorAll(sel)];
      if (found.length > 2) { cards = found; break; }
    }

    const seen = new Set();
    for (const card of cards.slice(0, 50)) {
      // Name
      const nameEl = card.querySelector('.qBF1Pd, .fontHeadlineSmall, h3, [class*="fontHeadline"]') ||
        card.querySelector('div[class*="fontBody"] + div') ||
        card;
      const name = nameEl?.textContent?.trim();
      if (!name || seen.has(name) || name.length < 2) continue;
      seen.add(name);

      // Category
      const spans = [...card.querySelectorAll('span, div')].filter(el => el.children.length === 0);
      const category = spans.find(s => s.textContent?.trim().length > 2 && s.textContent?.trim().length < 40 && s !== nameEl)?.textContent?.trim() || null;

      // Rating
      let rating = null;
      const ratingEl = card.querySelector('[aria-label*="stars"]') ||
        card.querySelector('span[aria-hidden]');
      if (ratingEl) {
        const m = (ratingEl.getAttribute('aria-label') || ratingEl.textContent)?.match(/[\d.]+/);
        if (m) rating = parseFloat(m[0]);
      }

      // Maps URL
      const linkEl = card.tagName === 'A' ? card : card.querySelector('a[href*="/maps/place/"]');
      const mapsUrl = linkEl?.href || null;

      results.push({
        name,
        category,
        rating,
        phone: null,
        website: null,
        address: null,
        mapsUrl,
        extractedAt: new Date().toISOString(),
      });
    }

    return results;
  }

  // ── Message listener ─────────────────────────────────────────────────────
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'extract') {
      const data = extractBusinessData();
      lastExtracted = data;
      sendResponse({ success: !!data.name, data });
    }

    if (request.action === 'extract_all') {
      const businesses = extractAllBusinesses();
      sendResponse({ success: businesses.length > 0, businesses, count: businesses.length });
    }

    if (request.action === 'ping') {
      sendResponse({ success: true });
    }

    return true;
  });

  // Auto-detect panel changes
  const observer = new MutationObserver(() => {
    const nameEl = document.querySelector('h1.DUwDvf');
    if (nameEl && nameEl.textContent !== lastExtracted?.name) {
      chrome.runtime.sendMessage({ action: 'business_detected', name: nameEl.textContent?.trim() });
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
