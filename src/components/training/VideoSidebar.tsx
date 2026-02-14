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
    <div className="bg-white rounded-xl overflow-hidden sticky top-20" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      {/* Header */}
      <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--bg-muted)' }}>
        <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-faint)' }}>Training</span>
        <button
          onClick={onMobileClose}
          className="lg:hidden p-1 rounded transition-colors"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-subtle)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Video List */}
      <div className="max-h-[600px] overflow-y-auto">
        {modules.map(({ moduleName, videos }, moduleIdx) => (
          <div key={moduleName} style={moduleIdx > 0 ? { borderTop: '1px solid var(--bg-muted)' } : undefined}>
            {/* Module Label */}
            <div className="px-5 py-2">
              <span className="uppercase" style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.07em', color: 'var(--text-faint)' }}>
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
                    borderBottom: !isLastInModule ? '1px solid var(--bg-muted)' : 'none',
                    background: isActive ? 'var(--bg-subtle)' : 'transparent',
                    color: 'var(--text-primary)',
                    fontWeight: isActive ? 600 : 400,
                    borderLeft: isActive ? '3px solid var(--gold)' : '3px solid transparent',
                  }}
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'var(--bg-subtle)'; }}
                  onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                >
                  {isCompleted ? (
                    <CheckCircle
                      className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-500"
                    />
                  ) : (
                    <Circle
                      className="w-4 h-4 mt-0.5 flex-shrink-0"
                      style={{ color: 'var(--text-faint)' }}
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
      <div className="px-5 py-3" style={{ borderTop: '1px solid var(--bg-muted)' }}>
        <div className="flex items-center justify-between text-sm mb-2">
          <span style={{ color: 'var(--text-muted)' }}>Progress</span>
          <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{completedCount} / {totalCount}</span>
        </div>
        <div className="rounded-full overflow-hidden" style={{ height: 4, background: 'var(--bg-subtle)' }}>
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${(completedCount / totalCount) * 100}%`, background: 'linear-gradient(90deg, var(--gold-dark), var(--gold))' }}
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
          <aside className="absolute left-0 top-0 h-full w-72 max-w-[85vw] overflow-y-auto" style={{ background: 'var(--bg)' }}>
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
        background: 'white',
        border: '1px solid var(--bg-muted)',
        borderRadius: 12,
        boxShadow: '0 4px 16px rgba(60,48,28,0.06)',
        color: 'var(--text-primary)',
      }}
    >
      <Menu className="w-5 h-5" />
    </button>
  );
}
