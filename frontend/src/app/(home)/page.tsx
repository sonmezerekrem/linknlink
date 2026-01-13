import { Suspense } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { getLinks, getTags, getCurrentUser } from '@/lib/data';
import { LinksProvider } from '@/components/home/LinksProvider';
import { HomeClient } from '@/components/home/HomeClient';
import { Header } from '@/components/home/Header';

interface HomePageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    tagId?: string;
  }>;
}

// Server Component - fetches data
export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;

  // Check if user is authenticated first
  const user = await getCurrentUser();

  // If not authenticated, let ProtectedRoute handle the redirect
  if (!user) {
    return (
      <ProtectedRoute>
        <div />
      </ProtectedRoute>
    );
  }

  // Parallel data fetching - only when authenticated
  const [linksData, tags] = await Promise.all([
    getLinks({
      page: params.page ? parseInt(params.page, 10) : 1,
      perPage: 12,
      search: params.search,
      tagId: params.tagId !== 'all' ? params.tagId : undefined,
    }),
    getTags(),
  ]);

  return (
    <ProtectedRoute>
      <LinksProvider
        initialLinks={linksData.items}
        initialTags={tags}
        searchParams={params}
      >
        <div className="flex min-h-screen flex-col bg-zinc-50 font-sans dark:bg-black">
          <Header user={user} />

          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
            <Suspense fallback={<ClientLoadingSkeleton />}>
              <HomeClient
                initialPagination={{
                  page: linksData.page,
                  perPage: linksData.perPage,
                  totalItems: linksData.totalItems,
                  totalPages: linksData.totalPages,
                }}
                initialSearchParams={params}
              />
            </Suspense>
          </main>
        </div>
      </LinksProvider>
    </ProtectedRoute>
  );
}

// Inline loading skeleton for client component suspense
function ClientLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-4">
          <div className="h-11 w-full max-w-md rounded-md bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          <div className="h-11 w-[180px] rounded-md bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-48 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4"
          >
            <div className="h-6 w-3/4 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Generate metadata
export async function generateMetadata() {
  return {
    title: 'Home',
  };
}
