/**
 * Centered full-screen loading fallback for Suspense (e.g. lazy routes).
 */
export default function PageLoader() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center bg-gray-50/50">
      <div
        className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"
        aria-hidden
      />
      <p className="mt-4 text-sm font-medium text-gray-500">Loading…</p>
    </div>
  );
}
