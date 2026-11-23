"use client";

import { useEffect, useRef, useState } from "react";
import type { Viewer } from "@/lib/viewer/createViewer";
import { VIEWS } from "@/lib/viewer/views";

type Status = "loading" | "ready" | "error";

export default function BuildingViewer() {
  const hostRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [active, setActive] = useState<string | null>("front");
  const [spin, setSpin] = useState(false);
  const [showUi, setShowUi] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let viewer: Viewer | null = null;
    const params = new URLSearchParams(window.location.search);
    import("@/lib/viewer/createViewer")
      .then(({ createViewer }) => {
        if (cancelled || !hostRef.current) return;
        // ?match=imgN reproduces a reference camera for validation screenshots: no overlay.
        if (params.get("match")) setShowUi(false);
        const vec = (k: string) => params.get(k)?.split(",").map(Number) as [number, number, number] | undefined;
        const pos = vec("pos");
        viewer = createViewer(hostRef.current, {
          match: params.get("match"),
          custom: pos ? { aspect: 0, position: pos, target: vec("look"), fov: Number(params.get("fov") ?? 40) } : undefined,
          initialView: params.get("view") ?? "front",
          onReady: () => setStatus("ready"),
          onViewChange: setActive,
        });
        viewerRef.current = viewer;
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
      viewer?.dispose();
      viewerRef.current = null;
    };
  }, []);

  const toggleSpin = () => {
    const next = !spin;
    setSpin(next);
    viewerRef.current?.setAutoRotate(next);
  };

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#9fc0e4] text-white">
      <div ref={hostRef} className="absolute inset-0" />

      {status !== "ready" && (
        <div className="absolute inset-0 grid place-items-center bg-[#1d3557]/40 px-4 text-center backdrop-blur-sm">
          <p className="text-sm tracking-wide">
            {status === "loading" ? "Generating building geometry…" : "This viewer needs WebGL, which is not available in this browser."}
          </p>
        </div>
      )}

      {showUi && (
        <header className="pointer-events-none absolute left-4 right-4 top-4 sm:right-auto sm:max-w-sm">
          <div className="pointer-events-auto rounded-xl bg-black/35 px-4 py-3 shadow-lg backdrop-blur-md ring-1 ring-white/15">
            <h1 className="text-base font-semibold leading-tight sm:text-lg">Residential building — exterior</h1>
            <p className="mt-1 text-xs leading-relaxed text-white/80 sm:text-[13px]">
              Procedural 3D reconstruction from the five reference renders. Dimensions are estimated from perspective, not survey data.
            </p>
          </div>
        </header>
      )}

      {showUi && (
        <nav
          aria-label="Camera views"
          className="absolute bottom-4 left-4 right-4 flex flex-col items-center gap-2 sm:left-1/2 sm:right-auto sm:-translate-x-1/2"
        >
          <div className="flex max-w-full flex-wrap justify-center gap-1 rounded-xl bg-black/35 p-1 shadow-lg backdrop-blur-md ring-1 ring-white/15">
            {VIEWS.map((v) => (
              <button
                key={v.id}
                type="button"
                title={v.hint}
                aria-pressed={active === v.id}
                onClick={() => viewerRef.current?.setView(v.id)}
                className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors sm:text-sm ${
                  active === v.id ? "bg-white text-neutral-900" : "text-white/90 hover:bg-white/15"
                }`}
              >
                {v.label}
              </button>
            ))}
            <span className="mx-1 hidden w-px self-stretch bg-white/20 sm:block" aria-hidden />
            <button
              type="button"
              aria-pressed={spin}
              onClick={toggleSpin}
              className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors sm:text-sm ${
                spin ? "bg-white text-neutral-900" : "text-white/90 hover:bg-white/15"
              }`}
            >
              Auto-rotate
            </button>
          </div>
          <p className="rounded-md bg-black/25 px-2 py-1 text-center text-[11px] text-white/85 backdrop-blur-sm sm:text-xs">
            Drag to orbit and tilt · scroll or pinch to zoom · right-drag or two fingers to pan
          </p>
        </nav>
      )}
    </div>
  );
}
