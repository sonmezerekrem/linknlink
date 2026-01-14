// State
let currentTab = null;
let pageData = null;
let authToken = null;
let apiBaseUrl = null;
let authCheckInterval = null;

// DOM Elements
const loginScreen = document.getElementById('login-screen');
const mainScreen = document.getElementById('main-screen');
const loginBtn = document.getElementById('login-btn');
const saveForm = document.getElementById('save-form');
const loading = document.getElementById('loading');
const bookmarkForm = document.getElementById('bookmark-form');
const loginStatus = document.getElementById('login-status');

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  // Check if user is authenticated
  const stored = await chrome.storage.local.get(['authData', 'apiBaseUrl', 'user']);
  
  if (stored.authData && stored.apiBaseUrl) {
    // Verify auth is still valid
    const isValid = await verifyAuth(stored.apiBaseUrl, stored.authData);
    if (isValid) {
      authToken = stored.authData.token;
      apiBaseUrl = stored.apiBaseUrl;
      showMainScreen();
      loadCurrentPage();
      return;
    } else {
      // Auth expired, clear it
      await chrome.storage.local.remove(['authData', 'user']);
    }
  }
  
  // Pre-fill API URL if exists
  if (stored.apiBaseUrl) {
    document.getElementById('api-url').value = stored.apiBaseUrl;
  }
  showLoginScreen();

  // Event listeners
  loginBtn.addEventListener('click', handleLoginClick);
  saveForm.addEventListener('submit', handleSave);
  document.getElementById('logout-btn').addEventListener('click', handleLogout);
  
  // Check for auth on popup open (in case user just logged in)
  checkAuthFromCookies();
  
  // Cleanup on popup close
  window.addEventListener('beforeunload', () => {
    if (authCheckInterval) {
      clearInterval(authCheckInterval);
      authCheckInterval = null;
    }
  });
});

function showLoginScreen() {
  loginScreen.classList.remove('hidden');
  mainScreen.classList.add('hidden');
}

function showMainScreen() {
  loginScreen.classList.add('hidden');
  mainScreen.classList.remove('hidden');
}

async function loadCurrentPage() {
  try {
    loading.classList.remove('hidden');
    bookmarkForm.classList.add('hidden');
    hideMessages();

    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    currentTab = tab;

    if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('edge://')) {
      showSaveError('Cannot save this page');
      loading.classList.add('hidden');
      bookmarkForm.classList.remove('hidden');
      return;
    }

    // Get page data from content script
    try {
      const results = await chrome.tabs.sendMessage(tab.id, { action: 'getPageData' });
      pageData = results;
      displayPreview(results);
    } catch (error) {
      // Fallback: use tab data
      pageData = {
        url: tab.url,
        title: tab.title || 'Untitled',
        description: '',
        image: '',
        siteName: ''
      };
      displayPreview(pageData);
    }
  } catch (error) {
    console.error('Error loading page:', error);
    showSaveError('Failed to load page data');
    loading.classList.add('hidden');
    bookmarkForm.classList.remove('hidden');
  }
}

function displayPreview(data) {
  const titleEl = document.getElementById('preview-title');
  const descEl = document.getElementById('preview-description');
  const urlEl = document.getElementById('preview-url');
  const imageEl = document.getElementById('preview-image');

  titleEl.textContent = data.title || 'Untitled';
  descEl.textContent = data.description || '';
  urlEl.textContent = data.url;

  if (data.image) {
    imageEl.style.backgroundImage = `url(${data.image})`;
    imageEl.classList.add('has-image');
  } else {
    imageEl.classList.remove('has-image');
  }
}

// Validate and sanitize URL
function validateApiUrl(url) {
  try {
    const parsed = new URL(url);
    
    // Enforce HTTPS only (except localhost for development)
    if (parsed.protocol !== 'https:' && parsed.hostname !== 'localhost' && !parsed.hostname.startsWith('127.0.0.1')) {
      throw new Error('Only HTTPS URLs are allowed (except localhost for development)');
    }
    
    // Block file:// and other dangerous protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Invalid URL protocol');
    }
    
    // Basic hostname validation
    if (!parsed.hostname || parsed.hostname.length > 253) {
      throw new Error('Invalid hostname');
    }
    
    return parsed.href.replace(/\/+$/, ''); // Remove trailing slashes
  } catch (error) {
    if (error.message.includes('Invalid URL')) {
      throw new Error('Please enter a valid URL (e.g., https://linknlink.example.com)');
    }
    throw error;
  }
}

async function handleLoginClick() {
  hideMessages();
  
  const apiUrl = document.getElementById('api-url').value.trim();
  
  if (!apiUrl) {
    showLoginError('Please enter your LinknLink URL');
    return;
  }

  try {
    // Validate and normalize API URL
    const normalizedApiUrl = validateApiUrl(apiUrl);
    
    // Store API URL
    await chrome.storage.local.set({ apiBaseUrl: normalizedApiUrl });
    
    // Open login page
    const loginUrl = `${normalizedApiUrl}/login`;
    await chrome.tabs.create({ url: loginUrl });
    
    // Show status and start checking for auth
    loginStatus.classList.remove('hidden');
    loginBtn.disabled = true;
    
    // Start polling for authentication
    startAuthCheck(normalizedApiUrl);
  } catch (error) {
    showLoginError(error.message || 'Invalid URL. Please enter a valid HTTPS URL.');
    loginBtn.disabled = false;
  }
}

