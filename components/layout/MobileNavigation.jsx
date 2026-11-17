"use client";
import { X } from "lucide-react";
export function MobileNavigation({ open, onClose, children }) { if (!open) return null; return <div className="fixed inset-0 z-50 lg:hidden"><button className="absolute inset-0 bg-black/70" onClick={onClose} aria-label="Close navigation" /><div className="relative h-full w-72">{children}<button onClick={onClose} className="absolute right-4 top-6 text-zinc-400" aria-label="Close navigation"><X size={20} /></button></div></div>; }
