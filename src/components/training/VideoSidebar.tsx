import { useNavigate } from "react-router-dom";
import { CheckCircle, Circle, X, Menu } from "lucide-react";
import { getVideosByModule, TrainingVideo } from "@/data/trainingVideos";

interface VideoSidebarProps {
  currentVideoId: string;
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

export function VideoSidebar({ currentVideoId, isMobileOpen, onMobileClose }: VideoSidebarProps) {
  const navigate = useNavigate();
  const modules = getVideosByModule();

  const handleVideoClick = (video: TrainingVideo) => {
    navigate(`/training/${video.id}`);
    onMobileClose();
  };

  // Flatten all videos for progress calculation
  const allVideos = modules.flatMap(m => m.videos);

  // TODO: Replace with actual completion tracking
  const completedCount = 1;
  const totalCount = allVideos.length;

  const sidebarContent = (
    <div className="bg-white border border-[#e8e4dd] rounded-xl overflow-hidden sticky top-20">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#e8e4dd] flex items-center justify-between">
        <h2 className="font-serif text-lg font-semibold text-[#292524]">Training</h2>
        <button
          onClick={onMobileClose}
          className="lg:hidden p-1 hover:bg-stone-50 rounded text-[#5c5552]"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Video List */}
      <div className="max-h-[600px] overflow-y-auto">
        {modules.map(({ moduleName, videos }, moduleIdx) => (
          <div key={moduleName} className={moduleIdx > 0 ? "border-t border-[#e8e4dd]" : ""}>
            {/* Module Label */}
            <div className="px-4 py-2 bg-stone-50">
              <span className="text-xs font-medium text-[#5c5552] uppercase tracking-wider">
                {moduleName}
              </span>
            </div>

            {/* Videos */}
            {videos.map((video, videoIdx) => {
              const isActive = video.id === currentVideoId;
              const globalIndex = allVideos.findIndex(v => v.id === video.id) + 1;
              // TODO: Replace with actual completion tracking
              const isCompleted = globalIndex === 1;
              const isLastInModule = videoIdx === videos.length - 1;

              return (
                <button
                  key={video.id}
                  onClick={() => handleVideoClick(video)}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-start gap-2 ${
                    !isLastInModule ? "border-b border-[#e8e4dd]" : ""
                  } ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "hover:bg-stone-50 text-[#292524]"
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle
                      className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                        isActive ? "text-white" : "text-emerald-500"
                      }`}
                    />
                  ) : (
                    <Circle
                      className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                        isActive ? "text-white/60" : "text-[#5c5552]/40"
                      }`}
                    />
                  )}
                  <span className="line-clamp-2">Day {globalIndex}: {video.title}</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Progress Footer */}
      <div className="px-4 py-3 border-t border-[#e8e4dd]">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-[#5c5552]">Progress</span>
          <span className="font-medium text-[#292524]">{completedCount} / {totalCount}</span>
        </div>
        <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all"
            style={{ width: `${(completedCount / totalCount) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <div className="hidden lg:block">{sidebarContent}</div>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={onMobileClose} />
          <aside className="absolute left-0 top-0 h-full w-72 max-w-[85vw] shadow-2xl bg-white overflow-y-auto">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden fixed top-20 left-4 z-40 p-2 bg-white border border-[#e8e4dd] text-[#292524] rounded-lg shadow-lg hover:bg-stone-50 transition-colors"
    >
      <Menu className="w-5 h-5" />
    </button>
  );
}
