"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { AgentMessage } from "@/types";
import { AGENT_EMOJI } from "@/components/ui-labels";

type AgentConsoleProps = {
  messages: AgentMessage[];
  onSelectContact?: (id: string) => void;
};

/** Console des messages d'agents (auteur, confiance, skills, contacts liés). */
export function AgentConsole({ messages, onSelectContact }: AgentConsoleProps) {
  return (
    <section className="flex h-full flex-col rounded-xl border border-slate-700/60 bg-slate-900/50 backdrop-blur">
      <h2 className="border-b border-slate-700 px-3 py-2 text-sm font-semibold text-slate-300">
        Console agents
      </h2>
      <ul className="flex-1 space-y-2 overflow-y-auto p-3">
        {messages.length === 0 && (
          <li className="text-sm text-slate-500">
            Aucun message pour l&apos;instant.
          </li>
        )}
        <AnimatePresence initial={false}>
        {[...messages].reverse().map((m) => (
          <motion.li
            key={m.id}
            layout
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="rounded-md bg-slate-900/60 p-2.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-sky-300">
                {AGENT_EMOJI[m.agentId] ?? "🤖"} {m.agentName}
              </span>
              {typeof m.confidence === "number" && (
                <span className="text-xs text-slate-400">
                  conf. {Math.round(m.confidence * 100)} %
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-slate-200">{m.message}</p>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {m.referencedContacts.map((c) => (
                <button
                  key={c}
                  onClick={() => onSelectContact?.(c)}
                  className="rounded bg-slate-700 px-1.5 py-0.5 text-[11px] text-amber-300 hover:bg-slate-600"
                >
                  {c}
                </button>
              ))}
              {m.usedSkills.map((s) => (
                <span
                  key={s}
                  className="rounded bg-slate-700/60 px-1.5 py-0.5 text-[11px] text-slate-400"
                >
                  {s}
                </span>
              ))}
            </div>
          </motion.li>
        ))}
        </AnimatePresence>
      </ul>
    </section>
  );
}
