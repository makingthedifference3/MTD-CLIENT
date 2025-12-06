export function SkeletonCard() {
  return (
    <div className="bg-card rounded-xl p-6 border border-border animate-pulse">
      <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
      <div className="h-8 bg-muted rounded w-1/2 mb-4"></div>
      <div className="space-y-3">
        <div className="h-3 bg-muted rounded w-full"></div>
        <div className="h-3 bg-muted rounded w-5/6"></div>
      </div>
    </div>
  );
}

export function SkeletonMetricCard() {
  return (
    <div className="bg-card rounded-xl p-6 border border-border animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 bg-muted rounded-lg"></div>
        <div className="w-16 h-6 bg-muted rounded"></div>
      </div>
      <div className="h-3 bg-muted rounded w-2/3 mb-3"></div>
      <div className="h-8 bg-muted rounded w-1/2 mb-4"></div>
      <div className="w-full bg-muted rounded-full h-2"></div>
    </div>
  );
}

export function SkeletonTable() {
  return (
    <div className="space-y-3 animate-pulse">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex gap-4 p-4 bg-muted rounded-lg">
          <div className="w-12 h-12 bg-muted-foreground/20 rounded"></div>
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-muted-foreground/20 rounded w-2/3"></div>
            <div className="h-3 bg-muted-foreground/20 rounded w-1/2"></div>
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
      <div className="h-4 bg-muted rounded w-full"></div>
      <div className="h-4 bg-muted rounded w-5/6"></div>
      <div className="h-4 bg-muted rounded w-4/5"></div>
    </div>
  );
}
