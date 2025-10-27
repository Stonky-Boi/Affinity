// A simple pulsing gray box
export function SkeletonLoader({ className = 'h-4 bg-primary-border rounded' }) {
  return (
    <div className={`animate-pulse ${className}`}></div>
  );
}

// Example skeleton for a post
export function PostSkeleton() {
  return (
    <div className="p-4 border border-primary-border rounded-lg shadow-sm bg-surface space-y-3">
      <div className="flex items-center space-x-3">
        <SkeletonLoader className="h-10 w-10 rounded-full" />
        <SkeletonLoader className="h-4 w-1/4" />
      </div>
      <SkeletonLoader className="h-4 w-full" />
      <SkeletonLoader className="h-4 w-3/4" />
      <SkeletonLoader className="h-6 w-1/3 mt-2" />
    </div>
  );
}