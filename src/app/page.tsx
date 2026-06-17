"use client";

import { useGameStore } from "@/store/game-store";
import { ScenarioSelector } from "@/components/scenario/ScenarioSelector";
import { GameScreen } from "@/components/game/GameScreen";
import { DebriefPanel } from "@/components/debrief/DebriefPanel";

export default function Home() {
  const screen = useGameStore((s) => s.screen);

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100">
      {screen === "select" && <ScenarioSelector />}
      {screen === "playing" && <GameScreen />}
      {screen === "debrief" && <DebriefPanel />}
    </main>
  );
}
