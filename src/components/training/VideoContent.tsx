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
    <div>
      {/* Day Label */}
      <p className="text-sm text-blue-600 font-medium mb-2">Day {currentIndex}</p>

      {/* Title */}
      <h1 className="font-serif text-2xl font-semibold text-[#292524] mb-6">
        {video.title}
      </h1>

      {/* Video Player */}
      <div className="bg-white border border-[#e8e4dd] rounded-xl overflow-hidden mb-6">
        <VideoPlayer
          vimeoId={video.vimeoId}
          vimeoHash={video.vimeoHash}
          startTime={video.startTime}
        />
      </div>

      {/* Description */}
      <p className="text-[#5c5552] mb-6">{video.description}</p>

      {/* Next Video CTA */}
      {nextVideo && (
        <button
          onClick={() => navigate(`/training/${nextVideo.id}`)}
          className="group flex items-center justify-between w-full p-4 bg-white border border-[#e8e4dd] rounded-xl hover:bg-stone-50 transition-colors"
        >
          <div>
            <p className="text-xs text-[#5c5552] uppercase tracking-wider mb-1">Up Next</p>
            <p className="font-medium text-[#292524]">
              Day {allVideos.findIndex(v => v.id === nextVideo.id) + 1}: {nextVideo.title}
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-blue-600" />
        </button>
      )}

      {!nextVideo && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
          <p className="text-emerald-700 font-medium">
            🎉 You've completed all training videos!
          </p>
        </div>
      )}
    </div>
  );
}
