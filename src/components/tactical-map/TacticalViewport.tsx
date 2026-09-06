"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { TacticalMap, type TacticalMapProps } from "./TacticalMap";
import { toSceneSnapshot } from "@/core/scene/scene-adapter";
import { healthSchema, type SceneCamera } from "../../../modules/maritime-sim/protocol/schema";

const DEFAULT_CAMERA: SceneCamera = {
  auto: true, yawDeg: 135, pitchDeg: -35, distanceM: 1600, altitudeOffsetM: 0,
};
const button = "rounded bg-slate-800 px-3 py-1.5 text-sm text-slate-100 hover:bg-slate-700 disabled:opacity-40";

export function TacticalViewport(props: TacticalMapProps) {
  const bridgeUrl = process.env.NEXT_PUBLIC_UNREAL_BRIDGE_URL ?? "";
  const playerUrl = process.env.NEXT_PUBLIC_UNREAL_PLAYER_URL ?? "";
  const configured = !!bridgeUrl && !!playerUrl;
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState(false);
  const [streamReady, setStreamReady] = useState(false);
  const [notice, setNotice] = useState("");
  const [camera, setCamera] = useState<SceneCamera>(DEFAULT_CAMERA);
  const iframe = useRef<HTMLIFrameElement>(null);
  const revision = useRef(0);
  const snapshot = useMemo(() => toSceneSnapshot(props.state), [props.state]);
  const latest = useRef({ snapshot, camera });
  useEffect(() => {
    latest.current = { snapshot, camera: { ...camera, targetId: props.selectedContactId || undefined } };
    revision.current++;
  }, [snapshot, camera, props.selectedContactId]);

  useEffect(() => {
    if (!configured) return;
    let disposed = false;
    const abort = new AbortController();
    async function probe() {
      try {
        const response = await fetch(`${bridgeUrl}/health`, {
          signal: AbortSignal.any([abort.signal, AbortSignal.timeout(2000)]), cache: "no-store",
        });
        const health = healthSchema.parse(await response.json());
        if (!disposed) {
          setReady(response.ok && health.rendererReady);
          if (!health.rendererReady) setActive(false);
        }
      } catch {
        if (!disposed) { setReady(false); setActive(false); }
      }
    }
    void probe();
    const timer = setInterval(probe, 2500);
    return () => { disposed = true; abort.abort(); clearInterval(timer); };
  }, [configured, bridgeUrl]);

  useEffect(() => {
    if (!active) return;
    let disposed = false;
    let busy = false;
    let sentRevision = -1;
    let lastSent = -Infinity;
    const owner = crypto.randomUUID();
    const abort = new AbortController();
    async function publish() {
      if (busy) return;
      if (sentRevision === revision.current && performance.now() - lastSent < 2000) return;
      busy = true;
      const publishingRevision = revision.current;
      try {
        const response = await fetch(`${bridgeUrl}/frame`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ owner, revision: publishingRevision, ...latest.current }),
          signal: AbortSignal.any([abort.signal, AbortSignal.timeout(2500)]),
        });
        if (!response.ok) throw new Error(response.status === 409
          ? "Le module 3D est utilisé par une autre session."
          : "Synchronisation 3D interrompue.");
        sentRevision = publishingRevision;
        lastSent = performance.now();
      } catch (error) {
        if (!disposed) {
          setNotice(error instanceof Error ? error.message : "Module 3D indisponible.");
          setActive(false);
        }
      } finally { busy = false; }
    }
    void publish();
    const timer = setInterval(publish, 200);
    return () => {
      disposed = true; abort.abort(); clearInterval(timer);
      void fetch(`${bridgeUrl}/frame`, { method: "DELETE",
        headers: { "X-Scene-Owner": owner }, keepalive: true,
        signal: AbortSignal.timeout(2000) }).catch(() => {});
    };
  }, [active, bridgeUrl]);

  useEffect(() => {
    if (!active) return;
    let lastFrame = performance.now();
    let started = false;
    const origin = new URL(playerUrl).origin;
    function onMessage(event: MessageEvent) {
      if (event.origin !== origin || event.source !== iframe.current?.contentWindow ||
        event.data?.type !== "maritime-stream") return;
      if (event.data.status === "playing") {
        lastFrame = performance.now(); started = true; setStreamReady(true);
      }
    }
    window.addEventListener("message", onMessage);
    const timer = setInterval(() => {
      if (performance.now() - lastFrame > (started ? 8000 : 30000)) {
        setNotice("Flux vidéo 3D indisponible : retour à la carte 2D.");
        setActive(false);
      }
    }, 1000);
    return () => { window.removeEventListener("message", onMessage); clearInterval(timer); };
  }, [active, playerUrl]);

  function adjust(patch: Partial<SceneCamera>) {
    setCamera((c) => ({ ...c, ...patch, auto: false }));
  }
  return <div className="flex h-full min-h-0 flex-col gap-2">
    <div className="flex flex-wrap items-center gap-2" aria-label="Affichage de la situation">
      <button className={button} aria-pressed={!active} onClick={() => setActive(false)}>Carte 2D</button>
      <button className={button} aria-pressed={active} disabled={!ready}
        title={configured ? "Vue Unreal Engine" : "Module 3D optionnel non configuré"}
        onClick={() => { setNotice(""); setStreamReady(false); setActive(true); }}>Vue 3D · Unreal</button>
      <span role="status" className="text-xs text-slate-400">
        {notice || (!configured ? "3D optionnelle non installée" : !ready ? "Module 3D hors ligne" : active
          ? streamReady ? "Vue d’exercice · positions estimées" : "Connexion vidéo…" : "Module 3D disponible")}
      </span>
    </div>
    <div className="relative min-h-0 flex-1">
      {!active ? <TacticalMap {...props} /> : <>
        <iframe ref={iframe} title="Simulation maritime Unreal Engine 5"
          src={`${playerUrl}${playerUrl.includes("?") ? "&" : "?"}parentOrigin=${encodeURIComponent(window.location.origin)}`}
          allow="autoplay; fullscreen" className="h-full w-full rounded-xl border border-slate-700"
          sandbox="allow-scripts allow-same-origin allow-pointer-lock" />
        {streamReady && <div className="absolute inset-0 touch-none rounded-xl"
          role="region" aria-label="Caméra 3D : glisser pour orbiter, molette pour zoomer"
          onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); }}
          onPointerMove={(e) => {
            if (e.currentTarget.hasPointerCapture(e.pointerId)) setCamera((c) => ({ ...c,
              auto: false, yawDeg: (c.yawDeg + e.movementX * 0.3) % 360,
              pitchDeg: Math.max(-85, Math.min(85, c.pitchDeg - e.movementY * 0.3)) }));
          }}
          onPointerUp={(e) => e.currentTarget.releasePointerCapture(e.pointerId)}
          onWheel={(e) => setCamera((c) => ({ ...c, auto: false,
            distanceM: Math.max(20, Math.min(30000, c.distanceM * (e.deltaY > 0 ? 1.12 : 0.89))) }))}
        />}
      </>}
    </div>
    {active && <div className="flex flex-wrap items-center gap-2" aria-label="Commandes caméra 3D">
      <button className={button} aria-pressed={camera.auto}
        onClick={() => setCamera({ ...DEFAULT_CAMERA, auto: true })}>Cadrage auto</button>
      <button className={button} onClick={() => setCamera({ ...DEFAULT_CAMERA, auto: false })}>Recentrer</button>
      <button className={button} aria-label="Tourner à gauche" onClick={() => adjust({ yawDeg: (camera.yawDeg - 15) % 360 })}>↶</button>
      <button className={button} aria-label="Tourner à droite" onClick={() => adjust({ yawDeg: (camera.yawDeg + 15) % 360 })}>↷</button>
      <button className={button} aria-label="Zoomer" onClick={() => adjust({ distanceM: Math.max(20, camera.distanceM / 1.5) })}>+</button>
      <button className={button} aria-label="Dézoomer" onClick={() => adjust({ distanceM: Math.min(30000, camera.distanceM * 1.5) })}>−</button>
      <button className={button} onClick={() => adjust({ altitudeOffsetM: Math.min(15000, camera.altitudeOffsetM + 100) })}>Monter</button>
      <button className={button} onClick={() => adjust({ altitudeOffsetM: Math.max(-1500, camera.altitudeOffsetM - 100) })}>Descendre</button>
      <button className={button} onClick={() => adjust({ pitchDeg: 0, altitudeOffsetM: -40, distanceM: 200 })}>Sous la mer</button>
      <select className={button} aria-label="Contact à observer" value={props.selectedContactId ?? ""}
        onChange={(e) => props.onSelectContact?.(e.target.value)}>
        <option value="">Vue d’ensemble</option>
        {props.state.contacts.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
      </select>
    </div>}
  </div>;
}
