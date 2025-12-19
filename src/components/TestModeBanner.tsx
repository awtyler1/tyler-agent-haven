import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { FlaskConical } from "lucide-react";

export const TestModeBanner = () => {
  const { isEnabled } = useFeatureFlags();
  
  if (!isEnabled('test_mode')) return null;
  
  return (
    <div className="fixed bottom-4 right-4 z-[100] bg-purple-600 text-white px-3 py-1.5 rounded-full flex items-center gap-2 text-xs font-medium shadow-lg">
      <FlaskConical className="h-3.5 w-3.5" />
      Test Mode
    </div>
  );
};
