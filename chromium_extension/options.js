document.addEventListener('DOMContentLoaded', async () => {
  const apiUrlInput = document.getElementById('api-url');
  const saveBtn = document.getElementById('save-btn');
  const messageEl = document.getElementById('message');

  // Load current settings
  const stored = await chrome.storage.local.get(['apiBaseUrl']);
  if (stored.apiBaseUrl) {
    apiUrlInput.value = stored.apiBaseUrl;
  }

  saveBtn.addEventListener('click', async () => {
    const apiUrl = apiUrlInput.value.trim();
    
    if (!apiUrl) {
      showMessage('Please enter an API URL', 'error');
      return;
    }

    // Normalize URL
    const normalizedUrl = apiUrl.replace(/\/+$/, '');

    try {
      await chrome.storage.local.set({ apiBaseUrl: normalizedUrl });
      showMessage('Settings saved successfully!', 'success');
    } catch (error) {
      showMessage('Failed to save settings', 'error');
    }
  });

  function showMessage(text, type) {
    messageEl.textContent = text;
    messageEl.className = `message ${type} show`;
    setTimeout(() => {
      messageEl.classList.remove('show');
    }, 3000);
  }
});
