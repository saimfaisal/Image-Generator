"use client";

import { ArrowUp, Paperclip } from "lucide-react";

export function ChatInput({ value, onChange, onSubmit, disabled }) {
  return <form onSubmit={onSubmit} className="flex items-end gap-2 rounded-2xl border border-white/[.09] bg-[#18181f] p-2 shadow-2xl shadow-black/20"><button type="button" disabled className="rounded-xl p-3 text-zinc-600" aria-label="Attachments are not available yet"><Paperclip size={18} /></button><textarea value={value} onChange={(event) => onChange(event.target.value)} rows={1} maxLength={12000} placeholder="Ask PixelForge anything…" className="max-h-32 min-h-11 flex-1 resize-none bg-transparent px-2 py-3 text-sm outline-none placeholder:text-zinc-600" disabled={disabled} /><button type="submit" disabled={disabled || !value.trim()} className="rounded-xl bg-violet-500 p-3 text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Send message"><ArrowUp size={18} /></button></form>;
}
