"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { TacticalEvent } from "@/types";
import { SEVERITY_COLOR } from "@/components/ui-labels";

type TimelineProps = {
  events: TacticalEvent[];
  onSelectContact?: (id: string) => void;
};

/** Frise des événements par tour ; clic = recentrer sur le contact lié. */
export function Timeline({ events, onSelectContact }: TimelineProps) {
  return (
    <section className="flex h-full flex-col rounded-xl border border-slate-700/60 bg-slate-900/50 backdrop-blur">
      <h2 className="border-b border-slate-700 px-3 py-2 text-sm font-semibold text-slate-300">
        Timeline
      </h2>
      <ol className="flex-1 space-y-2 overflow-y-auto p-3">
        <AnimatePresence initial={false}>
        {[...events].reverse().map((e) => (
          <motion.li
            key={e.id}
            layout
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => e.contactId && onSelectContact?.(e.contactId)}
            className={`rounded-md bg-slate-900/50 p-2 ${
              e.contactId ? "cursor-pointer hover:bg-slate-900" : ""
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${SEVERITY_COLOR[e.severity]}`}
              />
              <span className="text-xs text-slate-500">T{e.turn}</span>
              <span className="text-sm font-medium text-slate-200">
                {e.title}
              </span>
            </div>
            <p className="mt-0.5 pl-4 text-xs text-slate-400">{e.description}</p>
          </motion.li>
        ))}
        </AnimatePresence>
      </ol>
    </section>
  );
}
