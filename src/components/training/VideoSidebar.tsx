import { useNavigate } from "react-router-dom";
import { X, Menu } from "lucide-react";
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

  // Flatten all videos for sequential numbering
  const allVideos = modules.flatMap(m => m.videos);

  const sidebarContent = (
    <div className="h-full flex flex-col bg-slate-900">
      {/* Header */}
      <div className="p-5 flex items-center justify-between">
        <h2 className="text-white font-semibold tracking-wide">Training</h2>
        <button onClick={onMobileClose} className="lg:hidden p-1 hover:bg-slate-800 rounded text-slate-400">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Video List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {modules.map(({ moduleName, videos }) => (
          <div key={moduleName} className="mb-2">
            {/* Module Label */}
            <div className="px-5 py-2">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                {moduleName}
              </span>
            </div>

            {/* Videos */}
            {videos.map((video) => {
              const isActive = video.id === currentVideoId;
              const globalIndex = allVideos.findIndex(v => v.id === video.id) + 1;

              return (
                <button
                  key={video.id}
                  onClick={() => handleVideoClick(video)}
                  className={`w-full px-5 py-3 text-left transition-colors ${
                    isActive
                      ? "bg-[#b8860b] text-white"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <span className="text-sm font-medium">
                    Day {globalIndex}: {video.title}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Progress Footer */}
      <div className="p-5 border-t border-slate-800">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-slate-400">Progress</span>
          <span className="text-white font-medium">1 / {allVideos.length}</span>
        </div>
        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div className="h-full bg-[#b8860b] rounded-full" style={{ width: '7%' }} />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden lg:block w-72 flex-shrink-0 h-full overflow-hidden">
        {sidebarContent}
      </aside>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={onMobileClose} />
          <aside className="absolute left-0 top-0 h-full w-72 max-w-[85vw] shadow-2xl">
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
      className="lg:hidden fixed top-20 left-4 z-40 p-2 bg-slate-900 text-white rounded-lg shadow-lg hover:bg-slate-800 transition-colors"
    >
      <Menu className="w-5 h-5" />
    </button>
  );
}
