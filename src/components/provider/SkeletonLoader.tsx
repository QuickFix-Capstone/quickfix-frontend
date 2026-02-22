export default function SkeletonLoader() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse space-y-6 px-4 py-8">
      <div className="rounded-2xl border border-neutral-200 bg-white p-6">
        <div className="h-7 w-56 rounded bg-neutral-200" />
        <div className="mt-3 h-4 w-72 rounded bg-neutral-100" />
        <div className="mt-4 flex gap-3">
          <div className="h-10 w-28 rounded-xl bg-neutral-200" />
          <div className="h-10 w-24 rounded-xl bg-neutral-200" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-neutral-200 bg-white p-6">
            <div className="h-5 w-24 rounded bg-neutral-200" />
            <div className="mt-3 h-3 w-full rounded bg-neutral-100" />
            <div className="mt-2 h-3 w-11/12 rounded bg-neutral-100" />
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-6">
            <div className="h-5 w-28 rounded bg-neutral-200" />
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {[1, 2].map((item) => (
                <div
                  key={item}
                  className="rounded-xl border border-neutral-100 p-3"
                >
                  <div className="h-24 rounded bg-neutral-100" />
                  <div className="mt-3 h-4 w-3/4 rounded bg-neutral-100" />
                  <div className="mt-2 h-3 w-1/2 rounded bg-neutral-100" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-neutral-200 bg-white p-6">
            <div className="h-5 w-28 rounded bg-neutral-200" />
            <div className="mt-4 space-y-3">
              {[1, 2, 3, 4, 5].map((item) => (
                <div key={item} className="h-3 rounded bg-neutral-100" />
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-white p-6">
            <div className="h-5 w-20 rounded bg-neutral-200" />
            <div className="mt-4 flex flex-wrap gap-2">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-7 w-24 rounded-full bg-neutral-100" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
