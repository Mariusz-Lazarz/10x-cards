export function SkeletonLoader() {
  return (
    <div className="space-y-3 sm:space-y-4" role="status" aria-label="Ładowanie fiszek">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="border border-border rounded-lg p-4 sm:p-6 animate-pulse"
        >
          <div className="space-y-3 sm:space-y-4">
            <div>
              <div className="h-3 sm:h-4 bg-muted rounded w-20 mb-2"></div>
              <div className="h-5 sm:h-6 bg-muted rounded w-3/4"></div>
            </div>
            <div>
              <div className="h-3 sm:h-4 bg-muted rounded w-20 mb-2"></div>
              <div className="h-5 sm:h-6 bg-muted rounded w-full"></div>
              <div className="h-5 sm:h-6 bg-muted rounded w-2/3 mt-2"></div>
            </div>
            <div className="flex flex-wrap gap-2 pt-4">
              <div className="h-10 sm:h-9 bg-muted rounded w-24"></div>
              <div className="h-10 sm:h-9 bg-muted rounded w-24"></div>
              <div className="h-10 sm:h-9 bg-muted rounded w-24"></div>
            </div>
          </div>
        </div>
      ))}
      <span className="sr-only">Trwa generowanie fiszek...</span>
    </div>
  );
}

