import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { AlertTriangle } from "lucide-react";

export const TestModeBanner = () => {
  const { isEnabled } = useFeatureFlags();
  
  if (!isEnabled('test_mode')) return null;
  
  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-purple-600 text-white py-2 px-4 flex items-center justify-center gap-2 text-sm font-medium">
      <AlertTriangle className="h-4 w-4" />
      Test Mode Active - All new data will be marked as test
    </div>
  );
};
