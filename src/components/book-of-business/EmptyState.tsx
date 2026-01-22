import { FileText, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  onUploadClick: () => void;
}

export function EmptyState({ onUploadClick }: EmptyStateProps) {
  return (
    <div className="bg-white dark:bg-card">
      {/* Header */}
      <div className="px-8 py-5 border-b border-gray-100 dark:border-border">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-foreground">Book of Business</h1>
      </div>

      {/* Empty Content */}
      <div className="px-8 py-24 text-center">
        <div className="w-24 h-24 mx-auto mb-8 bg-gray-50 dark:bg-muted rounded-2xl flex items-center justify-center">
          <FileText className="w-12 h-12 text-gray-300 dark:text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-foreground mb-3">Build your book</h2>
        <p className="text-gray-500 dark:text-muted-foreground mb-10 max-w-md mx-auto">
          Upload production reports from your carriers and see your entire book of business in one place.
        </p>

        <Button onClick={onUploadClick} size="lg" className="gap-2">
          <Upload className="h-5 w-5" />
          Upload your first report
        </Button>

        <p className="text-xs text-gray-400 mt-4">Takes about 30 seconds</p>
      </div>
    </div>
  );
}
