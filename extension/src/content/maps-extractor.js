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
    const seen = new Set();

    // All links pointing to a /maps/place/ URL — most reliable across Maps versions
    const allPlaceLinks = [...document.querySelectorAll('a[href*="/maps/place/"]')];

    for (const link of allPlaceLinks) {
      if (results.length >= 50) break;

      const href = link.href || '';
      if (!href.includes('/maps/place/')) continue;

      // Name: aria-label is most reliable, else first leaf text node inside link
      let name = link.getAttribute('aria-label')?.trim() || null;

      if (!name) {
        // Walk children to find first meaningful text-only node
        const leaves = [...link.querySelectorAll('*')].filter(el =>
          el.children.length === 0 &&
          el.textContent.trim().length > 1 &&
          el.textContent.trim().length < 100
        );
        name = leaves[0]?.textContent?.trim() || null;
      }

      if (!name || name.length < 2 || name.length > 120) continue;
      if (seen.has(name)) continue;
      seen.add(name);

      // Rating from aria-label on stars element within the card's parent container
      let rating = null;
      const parent = link.closest('[jsaction]') || link.parentElement;
      if (parent) {
        const ratingEl = parent.querySelector('[aria-label*="star"]');
        if (ratingEl) {
          const m = ratingEl.getAttribute('aria-label')?.match(/[\d.]+/);
          if (m) rating = parseFloat(m[0]);
        }
      }

      // Category: second leaf text after the name, short text
      let category = null;
      if (parent) {
        const leaves = [...parent.querySelectorAll('*')].filter(el =>
          el.children.length === 0 &&
          el.textContent.trim().length > 2 &&
          el.textContent.trim().length < 50 &&
          el.textContent.trim() !== name
        );
        const catEl = leaves.find(el => {
          const t = el.textContent.trim();
          return !t.match(/^\d/) && !t.includes('$') && !t.includes('·');
        });
        category = catEl?.textContent?.trim() || null;
      }

      results.push({
        name,
        category,
        rating,
        phone: null,
        website: null,
        address: null,
        mapsUrl: href,
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
      try {
        chrome.runtime.sendMessage({ action: 'business_detected', name: nameEl.textContent?.trim() });
      } catch {}
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
