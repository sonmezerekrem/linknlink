import { ImageResponse } from 'next/og';

// Route segment config
export const runtime = 'edge';

// Image metadata
export const alt = 'LinknLink - Your Link Management App';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

// Image generation
export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 40,
          }}
        >
          <div
            style={{
              width: 120,
              height: 120,
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: 30,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(10px)',
            }}
          >
            <svg
              width="70"
              height="70"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 17H7A5 5 0 0 1 7 7h2"></path>
              <path d="M15 7h2a5 5 0 1 1 0 10h-2"></path>
              <line x1="8" y1="12" x2="16" y2="12"></line>
            </svg>
          </div>
        </div>
        <div
          style={{
            fontSize: 80,
            fontWeight: 700,
            color: 'white',
            letterSpacing: '-0.02em',
            marginBottom: 20,
          }}
        >
          LinknLink
        </div>
        <div
          style={{
            fontSize: 32,
            fontWeight: 400,
            color: 'rgba(255, 255, 255, 0.9)',
            maxWidth: 800,
            textAlign: 'center',
            lineHeight: 1.4,
          }}
        >
          Save, organize, and manage all your important bookmarks in one place
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
