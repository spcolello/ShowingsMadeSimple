"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-lg font-semibold text-slate-950">Something went wrong</h1>
        <p className="mt-2 text-sm text-slate-600">
          The request could not be completed. Try again or return to the dashboard.
        </p>
        <button
          onClick={reset}
          className="mt-4 min-h-10 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
