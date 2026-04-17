// Background service worker — handles cross-tab messaging and storage sync

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'business_detected') {
    // Badge the extension icon to notify user a business is ready
    chrome.action.setBadgeText({ text: '!', tabId: sender.tab?.id });
    chrome.action.setBadgeBackgroundColor({ color: '#6366f1' });
  }

  if (message.action === 'clear_badge') {
    chrome.action.setBadgeText({ text: '' });
  }

  return true;
});

// Clear badge when user navigates away from a business listing
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.url && !changeInfo.url.includes('/place/')) {
    chrome.action.setBadgeText({ text: '', tabId });
  }
});
