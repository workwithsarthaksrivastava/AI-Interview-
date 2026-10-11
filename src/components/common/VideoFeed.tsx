import React, { useEffect, useRef } from 'react';

interface VideoFeedProps {
  stream: MediaStream | null;
  className?: string;
  mirrored?: boolean;
  muted?: boolean;
  placeholder?: React.ReactNode;
}

export const VideoFeed: React.FC<VideoFeedProps> = ({
  stream,
  className = '',
  mirrored = true,
  muted = true,
  placeholder
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Sync stream to video element whenever stream changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (stream) {
      if (video.srcObject !== stream) {
        video.srcObject = stream;
      }
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          // Normal browser autoplay policy catch
          console.warn('[VideoFeed] Autoplay notice:', err?.name);
        });
      }
    } else {
      video.srcObject = null;
    }
  }, [stream]);

  if (!stream) {
    return <>{placeholder || null}</>;
  }

  return (
    <video
      ref={(node) => {
        videoRef.current = node;
        if (node && stream && node.srcObject !== stream) {
          node.srcObject = stream;
          node.play().catch(() => {});
        }
      }}
      autoPlay
      playsInline
      muted={muted}
      onLoadedMetadata={(e) => {
        const target = e.target as HTMLVideoElement;
        target.play().catch(() => {});
      }}
      className={`w-full h-full object-cover ${mirrored ? '-scale-x-100' : ''} ${className}`}
    />
  );
};
