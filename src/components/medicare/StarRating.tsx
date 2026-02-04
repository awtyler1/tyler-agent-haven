import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number | null;
  size?: 'sm' | 'md';
  showNumeric?: boolean;
}

const sizeClasses = {
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
};

/**
 * Star rating display - matches existing pattern in PlanFinderPage/PlanDetailModal
 */
export function StarRating({ rating, size = 'sm', showNumeric = true }: StarRatingProps) {
  if (!rating) {
    return <span className="text-muted-foreground text-sm">Not rated</span>;
  }

  return (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`${sizeClasses[size]} ${
            i < Math.floor(rating)
              ? 'text-amber-400 fill-amber-400'
              : 'text-gray-200'
          }`}
        />
      ))}
      {showNumeric && (
        <span className="ml-1 text-sm text-muted-foreground">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}

export default StarRating;
