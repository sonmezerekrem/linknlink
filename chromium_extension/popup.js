// State
let currentTab = null;
let pageData = null;
let authToken = null;
let apiBaseUrl = null;

// DOM Elements
const loginScreen = document.getElementById('login-screen');
const mainScreen = document.getElementById('main-screen');
const loginForm = document.getElementById('login-form');
const saveForm = document.getElementById('save-form');
const loading = document.getElementById('loading');
const bookmarkForm = document.getElementById('bookmark-form');

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  // Check if user is authenticated
  const stored = await chrome.storage.local.get(['authData', 'apiBaseUrl', 'user']);
  
  if (stored.authData && stored.apiBaseUrl) {
    authToken = stored.authData.token;
    apiBaseUrl = stored.apiBaseUrl;
    showMainScreen();
    loadCurrentPage();
  } else {
    // Pre-fill API URL if exists
    if (stored.apiBaseUrl) {
      document.getElementById('api-url').value = stored.apiBaseUrl;
    }
    showLoginScreen();
  }

  // Event listeners
  loginForm.addEventListener('submit', handleLogin);
  saveForm.addEventListener('submit', handleSave);
  document.getElementById('logout-btn').addEventListener('click', handleLogout);
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
      showError('Cannot save this page');
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
    showError('Failed to load page data');
  } finally {
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

async function handleLogin(e) {
  e.preventDefault();
  hideMessages();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const apiUrl = document.getElementById('api-url').value.trim();

  if (!apiUrl) {
    showLoginError('Please enter API Base URL');
    return;
  }

  // Normalize API URL (remove trailing slash)
  const normalizedApiUrl = apiUrl.replace(/\/+$/, '');

  const loginBtn = document.getElementById('login-btn');
  loginBtn.disabled = true;
  loginBtn.textContent = 'Signing in...';

  try {
    const response = await fetch(`${normalizedApiUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }

    // Store auth data - store full auth data for API authentication
    const authData = {
      token: data.token,
      model: data.user
    };
    await chrome.storage.local.set({
      apiBaseUrl: normalizedApiUrl,
      user: data.user,
      authData: authData // Store full auth data for API calls
    });

    authToken = data.token;
    apiBaseUrl = normalizedApiUrl;

    showMainScreen();
    loadCurrentPage();
  } catch (error) {
    console.error('Login error:', error);
    showLoginError(error.message || 'Failed to sign in. Please check your credentials and API URL.');
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = 'Sign In';
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
  document.getElementById('login-form').reset();
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
