"use client";

import { useState } from "react";

type FreeInstructionInputProps = {
  onSend: (text: string) => void;
  disabled?: boolean;
};

/** Saisie d'instruction libre (ex : « NavigationAgent, et C-042 ? »). */
export function FreeInstructionInput({
  onSend,
  disabled,
}: FreeInstructionInputProps) {
  const [text, setText] = useState("");

  function send() {
    if (!text.trim()) return;
    onSend(text);
    setText("");
  }

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={text}
        disabled={disabled}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") send();
        }}
        placeholder="Interroge un agent… ex : NavigationAgent, et C-042 ?"
        className="flex-1 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none disabled:opacity-50"
      />
      <button
        onClick={send}
        disabled={disabled}
        className="rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-sky-400 disabled:opacity-40"
      >
        Envoyer
      </button>
    </div>
  );
}
