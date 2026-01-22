import { useState, useEffect } from 'react';
import { Calendar, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NudgeBannerProps {
  onUploadClick: () => void;
}

function getMonthName(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long' });
}

function getStorageKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `bob-nudge-dismissed-${year}-${month}`;
}

function shouldShowNudge(): boolean {
  const now = new Date();
  const dayOfMonth = now.getDate();

  // Only show first 7 days of the month
  if (dayOfMonth > 7) return false;

  // Check if already dismissed this month
  const dismissed = localStorage.getItem(getStorageKey());
  return dismissed !== 'true';
}

export function NudgeBanner({ onUploadClick }: NudgeBannerProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(shouldShowNudge());
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(getStorageKey(), 'true');
    setVisible(false);
  };

  if (!visible) return null;

  const monthName = getMonthName(new Date());

  return (
    <div className="px-6 py-3 bg-blue-50 dark:bg-blue-950/30 border-b border-blue-100 dark:border-blue-900/50 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
          <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
            New month! Time to sync your {monthName} reports
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-400">
            Keep your book current for accurate tracking
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={onUploadClick}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          Upload Now
        </Button>
        <button
          onClick={handleDismiss}
          className="p-1.5 text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
