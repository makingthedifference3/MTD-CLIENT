export function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 animate-pulse">
      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-4"></div>
      <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-4"></div>
      <div className="space-y-3">
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-5/6"></div>
      </div>
    </div>
  );
}

export function SkeletonMetricCard() {
  return (
    <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-700 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
        <div className="w-16 h-6 bg-slate-200 dark:bg-slate-700 rounded"></div>
      </div>
      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3 mb-3"></div>
      <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-4"></div>
      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2"></div>
    </div>
  );
}

export function SkeletonTable() {
  return (
    <div className="space-y-3 animate-pulse">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex gap-4 p-4 bg-slate-200 dark:bg-slate-700 rounded-lg">
          <div className="w-12 h-12 bg-slate-300 dark:bg-slate-600 rounded"></div>
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-slate-300 dark:bg-slate-600 rounded w-2/3"></div>
            <div className="h-3 bg-slate-300 dark:bg-slate-600 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <SkeletonMetricCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonText() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6"></div>
      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-4/5"></div>
    </div>
  );
}
