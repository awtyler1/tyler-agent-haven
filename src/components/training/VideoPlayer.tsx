interface VideoPlayerProps {
  vimeoId: string;
  vimeoHash: string;
  startTime: number;
}

export function VideoPlayer({ vimeoId, vimeoHash, startTime }: VideoPlayerProps) {
  const embedUrl = `https://player.vimeo.com/video/${vimeoId}?h=${vimeoHash}&badge=0&autopause=0&player_id=0&app_id=58479${startTime > 0 ? `#t=${startTime}s` : ''}`;

  return (
    <div className="w-full rounded-xl overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
        <iframe
          src={embedUrl}
          className="absolute top-0 left-0 w-full h-full"
          frameBorder="0"
          allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
          allowFullScreen
          title="Training Video"
        />
      </div>
    </div>
  );
}
