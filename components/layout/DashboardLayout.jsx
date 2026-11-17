"use client";
import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
export function DashboardLayout({ children, title = "Dashboard" }) { const [open, setOpen] = useState(false); return <div className="flex min-h-screen bg-[#09090b]"><Sidebar open={open} onClose={() => setOpen(false)} />{open && <button className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setOpen(false)} aria-label="Close navigation overlay" />}<div className="min-w-0 flex-1"><Header title={title} onMenu={() => setOpen(true)} /><main className="mx-auto max-w-[1500px] p-5 sm:p-8">{children}</main></div></div>; }
