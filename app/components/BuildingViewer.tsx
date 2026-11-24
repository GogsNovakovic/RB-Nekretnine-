"use client";

import { useEffect, useRef, useState } from "react";
import type { Viewer } from "@/lib/viewer/createViewer";

type Status = "loading" | "ready" | "error";

export default function BuildingViewer() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    let cancelled = false;
    let viewer: Viewer | null = null;
    const params = new URLSearchParams(window.location.search);
    import("@/lib/viewer/createViewer")
      .then(({ createViewer }) => {
        if (cancelled || !hostRef.current) return;
        const vec = (k: string) => params.get(k)?.split(",").map(Number) as [number, number, number] | undefined;
        const pos = vec("pos");
        viewer = createViewer(hostRef.current, {
          // ?match=imgN reproduces a reference camera for validation screenshots
          match: params.get("match"),
          custom: pos ? { aspect: 0, position: pos, target: vec("look"), fov: Number(params.get("fov") ?? 40) } : undefined,
          initialView: params.get("view") ?? "start",
          onReady: () => setStatus("ready"),
        });
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
      viewer?.dispose();
    };
  }, []);

  return (
    // Neutral placeholder colour behind the transparent canvas; the real background comes later.
    <div className="fixed inset-0 overflow-hidden bg-[#d1d4d8]">
      <div ref={hostRef} className="absolute inset-0" />

      {status !== "ready" && (
        <div className="absolute inset-0 grid place-items-center px-4 text-center">
          <p className="text-sm tracking-wide text-neutral-600">
            {status === "loading" ? "Generating building geometry…" : "This viewer needs WebGL, which is not available in this browser."}
          </p>
        </div>
      )}
    </div>
  );
}
