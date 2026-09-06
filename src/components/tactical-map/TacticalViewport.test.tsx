import { act, fireEvent, render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createInitialState } from "@/core/simulation";
import { SCENARIOS } from "@/data/scenarios";
import { TacticalViewport } from "./TacticalViewport";

const state = createInitialState(SCENARIOS[0], "viewport-test");
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe("optional Unreal viewport", () => {
  it("keeps the map usable and makes no network request without configuration", () => {
    vi.stubEnv("NEXT_PUBLIC_UNREAL_BRIDGE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_UNREAL_PLAYER_URL", "");
    const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
    render(<TacticalViewport state={state} />);
    expect(screen.getByRole("img", { name: "Carte tactique maritime" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Vue 3D/ })).toBeDisabled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("publishes current state and restores 2D when the renderer disconnects", async () => {
    vi.useFakeTimers();
    vi.stubEnv("NEXT_PUBLIC_UNREAL_BRIDGE_URL", "http://127.0.0.1:8787");
    vi.stubEnv("NEXT_PUBLIC_UNREAL_PLAYER_URL", "http://localhost:8081");
    let ready = true;
    const fetch = vi.fn(async (url: string) => ({ ok: true, json: async () => url.endsWith("health")
      ? { protocol: "maritime-scene/1", rendererReady: ready } : {} }));
    vi.stubGlobal("fetch", fetch);
    await act(async () => { render(<TacticalViewport state={state} />); });
    expect(screen.getByRole("button", { name: /Vue 3D/ })).toBeEnabled();
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: /Vue 3D/ })); });
    expect(screen.getByTitle("Simulation maritime Unreal Engine 5")).toBeInTheDocument();
    const publish = fetch.mock.calls.find(([url]) => url.endsWith("/frame"));
    expect(publish).toBeDefined();
    ready = false;
    await act(async () => { await vi.advanceTimersByTimeAsync(2600); });
    expect(screen.getByRole("img", { name: "Carte tactique maritime" })).toBeInTheDocument();
    expect(screen.queryByTitle("Simulation maritime Unreal Engine 5")).not.toBeInTheDocument();
  });

  it("falls back when a live bridge has no playable video", async () => {
    vi.useFakeTimers();
    vi.stubEnv("NEXT_PUBLIC_UNREAL_BRIDGE_URL", "http://127.0.0.1:8787");
    vi.stubEnv("NEXT_PUBLIC_UNREAL_PLAYER_URL", "http://localhost:8081");
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({
      protocol: "maritime-scene/1", rendererReady: true,
    }) })));
    await act(async () => { render(<TacticalViewport state={state} />); });
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: /Vue 3D/ })); });
    await act(async () => { await vi.advanceTimersByTimeAsync(32000); });
    expect(screen.getByRole("img", { name: "Carte tactique maritime" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Flux vidéo 3D indisponible");
  });
});
