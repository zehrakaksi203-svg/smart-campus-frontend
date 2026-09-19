function Skeleton({ className = "" }) {
    return (
      <div
        className={`animate-pulse bg-slate-200 rounded ${className}`}
      />
    );
  }
  
  export function CardSkeleton() {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <Skeleton className="w-10 h-10 rounded-lg mb-3" />
        <Skeleton className="h-3 w-24 mb-2" />
        <Skeleton className="h-6 w-16" />
      </div>
    );
  }
  
  export function CardGridSkeleton({ count = 8 }) {
    return (
      <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }
  
  export function ListRowSkeleton() {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex justify-between items-center gap-4">
        <div className="flex-1">
          <Skeleton className="h-4 w-1/3 mb-2" />
          <Skeleton className="h-3 w-2/3" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
    );
  }
  
  export function ListSkeleton({ count = 5 }) {
    return (
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <ListRowSkeleton key={i} />
        ))}
      </div>
    );
  }
  
  export default Skeleton;