export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <div className="border-b border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-lg bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
              <div className="h-6 w-24 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            </div>
            <div className="h-10 w-10 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          </div>
        </div>
      </div>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-4">
            <div className="h-11 w-full max-w-md rounded-md bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            <div className="h-11 w-[180px] rounded-md bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-11 w-24 rounded-md bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            <div className="h-11 w-32 rounded-md bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-48 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4"
            >
              <div className="space-y-3">
                <div className="h-6 w-3/4 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                <div className="flex gap-2">
                  <div className="h-6 w-16 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                  <div className="h-6 w-20 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                </div>
                <div className="h-4 w-1/2 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                <div className="space-y-2">
                  <div className="h-3 w-full rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                  <div className="h-3 w-5/6 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
