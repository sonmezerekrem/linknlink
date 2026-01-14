// Content script to extract OpenGraph metadata from the current page

function extractPageData() {
  const getMetaProperty = (property) => {
    const meta = document.querySelector(`meta[property="${property}"]`) || 
                document.querySelector(`meta[name="${property}"]`);
    return meta ? meta.getAttribute('content') : null;
  };

  const getMetaName = (name) => {
    const meta = document.querySelector(`meta[name="${name}"]`);
    return meta ? meta.getAttribute('content') : null;
  };

  // Extract OpenGraph data
  const ogTitle = getMetaProperty('og:title');
  const ogDescription = getMetaProperty('og:description');
  const ogImage = getMetaProperty('og:image');
  const ogSiteName = getMetaProperty('og:site_name');

  // Fallback to standard meta tags
  const title = ogTitle || document.title || '';
  const description = ogDescription || getMetaName('description') || '';
  const image = ogImage ? (ogImage.startsWith('http') ? ogImage : new URL(ogImage, window.location.href).href) : '';
  const siteName = ogSiteName || '';

  return {
    url: window.location.href,
    title: title.trim(),
    description: description.trim(),
    image: image,
    siteName: siteName.trim()
  };
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getPageData') {
    try {
      const data = extractPageData();
      sendResponse(data);
    } catch (error) {
      console.error('Error extracting page data:', error);
      // Send fallback data on error
      sendResponse({
        url: window.location.href,
        title: document.title || 'Untitled',
        description: '',
        image: '',
        siteName: ''
      });
    }
    return true; // Keep message channel open for async response
  }
  return false;
});

// Also send data when page loads (for faster access)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // Data is extracted on-demand, no need to send immediately
  });
} else {
  // Page already loaded
}