async function startAuthCheck(apiBaseUrl) {
  // Clear any existing interval
  if (authCheckInterval) {
    clearInterval(authCheckInterval);
  }
  
  // Check immediately
  const authenticated = await checkAuthFromCookies();
  if (authenticated) {
    loginStatus.classList.add('hidden');
    loginBtn.disabled = false;
    return;
  }
  
  // Poll every 2 seconds for up to 60 seconds
  let attempts = 0;
  const maxAttempts = 30;
  
  authCheckInterval = setInterval(async () => {
    attempts++;
    const authenticated = await checkAuthFromCookies();
    
    if (authenticated || attempts >= maxAttempts) {
      if (authCheckInterval) {
        clearInterval(authCheckInterval);
        authCheckInterval = null;
      }
      loginStatus.classList.add('hidden');
      loginBtn.disabled = false;
      
      if (attempts >= maxAttempts && !authenticated) {
        showLoginError('Authentication timeout. Please try again or refresh the extension.');
      }
    }
  }, 2000);
}

async function checkAuthFromCookies() {
  const stored = await chrome.storage.local.get(['apiBaseUrl']);
  
  if (!stored.apiBaseUrl) {
    return false;
  }
  
  try {
    // Validate the stored URL before using it
    let apiUrl;
    try {
      apiUrl = validateApiUrl(stored.apiBaseUrl);
    } catch (error) {
      console.error('Invalid stored API URL:', error);
      return false;
    }
    
    // Parse the domain from the API URL
    const url = new URL(apiUrl);
    
    // Security: Only read cookies from the exact domain specified
    // This prevents reading cookies from other domains
    const cookie = await chrome.cookies.get({
      url: apiUrl, // Use full URL to ensure exact domain match
      name: 'pb_auth'
    });
    
    if (!cookie || !cookie.value) {
      return false;
    }
    
    // Parse the cookie value (it's JSON)
    const authData = JSON.parse(cookie.value);
    
    if (!authData.token || !authData.model) {
      return false;
    }
    
    // Verify the auth is valid
    const isValid = await verifyAuth(stored.apiBaseUrl, authData);
    
    if (isValid) {
      // Store auth data
      await chrome.storage.local.set({
        authData: authData,
        user: authData.model
      });
      
      authToken = authData.token;
      apiBaseUrl = stored.apiBaseUrl;
      
      // Clear any polling
      if (authCheckInterval) {
        clearInterval(authCheckInterval);
        authCheckInterval = null;
      }
      
      loginStatus.classList.add('hidden');
      showMainScreen();
      loadCurrentPage();
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking auth from cookies:', error);
    return false;
  }
}

async function verifyAuth(apiBaseUrl, authData) {
  try {
    // Try to make an authenticated request to verify the token
    const response = await fetch(`${apiBaseUrl}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Data': JSON.stringify(authData)
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.user !== null;
    }
    
    return false;
  } catch (error) {
    return false;
  }
}

async function handleSave(e) {
  e.preventDefault();
  hideMessages();

  const notes = document.getElementById('notes').value.trim();
  const tagsInput = document.getElementById('tags').value.trim();
  const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(t => t) : [];

  const saveBtn = document.getElementById('save-btn');
  const saveBtnText = document.getElementById('save-btn-text');
  const saveBtnLoading = document.getElementById('save-btn-loading');

  saveBtn.disabled = true;
  saveBtnText.classList.add('hidden');
  saveBtnLoading.classList.remove('hidden');

  try {
    const stored = await chrome.storage.local.get(['apiBaseUrl', 'authData']);
    
    if (!stored.apiBaseUrl || !stored.authData) {
      throw new Error('Not authenticated. Please sign in again.');
    }

    // Create bookmark with token authentication
    const response = await fetch(`${stored.apiBaseUrl}/api/links`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Data': JSON.stringify(stored.authData)
      },
      body: JSON.stringify({
        url: pageData.url,
        title: pageData.title,
        description: pageData.description,
        notes: notes,
        tags: tags
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired, clear auth and show login
        await chrome.storage.local.remove(['authData', 'user']);
        throw new Error('Session expired. Please sign in again.');
      }
      throw new Error(data.error || 'Failed to save bookmark');
    }

    showSuccess();
    setTimeout(() => {
      window.close();
    }, 1500);
  } catch (error) {
    console.error('Save error:', error);
    showSaveError(error.message || 'Failed to save bookmark');
  } finally {
    saveBtn.disabled = false;
    saveBtnText.classList.remove('hidden');
    saveBtnLoading.classList.add('hidden');
  }
}

async function handleLogout() {
  await chrome.storage.local.remove(['authData', 'apiBaseUrl', 'user']);
  authToken = null;
  apiBaseUrl = null;
  showLoginScreen();
  document.getElementById('api-url').value = '';
}

function showLoginError(message) {
  const errorEl = document.getElementById('login-error');
  errorEl.textContent = message;
  errorEl.classList.add('show');
}

function showSaveError(message) {
  const errorEl = document.getElementById('save-error');
  errorEl.textContent = message;
  errorEl.classList.add('show');
}

function showSuccess() {
  const successEl = document.getElementById('save-success');
  successEl.classList.add('show');
}

function hideMessages() {
  document.getElementById('login-error').classList.remove('show');
  document.getElementById('save-error').classList.remove('show');
  document.getElementById('save-success').classList.remove('show');
}
