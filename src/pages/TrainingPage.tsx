import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { TrainingLayout } from "@/components/training/TrainingLayout";
import { VideoSidebar, MobileMenuButton } from "@/components/training/VideoSidebar";
import { VideoContent } from "@/components/training/VideoContent";
import { getVideoById } from "@/data/trainingVideos";

export default function TrainingPage() {
  const { videoId } = useParams<{ videoId: string }>();
  const navigate = useNavigate();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const currentVideoId = videoId || "1";
  const video = getVideoById(currentVideoId);

  useEffect(() => {
    if (videoId && !video) {
      navigate("/training/1", { replace: true });
    }
  }, [videoId, video, navigate]);

  useEffect(() => {
    document.title = video
      ? `${video.title} | Agent Training`
      : "Agent Training | TIG Platform";
  }, [video]);

  if (!video) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FEFDFB] via-[#FDFBF7] to-[#FAF8F3] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#5c5552]" />
          <p className="text-sm text-[#5c5552]">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <MobileMenuButton onClick={() => setIsMobileSidebarOpen(true)} />
      <TrainingLayout
        sidebar={
          <VideoSidebar
            currentVideoId={currentVideoId}
            isMobileOpen={isMobileSidebarOpen}
            onMobileClose={() => setIsMobileSidebarOpen(false)}
          />
        }
        content={<VideoContent video={video} />}
      />
    </>
  );
}
