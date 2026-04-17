// Runs on google.com/maps — reads the business detail panel DOM

(function () {
  let lastExtracted = null;

  function extractBusinessData() {
    const data = {};

    // Business name — multiple selector fallbacks for Maps DOM changes
    const nameEl =
      document.querySelector('h1.DUwDvf') ||
      document.querySelector('h1[class*="fontHeadlineLarge"]') ||
      document.querySelector('[data-attrid="title"] span') ||
      document.querySelector('h1');
    data.name = nameEl?.textContent?.trim() || null;

    // Phone
    const phoneBtn = document.querySelector('[data-tooltip="Copy phone number"]');
    if (phoneBtn) {
      data.phone = phoneBtn.getAttribute('aria-label')?.replace('Phone: ', '').trim() || null;
    } else {
      // Fallback: look for tel: links
      const telLink = document.querySelector('a[href^="tel:"]');
      data.phone = telLink ? telLink.href.replace('tel:', '') : null;
    }

    // Website
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

    // Address
    const addressBtn = document.querySelector('[data-tooltip="Copy address"]');
    if (addressBtn) {
      data.address = addressBtn.getAttribute('aria-label')?.replace('Address: ', '').trim() || null;
    } else {
      const addressEl = document.querySelector('[data-item-id="address"]');
      data.address = addressEl?.textContent?.trim() || null;
    }

    // Category (business type)
    const categoryEl =
      document.querySelector('button.DkEaL') ||
      document.querySelector('[jsaction*="category"]') ||
      document.querySelector('[class*="category"]');
    data.category = categoryEl?.textContent?.trim() || null;

    // Rating
    const ratingEl = document.querySelector('[aria-label*="stars"]');
    if (ratingEl) {
      const match = ratingEl.getAttribute('aria-label')?.match(/[\d.]+/);
      data.rating = match ? parseFloat(match[0]) : null;
    }

    // Review count
    const reviewEl = document.querySelector('[aria-label*="reviews"]');
    if (reviewEl) {
      const match = reviewEl.getAttribute('aria-label')?.match(/[\d,]+/);
      data.reviewCount = match ? parseInt(match[0].replace(',', '')) : null;
    }

    data.mapsUrl = window.location.href;
    data.extractedAt = new Date().toISOString();

    return data;
  }

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'extract') {
      const data = extractBusinessData();
      lastExtracted = data;
      sendResponse({ success: !!data.name, data });
    }

    if (request.action === 'ping') {
      sendResponse({ success: true });
    }

    return true;
  });

  // Auto-detect when a new business panel opens
  const observer = new MutationObserver(() => {
    const nameEl = document.querySelector('h1.DUwDvf');
    if (nameEl && nameEl.textContent !== lastExtracted?.name) {
      chrome.runtime.sendMessage({ action: 'business_detected', name: nameEl.textContent?.trim() });
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
})();
