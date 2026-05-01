import { useState } from "react";

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /[?&]v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function isGifUrl(url: string): boolean {
  return url.split("?")[0].split("#")[0].toLowerCase().endsWith(".gif");
}

function YouTubeThumb({ videoId }: { videoId: string }) {
  const [playing, setPlaying] = useState(false);
  const thumb = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

  if (playing) {
    return (
      <div className="relative w-full rounded-xl overflow-hidden bg-black" style={{ aspectRatio: "16/9" }}>
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="YouTube video"
        />
      </div>
    );
  }

  return (
    <div
      className="relative w-full rounded-xl overflow-hidden cursor-pointer group"
      style={{ aspectRatio: "16/9" }}
      onClick={() => setPlaying(true)}
    >
      <img src={thumb} alt="Miniatura de YouTube" className="w-full h-full object-cover" loading="lazy" />
      <div className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover:bg-black/40 transition-colors">
        <div className="h-14 w-14 rounded-full bg-red-600 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
          <svg viewBox="0 0 24 24" fill="white" className="h-7 w-7 ml-0.5">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent px-3 py-2">
        <p className="text-white/90 text-xs">Toca para reproducir</p>
      </div>
    </div>
  );
}

export function NotesDisplay({ text, className = "" }: { text: string | null; className?: string }) {
  if (!text) return null;

  const urlPattern = /https?:\/\/[^\s]+/g;
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = urlPattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(<span key={`t-${match.index}`}>{text.slice(lastIndex, match.index)}</span>);
    }
    const url = match[0];
    const key = `u-${match.index}`;
    const youtubeId = extractYouTubeId(url);

    if (youtubeId) {
      nodes.push(<YouTubeThumb key={key} videoId={youtubeId} />);
    } else if (isGifUrl(url)) {
      nodes.push(
        <img key={key} src={url} alt="GIF" loading="lazy"
          className="w-full rounded-xl object-contain" style={{ maxHeight: 280 }} />
      );
    } else {
      nodes.push(
        <a key={key} href={url} target="_blank" rel="noopener noreferrer"
          className="text-primary hover:underline break-all"
          onClick={e => e.stopPropagation()}>
          {url}
        </a>
      );
    }
    lastIndex = match.index + url.length;
  }

  if (lastIndex < text.length) {
    nodes.push(<span key="tail">{text.slice(lastIndex)}</span>);
  }

  if (nodes.length === 0) return <span className={className}>{text}</span>;

  return (
    <div className={`space-y-2 text-xs leading-relaxed break-words ${className}`}>
      {nodes}
    </div>
  );
}
