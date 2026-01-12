import PocketBase from 'pocketbase';

// Server-side PocketBase instance
export function getServerPocketBase(): PocketBase {
  const url = process.env.POCKETBASE_URL || process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://localhost:8090';
  return new PocketBase(url);
}
