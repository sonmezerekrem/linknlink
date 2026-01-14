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
  const checkAuthBtn = document.getElementById('check-auth-btn');
  if (checkAuthBtn) {
    checkAuthBtn.addEventListener('click', handleCheckAuth);
  } else {
    console.error('Check auth button not found!');
  }
  
  // Setup save listeners (will be set up when main screen is shown)
  // This is done in showMainScreen() to ensure form is visible
  setupSaveListeners();
  
  document.getElementById('logout-btn').addEventListener('click', handleLogout);
  
  // Check for auth on popup open (in case user is already logged in)
  // This will automatically detect if user is already authenticated
  const wasAuthenticated = await checkAuthFromCookies();
  
  // If not authenticated, show login screen
  if (!wasAuthenticated) {
    showLoginScreen();
  }
  
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
  
  // Ensure save form listeners are set up when main screen is shown
  setupSaveListeners();
}

function setupSaveListeners() {
  console.log('setupSaveListeners called');
  const newSaveForm = document.getElementById('save-form');
  const newSaveBtn = document.getElementById('save-btn');
  
  console.log('Form and button check:', { 
    hasForm: !!newSaveForm, 
    hasButton: !!newSaveBtn,
    formVisible: newSaveForm ? !newSaveForm.classList.contains('hidden') : false,
    buttonVisible: newSaveBtn ? !newSaveBtn.closest('.hidden') : false
  });
  
  if (newSaveForm && !newSaveForm.hasAttribute('data-listener-attached')) {
    console.log('Setting up save form submit listener');
    newSaveForm.addEventListener('submit', (e) => {
      console.log('=== SAVE FORM SUBMITTED ===');
      e.preventDefault();
      e.stopPropagation();
      handleSave(e).catch(err => {
        console.error('Error in handleSave:', err);
        showSaveError('Error: ' + err.message);
      });
    });
    newSaveForm.setAttribute('data-listener-attached', 'true');
  } else if (newSaveForm) {
    console.log('Save form listener already attached');
  } else {
    console.error('Save form not found!');
  }
  
  if (newSaveBtn && !newSaveBtn.hasAttribute('data-listener-attached')) {
    console.log('Setting up save button click listener');
    newSaveBtn.addEventListener('click', (e) => {
      console.log('=== SAVE BUTTON CLICKED ===');
      e.preventDefault();
      e.stopPropagation();
      const form = document.getElementById('save-form');
      if (form) {
        console.log('Dispatching submit event on form');
        const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
        form.dispatchEvent(submitEvent);
      } else {
        console.log('Form not found, calling handleSave directly');
        handleSave(e).catch(err => {
          console.error('Error in handleSave:', err);
          showSaveError('Error: ' + err.message);
        });
      }
    });
    newSaveBtn.setAttribute('data-listener-attached', 'true');
    
    // Test if button is clickable
    console.log('Button details:', {
      disabled: newSaveBtn.disabled,
      type: newSaveBtn.type,
      tagName: newSaveBtn.tagName,
      parentElement: newSaveBtn.parentElement?.tagName
    });
  } else if (newSaveBtn) {
    console.log('Save button listener already attached');
  } else {
    console.error('Save button not found!');
  }
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

    // Get page data from content script with timeout
    try {
      // Add timeout to prevent hanging forever
      const messagePromise = chrome.tabs.sendMessage(tab.id, { action: 'getPageData' });
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 2000)
      );
      
      const results = await Promise.race([messagePromise, timeoutPromise]);
      pageData = results;
      displayPreview(results);
    } catch (error) {
      // Content script might not be available, timed out, or page doesn't allow it
      // Fallback: use tab data
      console.log('Content script unavailable, using tab data:', error.message);
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
  } finally {
    // Always hide loading and show form, even on error
    loading.classList.add('hidden');
    bookmarkForm.classList.remove('hidden');
    
    // Setup save listeners after form is shown
    setupSaveListeners();
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
    imageEl.style.backgroundImage = '';
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
    
    // First, check if user is already authenticated
    const alreadyAuth = await checkAuthFromCookies();
    if (alreadyAuth) {
      // Already authenticated, no need to open login page
      return;
    }
    
    // Open login page (or home page if already logged in)
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

async function handleCheckAuth() {
  console.log('handleCheckAuth called');
  hideMessages();
  
  const statusP = loginStatus.querySelector('p');
  if (!statusP) {
    showLoginError('Error: Status element not found');
    return;
  }
  
  loginStatus.classList.remove('hidden');
  statusP.textContent = 'Checking authentication...';
  
  const apiUrlInput = document.getElementById('api-url');
  if (!apiUrlInput) {
    showLoginError('Error: API URL input not found');
    loginStatus.classList.add('hidden');
    return;
  }
  
  const apiUrl = apiUrlInput.value.trim();
  
  if (!apiUrl) {
    showLoginError('Please enter your LinknLink URL first');
    loginStatus.classList.add('hidden');
    return;
  }

  try {
    console.log('Validating URL:', apiUrl);
    const normalizedApiUrl = validateApiUrl(apiUrl);
    console.log('Normalized URL:', normalizedApiUrl);
    await chrome.storage.local.set({ apiBaseUrl: normalizedApiUrl });
    
    statusP.textContent = 'Looking for authentication cookie...';
    
    console.log('Calling checkAuthFromCookies...');
    const authenticated = await checkAuthFromCookies();
    console.log('Authentication result:', authenticated);
    
    if (!authenticated) {
      loginStatus.classList.add('hidden');
      // Try to get more info about why it failed
      const urlObj = new URL(normalizedApiUrl);
      try {
        console.log('Getting all cookies for domain:', urlObj.hostname);
        const allCookies = await chrome.cookies.getAll({ domain: urlObj.hostname });
        console.log('All cookies found:', allCookies.length, allCookies);
        
        const pbAuthCookie = allCookies.find(c => c.name === 'pb_auth');
        const cookieNames = allCookies.map(c => c.name).join(', ');
        
        if (pbAuthCookie) {
          // Cookie exists, but something else is wrong
          if (!pbAuthCookie.value || pbAuthCookie.value.trim() === '') {
            showLoginError('pb_auth cookie found but is empty. Please log out and log back in on the website.');
          } else {
            try {
              const testParse = JSON.parse(pbAuthCookie.value);
              if (!testParse.token || !testParse.model) {
                showLoginError('pb_auth cookie found but missing token or user data. Please log out and log back in.');
              } else {
                showLoginError('pb_auth cookie found but token validation failed. The session may have expired. Please refresh the website and try again.');
              }
            } catch (e) {
              showLoginError('pb_auth cookie found but cannot be parsed. Please log out and log back in on the website.');
            }
          }
        } else if (cookieNames) {
          showLoginError(`Not authenticated. Found cookies: ${cookieNames}, but pb_auth is missing. Please log in on the website.`);
        } else {
          showLoginError(`Not authenticated. No cookies found for ${urlObj.hostname}. Please log in on the website first.`);
        }
      } catch (e) {
        console.error('Error getting cookies:', e);
        showLoginError('Not authenticated. Error checking cookies: ' + e.message);
      }
    } else {
      statusP.textContent = 'Authentication successful!';
      // If authenticated, checkAuthFromCookies will show the main screen
    }
  } catch (error) {
    console.error('Check auth error:', error);
    loginStatus.classList.add('hidden');
    showLoginError(error.message || 'Failed to check authentication: ' + error.toString());
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
    console.error('No API URL stored');
    return false;
  }
  
  try {
    // Validate the stored URL before using it
    let apiUrl;
    try {
      apiUrl = validateApiUrl(stored.apiBaseUrl);
      console.log('Checking auth for URL:', apiUrl);
    } catch (error) {
      console.error('Invalid stored API URL:', error);
      return false;
    }
    
    // Security: Only read cookies from the exact domain specified
    // Try multiple methods to find the cookie
    const urlObj = new URL(apiUrl);
    let cookie = null;
    
    // Method 1: Try with full URL
    try {
      cookie = await chrome.cookies.get({
        url: apiUrl,
        name: 'pb_auth'
      });
    } catch (e) {
      console.log('Method 1 failed:', e);
    }
    
    // Method 2: Try with domain only
    if (!cookie) {
      try {
        cookie = await chrome.cookies.get({
          url: `${urlObj.protocol}//${urlObj.hostname}`,
          name: 'pb_auth'
        });
      } catch (e) {
        console.log('Method 2 failed:', e);
      }
    }
    
    // Method 3: Get all cookies for domain and find pb_auth manually
    if (!cookie) {
      try {
        const allCookies = await chrome.cookies.getAll({ domain: urlObj.hostname });
        console.log('All cookies for domain:', allCookies.map(c => ({ name: c.name, domain: c.domain, path: c.path, hasValue: !!c.value })));
        cookie = allCookies.find(c => c.name === 'pb_auth');
        if (cookie) {
          console.log('Found pb_auth cookie via getAll:', { 
            domain: cookie.domain, 
            path: cookie.path,
            hasValue: !!cookie.value,
            valueLength: cookie.value ? cookie.value.length : 0
          });
        }
      } catch (e) {
        console.error('Error getting all cookies:', e);
      }
    }
    
    // Method 4: Try with www prefix or without
    if (!cookie && !urlObj.hostname.startsWith('www.')) {
      try {
        cookie = await chrome.cookies.get({
          url: `${urlObj.protocol}//www.${urlObj.hostname}`,
          name: 'pb_auth'
        });
      } catch (e) {
        console.log('Method 4 failed:', e);
      }
    }
    
    if (!cookie) {
      console.error('No auth cookie found for URL:', apiUrl);
      console.error('Tried domain:', urlObj.hostname);
      return false;
    }
    
    if (!cookie.value || cookie.value.trim() === '') {
      console.error('Cookie found but value is empty!', cookie);
      // Show in UI for debugging
      if (loginStatus && !loginStatus.classList.contains('hidden')) {
        loginStatus.querySelector('p').textContent = `Cookie found but value is empty`;
      }
      return false;
    }
    
    console.log('Found auth cookie with value:', { 
      domain: cookie.domain, 
      path: cookie.path, 
      secure: cookie.secure,
      httpOnly: cookie.httpOnly,
      valueLength: cookie.value.length,
      valuePreview: cookie.value.substring(0, 50) + '...'
    });
    
    // Parse the cookie value (it's JSON, but may be URL-encoded)
    let authData;
    try {
      // The cookie value might be URL-encoded, so decode it first
      let cookieValue = cookie.value;
      
      // Check if it's URL-encoded (starts with %)
      if (cookieValue.startsWith('%')) {
        console.log('Cookie value is URL-encoded, decoding...');
        cookieValue = decodeURIComponent(cookieValue);
        console.log('Decoded cookie value length:', cookieValue.length);
      }
      
      authData = JSON.parse(cookieValue);
      console.log('Successfully parsed auth data:', { 
        hasToken: !!authData.token, 
        hasModel: !!authData.model,
        tokenPreview: authData.token ? authData.token.substring(0, 20) + '...' : 'none',
        modelId: authData.model ? authData.model.id : 'none'
      });
    } catch (error) {
      console.error('Failed to parse auth cookie:', error);
      console.error('Cookie value (first 200 chars):', cookie.value.substring(0, 200));
      // Try URL decoding if direct parse failed
      if (cookie.value.startsWith('%')) {
        try {
          const decoded = decodeURIComponent(cookie.value);
          console.log('Retrying with decoded value...');
          authData = JSON.parse(decoded);
          console.log('Successfully parsed after decoding!');
        } catch (decodeError) {
          console.error('Failed even after URL decoding:', decodeError);
          return false;
        }
      } else {
        return false;
      }
    }
    
    if (!authData.token || !authData.model) {
      console.log('Auth cookie missing token or model');
      return false;
    }
    
    // Verify the auth is valid
    const isValid = await verifyAuth(apiUrl, authData);
    
    if (isValid) {
      // Store auth data
      await chrome.storage.local.set({
        authData: authData,
        user: authData.model
      });
      
      authToken = authData.token;
      apiBaseUrl = apiUrl;
      
      // Clear any polling
      if (authCheckInterval) {
        clearInterval(authCheckInterval);
        authCheckInterval = null;
      }
      
      loginStatus.classList.add('hidden');
      showMainScreen();
      loadCurrentPage();
      
      return true;
    } else {
      console.log('Auth token validation failed');
    }
    
    return false;
  } catch (error) {
    console.error('Error checking auth from cookies:', error);
    return false;
  }
}

async function verifyAuth(apiBaseUrl, authData) {
  try {
    console.log('Verifying auth with API:', apiBaseUrl);
    console.log('Auth data:', { 
      hasToken: !!authData.token, 
      hasModel: !!authData.model,
      modelId: authData.model?.id 
    });
    
    // Try to make an authenticated request to verify the token
    const response = await fetch(`${apiBaseUrl}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Data': JSON.stringify(authData)
      }
    });
    
    console.log('Auth verification response status:', response.status, response.statusText);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Auth verification result:', data.user ? 'Authenticated' : 'Not authenticated');
      if (data.user) {
        console.log('User ID:', data.user.id);
      }
      return data.user !== null && data.user !== undefined;
    }
    
    // Try to get error details
    let errorText = response.statusText;
    try {
      const errorData = await response.json();
      errorText = errorData.error || errorText;
    } catch (e) {
      // Ignore JSON parse errors
    }
    
    console.error('Auth verification failed:', response.status, errorText);
    return false;
  } catch (error) {
    console.error('Auth verification error:', error);
    console.error('Error details:', error.message, error.stack);
    return false;
  }
}

async function handleSave(e) {
  console.log('handleSave called', e);
  e.preventDefault();
  hideMessages();

  console.log('Getting form values...');
  const notesEl = document.getElementById('notes');
  const tagsEl = document.getElementById('tags');
  
  if (!notesEl || !tagsEl) {
    console.error('Form elements not found!', { notesEl, tagsEl });
    showSaveError('Form elements not found. Please refresh the extension.');
    return;
  }

  const notes = notesEl.value.trim();
  const tagsInput = tagsEl.value.trim();
  const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(t => t) : [];

  console.log('Form values:', { notes, tags, tagsInput });

  const saveBtn = document.getElementById('save-btn');
  const saveBtnText = document.getElementById('save-btn-text');
  const saveBtnLoading = document.getElementById('save-btn-loading');

  if (!saveBtn || !saveBtnText || !saveBtnLoading) {
    console.error('Save button elements not found!', { saveBtn, saveBtnText, saveBtnLoading });
    showSaveError('Save button elements not found. Please refresh the extension.');
    return;
  }

  console.log('Disabling save button...');
  saveBtn.disabled = true;
  saveBtnText.classList.add('hidden');
  saveBtnLoading.classList.remove('hidden');

  try {
    console.log('Getting stored auth data...');
    const stored = await chrome.storage.local.get(['apiBaseUrl', 'authData']);
    console.log('Stored data:', { 
      hasApiUrl: !!stored.apiBaseUrl, 
      hasAuthData: !!stored.authData,
      apiUrl: stored.apiBaseUrl 
    });
    
    if (!stored.apiBaseUrl || !stored.authData) {
      throw new Error('Not authenticated. Please sign in again.');
    }

    if (!pageData || !pageData.url) {
      throw new Error('Page data not available. Please refresh the page and try again.');
    }

    // Create bookmark with token authentication
    const requestBody = {
      url: pageData.url,
      title: pageData.title || '',
      description: pageData.description || '',
      notes: notes,
      tags: tags
    };
    
    console.log('Saving bookmark:', { 
      url: requestBody.url, 
      title: requestBody.title,
      description: requestBody.description,
      notes: requestBody.notes,
      tags: requestBody.tags
    });
    console.log('API URL:', stored.apiBaseUrl);
    console.log('Auth data:', { 
      hasToken: !!stored.authData.token, 
      hasModel: !!stored.authData.model 
    });
    
    console.log('Making API request...');
    const response = await fetch(`${stored.apiBaseUrl}/api/links`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Data': JSON.stringify(stored.authData)
      },
      body: JSON.stringify(requestBody),
    });
    
    console.log('Response received:', { 
      status: response.status, 
      statusText: response.statusText,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries())
    });

    // Check if response is ok before parsing JSON
    if (!response.ok) {
      console.error('Response not OK:', response.status, response.statusText);
      let errorMessage = 'Failed to save bookmark';
      try {
        const errorData = await response.json();
        console.error('Error data:', errorData);
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        console.error('Failed to parse error response:', e);
        // If JSON parsing fails, use status text
        errorMessage = response.statusText || errorMessage;
      }
      
      if (response.status === 401) {
        console.error('Unauthorized - token expired');
        // Token expired, clear auth and show login
        await chrome.storage.local.remove(['authData', 'user']);
        throw new Error('Session expired. Please sign in again.');
      }
      throw new Error(errorMessage);
    }

    console.log('Response OK, parsing JSON...');
    const data = await response.json();
    console.log('Bookmark saved successfully:', data);

    showSuccess();
    setTimeout(() => {
      console.log('Closing popup...');
      window.close();
    }, 1500);
  } catch (error) {
    console.error('Save error:', error);
    console.error('Error stack:', error.stack);
    showSaveError(error.message || 'Failed to save bookmark');
  } finally {
    console.log('Re-enabling save button...');
    saveBtn.disabled = false;
    saveBtnText.classList.remove('hidden');
    saveBtnLoading.classList.add('hidden');
  }
}

async function handleLogout() {
  try {
    // Clear all stored data
    await chrome.storage.local.remove(['authData', 'apiBaseUrl', 'user']);
    authToken = null;
    apiBaseUrl = null;
    
    // Clear any auth check intervals
    if (authCheckInterval) {
      clearInterval(authCheckInterval);
      authCheckInterval = null;
    }
    
    // Show login screen
    showLoginScreen();
    
    // Clear the API URL field if it exists
    const apiUrlField = document.getElementById('api-url');
    if (apiUrlField) {
      apiUrlField.value = '';
    }
    
    // Hide any error messages
    hideMessages();
  } catch (error) {
    console.error('Logout error:', error);
    // Still try to show login screen even if there's an error
    showLoginScreen();
  }
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
