import { useNavigate } from "react-router-dom";
import { ChevronRight, CheckCircle } from "lucide-react";
import { TrainingVideo, getNextVideo, trainingVideos } from "@/data/trainingVideos";
import { VideoPlayer } from "./VideoPlayer";

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
      <p className="mb-2 uppercase" style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.07em', color: 'var(--text-faint)' }}>Day {currentIndex}</p>

      {/* Title */}
      <h1 className="text-2xl font-semibold mb-6" style={{ fontFamily: "'Lora', Georgia, serif", color: 'var(--text-primary)' }}>
        {video.title}
      </h1>

      {/* Video Player */}
      <div className="bg-white rounded-xl overflow-hidden mb-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <VideoPlayer
          vimeoId={video.vimeoId}
          vimeoHash={video.vimeoHash}
          startTime={video.startTime}
        />
      </div>

      {/* Description */}
      <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>{video.description}</p>

      {/* Next Video CTA */}
      {nextVideo && (
        <button
          onClick={() => navigate(`/training/${nextVideo.id}`)}
          className="group flex items-center justify-between w-full transition-colors"
          style={{ padding: 16, background: 'var(--bg-subtle)', border: '1px solid var(--bg-muted)', borderRadius: 12 }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-subtle)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
        >
          <div>
            <p className="mb-1 uppercase" style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.07em', color: 'var(--text-faint)' }}>Up Next</p>
            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
              Day {allVideos.findIndex(v => v.id === nextVideo.id) + 1}: {nextVideo.title}
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-blue-600" />
        </button>
      )}

      {!nextVideo && (
        <div className="bg-white rounded-xl p-4 text-center" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div className="flex items-center justify-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="font-medium text-green-600">
              You've completed all training videos!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
