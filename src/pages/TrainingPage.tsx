import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <p className="text-slate-500">Loading...</p>
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
