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
