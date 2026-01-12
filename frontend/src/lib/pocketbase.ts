import PocketBase from 'pocketbase';

// PocketBase instance - should be a singleton
let pb: PocketBase | null = null;

export function getPocketBase(): PocketBase {
  // Only initialize in browser
  if (typeof window === 'undefined') {
    // Return a dummy instance for SSR (won't be used)
    return {} as PocketBase;
  }

  if (!pb) {
    // Use environment variable or default to localhost
    const url = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://localhost:8090';
    pb = new PocketBase(url);
  }
  return pb;
}

export { PocketBase };
