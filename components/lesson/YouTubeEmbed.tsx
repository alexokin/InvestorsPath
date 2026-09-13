"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import type { Video } from "@/lib/content/schema";

function toSeconds(at: string | number): number {
  if (typeof at === "number") return at;
  const [m, s] = at.split(":").map(Number);
  return m * 60 + s;
}

function SingleVideo({ video }: { video: Video }) {
  const [playing, setPlaying] = useState(false);
  const [start, setStart] = useState(0);

  const thumb = `https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`;
  const src = `https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1&start=${start}`;

  return (
    <div className="my-4 overflow-hidden rounded-lg border border-border bg-slate-50">
      <div className="relative aspect-video w-full bg-black">
        {playing ? (
          <iframe
            src={src}
            title={video.title}
            allow="accelerate-your-download; autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 size-full"
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              setStart(0);
              setPlaying(true);
            }}
            className="group absolute inset-0 size-full"
            aria-label={`נגן: ${video.title}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={thumb} alt="" className="size-full object-cover" />
            <span className="absolute inset-0 flex items-center justify-center bg-black/30 transition-colors group-hover:bg-black/40">
              <span className="flex size-14 items-center justify-center rounded-full bg-white/90 text-primary shadow-lg">
                <Play className="ms-0.5 size-6" fill="currentColor" />
              </span>
            </span>
          </button>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 p-3">
        <div>
          <p className="text-sm font-medium text-foreground">{video.title}</p>
          <p className="text-xs text-muted">
            {video.channel} · {video.language === "he" ? "עברית" : "אנגלית"}
          </p>
        </div>
        {video.language === "en" && <Badge tone="warning">בשפה האנגלית</Badge>}
      </div>
      {video.timestamps.length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-t border-border p-3">
          {video.timestamps.map((ts) => (
            <button
              key={`${ts.at}`}
              type="button"
              onClick={() => {
                setStart(toSeconds(ts.at));
                setPlaying(true);
              }}
              className="rounded-full border border-border bg-white px-2.5 py-1 text-xs text-muted hover:border-primary hover:text-primary"
            >
              <span dir="ltr" className="font-mono">
                {ts.at}
              </span>{" "}
              {ts.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function YouTubeEmbed({ videos }: { videos: Video[] }) {
  const [active, setActive] = useState(0);

  if (videos.length === 0) return null;

  if (videos.length === 1) {
    return <SingleVideo video={videos[0]} />;
  }

  return (
    <div>
      <div role="tablist" className="flex flex-wrap gap-1">
        {videos.map((v, i) => (
          <button
            key={v.youtubeId}
            role="tab"
            aria-selected={i === active}
            onClick={() => setActive(i)}
            className={[
              "rounded-full px-3 py-1 text-xs font-medium",
              i === active ? "bg-primary text-primary-foreground" : "bg-slate-100 text-muted",
            ].join(" ")}
          >
            סרטון {i + 1}
          </button>
        ))}
      </div>
      <SingleVideo video={videos[active]} />
    </div>
  );
}
