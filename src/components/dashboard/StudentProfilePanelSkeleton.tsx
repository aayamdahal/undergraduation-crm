export const StudentProfilePanelSkeleton = () => (
  <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <div className="flex flex-col gap-6 animate-pulse">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <div className="h-6 w-48 rounded-full bg-slate-200" />
            <div className="h-4 w-56 rounded-full bg-slate-200" />
            <div className="h-3 w-40 rounded-full bg-slate-200" />
          </div>
          <div className="flex w-full max-w-sm flex-col gap-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
              <div className="h-6 w-28 rounded-full bg-slate-200" />
              <div className="h-4 w-12 rounded-full bg-slate-200" />
            </div>
            <div className="h-2 w-full rounded-full bg-slate-200" />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <div className="h-6 w-20 rounded-full bg-slate-200" />
          <div className="h-6 w-24 rounded-full bg-slate-200" />
          <div className="h-6 w-16 rounded-full bg-slate-200" />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={`stat-${index}`}
              className="space-y-2 rounded-xl border border-slate-200 bg-white p-4"
            >
              <div className="h-3 w-32 rounded-full bg-slate-200" />
              <div className="h-5 w-20 rounded-full bg-slate-200" />
              <div className="h-3 w-24 rounded-full bg-slate-200" />
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <div className="h-5 w-40 rounded-full bg-slate-200" />
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={`summary-line-${index}`}
              className="h-4 w-full rounded-full bg-slate-200"
            />
          ))}
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="h-4 w-32 rounded-full bg-slate-200" />
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={`note-${index}`}
              className="h-3 w-full rounded-full bg-slate-200"
            />
          ))}
        </div>
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="h-4 w-28 rounded-full bg-slate-200" />
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={`reminder-${index}`}
              className="h-3 w-full rounded-full bg-slate-200"
            />
          ))}
        </div>
      </div>
    </div>
  </section>
);
