# LinknLink Browser Extension

A lightweight Chromium browser extension for saving bookmarks with OpenGraph metadata to your LinknLink account.

## Features

- 🚀 **Lightweight** - Minimal codebase, fast performance
- 📱 **OpenGraph Support** - Automatically extracts metadata from pages
- 🔐 **Secure Authentication** - Login on first use
- 💾 **Quick Save** - Save bookmarks with tags and notes
- 🎨 **Clean UI** - Modern, minimal interface similar to Raindrop.io

## Installation

### Development Installation

1. Open Chrome/Edge/Brave and navigate to `chrome://extensions/` (or `edge://extensions/` for Edge)
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `chromium_extension` folder

### Production Installation

1. Package the extension (zip the folder)
2. Publish to Chrome Web Store / Edge Add-ons (requires developer account)

## Configuration

### First Time Setup

1. Click the extension icon
2. Enter your LinknLink API Base URL (e.g., `https://your-domain.com`)
3. Enter your email and password
4. Click "Sign In"

### Settings

Right-click the extension icon → "Options" to change your API URL.

## Usage

1. Navigate to any webpage you want to bookmark
2. Click the LinknLink extension icon
3. Review the automatically extracted metadata (title, description, image)
4. Optionally add notes and tags
5. Click "Save Bookmark"

## API Requirements

Your LinknLink API must:
- Support CORS for extension requests
- Accept credentials (cookies) in requests
- Have `/api/auth/login` and `/api/links` endpoints

### CORS Configuration

If you're running your own API, ensure CORS is configured to allow:
- Origin: `chrome-extension://<extension-id>`
- Credentials: `true`

Example for Next.js API routes:
```javascript
// In your API route or middleware
res.setHeader('Access-Control-Allow-Origin', '*'); // Or specific extension origin
res.setHeader('Access-Control-Allow-Credentials', 'true');
```

## File Structure

```
chromium_extension/
├── manifest.json       # Extension manifest (Manifest V3)
├── popup.html          # Main popup UI
├── popup.css           # Popup styles
├── popup.js            # Popup logic
├── content.js          # Content script for metadata extraction
├── background.js       # Background service worker
├── options.html        # Settings page
├── options.js          # Settings logic
├── icons/              # Extension icons
└── README.md           # This file
```

## Development

### Testing

1. Load the extension in developer mode
2. Test on various websites to ensure OpenGraph extraction works
3. Verify authentication flow
4. Test bookmark saving

### Building Icons

You'll need to create icon files:
- `icons/icon16.png` (16x16)
- `icons/icon32.png` (32x32)
- `icons/icon48.png` (48x48)
- `icons/icon128.png` (128x128)

You can use any image editor or online tool to generate these from a single source image.

## Security Notes

- Credentials are stored in `chrome.storage.local` (encrypted by Chrome)
- API requests use credentials: 'include' to send cookies
- No sensitive data is logged or transmitted to third parties

## Troubleshooting

### "Cannot save this page"
- Some pages (chrome://, edge://, etc.) cannot be accessed by extensions
- Try a regular HTTP/HTTPS webpage

### "Failed to sign in"
- Verify your API URL is correct
- Check that your API supports CORS
- Ensure credentials are correct

### "Session expired"
- The extension will attempt to re-authenticate automatically
- If it fails, sign out and sign in again

## License

Same as the main LinknLink project.
