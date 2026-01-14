import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
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
    <div className="flex-1 min-w-0 overflow-y-auto bg-[#FAFAF8]">
      <div className="max-w-4xl mx-auto px-6 py-10">

        {/* Video Title - Above player */}
        <div className="mb-6">
          <p className="text-sm text-[#b8860b] font-medium mb-1">Day {currentIndex}</p>
          <h1 className="text-2xl font-semibold text-slate-900">{video.title}</h1>
        </div>

        {/* Video Player - Contained */}
        <div className="mb-8">
          <VideoPlayer
            vimeoId={video.vimeoId}
            vimeoHash={video.vimeoHash}
            startTime={video.startTime}
          />
        </div>

        {/* Description */}
        <p className="text-slate-600 mb-8">{video.description}</p>

        {/* Next Video CTA */}
        {nextVideo && (
          <button
            onClick={() => navigate(`/training/${nextVideo.id}`)}
            className="group flex items-center justify-between w-full p-4 bg-white rounded-xl border border-slate-200 hover:border-[#b8860b]/30 hover:shadow-md transition-all"
          >
            <div>
              <p className="text-xs text-slate-500 mb-1">Up Next</p>
              <p className="font-medium text-slate-900 group-hover:text-[#b8860b] transition-colors">
                Day {allVideos.findIndex(v => v.id === nextVideo.id) + 1}: {nextVideo.title}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-[#b8860b] transition-colors" />
          </button>
        )}

        {!nextVideo && (
          <p className="text-center text-slate-500">
            You've completed all training videos.
          </p>
        )}

      </div>
    </div>
  );
}
