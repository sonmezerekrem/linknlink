// Background service worker for the extension
// Currently minimal - most logic is in popup.js

chrome.runtime.onInstalled.addListener(() => {
  console.log('LinknLink extension installed');
});

// Handle extension icon click (already handled by popup, but can add additional logic here)
chrome.action.onClicked.addListener((tab) => {
  // Popup will open automatically due to manifest.json action.default_popup
});
