"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { Viewer } from "@/lib/viewer/createViewer";
import { MATCH } from "@/lib/viewer/views";

type Status = "loading" | "ready" | "webgl" | "build" | "context-lost";

const MESSAGES: Record<Exclude<Status, "ready">, string> = {
  loading: "Generating the building…",
  webgl: "This viewer needs WebGL, which is not available in this browser.",
  build: "The model could not be generated. Reload the page to try again.",
  "context-lost": "The graphics context was lost. Reload the page to continue.",
};

const noop = () => () => {};
const useSearch = () => useSyncExternalStore(noop, () => window.location.search, () => "");
const useCoarsePointer = () =>
  useSyncExternalStore(
    (cb) => {
      const mq = matchMedia("(pointer: coarse)");
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => matchMedia("(pointer: coarse)").matches,
    () => false,
  );

export default function BuildingViewer() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [interacted, setInteracted] = useState(false);
  const coarse = useCoarsePointer();
  const params = new URLSearchParams(useSearch());
  // ?match=img1 … reproduces a reference camera; ?overlay=0.5 lays the reference over it.
  const matchId = params.get("match");
  const match = matchId ? MATCH[matchId] : undefined;
  const overlay = Math.min(1, Math.max(0, Number(params.get("overlay") ?? 0)));
  const view = params.get("view");

  useEffect(() => {
    let cancelled = false;
    let viewer: Viewer | null = null;
    import("@/lib/viewer/createViewer")
      .then(({ createViewer }) => {
        if (cancelled || !hostRef.current) return;
        viewer = createViewer(hostRef.current, {
          match: match ? matchId : null,
          initialView: view,
          onReady: () => setStatus("ready"),
          onError: (reason) => setStatus(reason),
          onInteract: () => setInteracted(true),
        });
        // development only: exposes reset() and stats() for testing from the console
        if (viewer && process.env.NODE_ENV !== "production") (window as unknown as { __viewer?: Viewer }).__viewer = viewer;
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) setStatus("build");
      });
    return () => {
      cancelled = true;
      viewer?.dispose();
    };
  }, [match, matchId, view]);

  const hint = coarse
    ? ["Drag to rotate", "Pinch to zoom", "Two fingers to pan", "Double-tap to reset"]
    : ["Drag to rotate", "Scroll to zoom", "Right-drag to pan", "Double-click to reset"];

  return (
    <div className="viewer-backdrop fixed inset-0 overflow-hidden">
      <div
        className="absolute inset-0 m-auto"
        style={match ? { width: `min(100vw, ${100 * match.aspect}dvh)`, height: `min(100dvh, ${100 / match.aspect}vw)` } : undefined}
      >
        <div ref={hostRef} className="absolute inset-0" aria-describedby="viewer-help" />
        {match && overlay > 0 && (
          // eslint-disable-next-line @next/next/no-img-element -- validation overlay, sized to the canvas
          <img src={match.image} alt="" className="pointer-events-none absolute inset-0 h-full w-full" style={{ opacity: overlay }} />
        )}
      </div>

      <p id="viewer-help" className="sr-only">
        Drag or use the arrow keys to rotate and tilt. Scroll, pinch, or press plus and minus to zoom. Right-drag or drag with two fingers
        to pan. Double-click, double-tap, or press R to reset the view.
      </p>

      {status !== "ready" && (
        <div className="absolute inset-0 grid place-items-center px-6 text-center" role="status" aria-live="polite">
          <p className="text-sm tracking-wide text-neutral-600">{MESSAGES[status]}</p>
        </div>
      )}

      {status === "ready" && !match && (
        <p
          aria-hidden="true"
          className={`pointer-events-none absolute inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] mx-auto w-fit max-w-[calc(100vw-2rem)] rounded-full bg-white/70 px-4 py-1.5 text-center text-[11px] leading-snug text-neutral-700 shadow-sm backdrop-blur transition-opacity duration-700 sm:text-xs ${
            interacted ? "opacity-0" : "opacity-100"
          }`}
        >
          {hint.map((h, i) => (
            <span key={h} className="whitespace-nowrap">
              {i > 0 && <span className="px-1.5 text-neutral-400">·</span>}
              {h}
            </span>
          ))}
        </p>
      )}
    </div>
  );
}
