import { useNavigate } from "react-router-dom";
import { CheckCircle, Circle, X, Menu } from "lucide-react";
import { getVideosByModule, TrainingVideo } from "@/data/trainingVideos";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { GH } from "@/config/golden-hour";

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
    <GlassPanel padding={0} style={{ overflow: 'hidden', position: 'sticky', top: 80 }}>
      {/* Header */}
      <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${GH.border}` }}>
        <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: GH.textMuted }}>Training</span>
        <button
          onClick={onMobileClose}
          className="lg:hidden p-1 rounded transition-colors"
          style={{ color: GH.textSecondary }}
          onMouseEnter={(e) => { e.currentTarget.style.background = GH.tileHover; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Video List */}
      <div className="max-h-[600px] overflow-y-auto">
        {modules.map(({ moduleName, videos }, moduleIdx) => (
          <div key={moduleName} style={moduleIdx > 0 ? { borderTop: `1px solid ${GH.border}` } : undefined}>
            {/* Module Label */}
            <div className="px-5 py-2">
              <span className="uppercase" style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.07em', color: GH.textMuted }}>
                {moduleName}
              </span>
            </div>

            {/* Videos */}
            {videos.map((video, videoIdx) => {
              const isActive = video.id === currentVideoId;
              // TODO: Replace with actual completion tracking
              const isCompleted = video.id === "1";
              const isLastInModule = videoIdx === videos.length - 1;

              return (
                <button
                  key={video.id}
                  onClick={() => handleVideoClick(video)}
                  className="w-full text-left px-5 py-3 text-sm transition-colors flex items-start gap-2"
                  style={{
                    borderBottom: !isLastInModule ? `1px solid ${GH.border}` : 'none',
                    background: isActive ? GH.tileHover : 'transparent',
                    color: GH.textPrimary,
                    fontWeight: isActive ? 600 : 400,
                    borderLeft: isActive ? '3px solid #2563eb' : '3px solid transparent',
                  }}
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = GH.tileHover; }}
                  onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                >
                  {isCompleted ? (
                    <CheckCircle
                      className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-500"
                    />
                  ) : (
                    <Circle
                      className="w-4 h-4 mt-0.5 flex-shrink-0"
                      style={{ color: GH.textFaint }}
                    />
                  )}
                  <span className="line-clamp-2">{video.title}</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Progress Footer */}
      <div className="px-5 py-3" style={{ borderTop: `1px solid ${GH.border}` }}>
        <div className="flex items-center justify-between text-sm mb-2">
          <span style={{ color: GH.textSecondary }}>Progress</span>
          <span className="font-medium" style={{ color: GH.textPrimary }}>{completedCount} / {totalCount}</span>
        </div>
        <div className="rounded-full overflow-hidden" style={{ height: 4, background: GH.tileBg }}>
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${(completedCount / totalCount) * 100}%`, background: 'linear-gradient(90deg, #8b5cf6, #a78bfa)' }}
          />
        </div>
      </div>
    </GlassPanel>
  );

  return (
    <>
      {/* Desktop */}
      <div className="hidden lg:block">{sidebarContent}</div>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={onMobileClose} />
          <aside className="absolute left-0 top-0 h-full w-72 max-w-[85vw] overflow-y-auto" style={{ background: GH.pageBg }}>
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
      className="lg:hidden fixed top-20 left-4 z-40 p-2 transition-colors"
      style={{
        background: GH.glass,
        backdropFilter: `blur(${GH.glassBlur})`,
        WebkitBackdropFilter: `blur(${GH.glassBlur})`,
        border: `1px solid ${GH.glassBorder}`,
        borderRadius: 18,
        boxShadow: '0 4px 16px rgba(60,48,28,0.06)',
        color: GH.textPrimary,
      }}
    >
      <Menu className="w-5 h-5" />
    </button>
  );
}
