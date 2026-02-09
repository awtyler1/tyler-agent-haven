import { useNavigate } from "react-router-dom";
import { ChevronRight, CheckCircle } from "lucide-react";
import { TrainingVideo, getNextVideo, trainingVideos } from "@/data/trainingVideos";
import { VideoPlayer } from "./VideoPlayer";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { GH } from "@/config/golden-hour";

interface VideoContentProps {
  video: TrainingVideo;
}

export function VideoContent({ video }: VideoContentProps) {
  const navigate = useNavigate();
  const nextVideo = getNextVideo(video.id);
  const allVideos = trainingVideos;
  const currentIndex = allVideos.findIndex(v => v.id === video.id) + 1;

  return (
    <div>
      {/* Day Label */}
      <p className="mb-2 uppercase" style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.07em', color: GH.textMuted }}>Day {currentIndex}</p>

      {/* Title */}
      <h1 className="text-2xl font-semibold mb-6" style={{ fontFamily: GH.serif, color: GH.textPrimary }}>
        {video.title}
      </h1>

      {/* Video Player */}
      <GlassPanel padding={0} style={{ overflow: 'hidden', marginBottom: 24 }}>
        <VideoPlayer
          vimeoId={video.vimeoId}
          vimeoHash={video.vimeoHash}
          startTime={video.startTime}
        />
      </GlassPanel>

      {/* Description */}
      <p className="text-sm mb-6" style={{ color: GH.textSecondary }}>{video.description}</p>

      {/* Next Video CTA */}
      {nextVideo && (
        <button
          onClick={() => navigate(`/training/${nextVideo.id}`)}
          className="group flex items-center justify-between w-full transition-colors"
          style={{ padding: 16, background: GH.tileBg, border: `1px solid ${GH.borderLight}`, borderRadius: 14 }}
          onMouseEnter={(e) => { e.currentTarget.style.background = GH.tileHover; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = GH.tileBg; }}
        >
          <div>
            <p className="mb-1 uppercase" style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.07em', color: GH.textMuted }}>Up Next</p>
            <p className="font-medium" style={{ color: GH.textPrimary }}>
              Day {allVideos.findIndex(v => v.id === nextVideo.id) + 1}: {nextVideo.title}
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-blue-600" />
        </button>
      )}

      {!nextVideo && (
        <GlassPanel style={{ textAlign: 'center', padding: 16 }}>
          <div className="flex items-center justify-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="font-medium text-green-600">
              You've completed all training videos!
            </p>
          </div>
        </GlassPanel>
      )}
    </div>
  );
}
