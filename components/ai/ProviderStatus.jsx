"use client";

import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";

export function ProviderStatus() {
  const [configuration, setConfiguration] = useState(null);
  useEffect(() => { fetch("/api/platform/config").then((response) => response.ok ? response.json() : null).then((data) => setConfiguration(data?.configuration || null)).catch(() => undefined); }, []);
  if (!configuration) return <Card className="p-4 text-xs text-zinc-500"><LoaderCircle className="mr-2 inline animate-spin" size={14} />Checking Google Cloud configuration…</Card>;
  const ready = configuration.vertexAi.configured && configuration.storage.configured;
  return <Card className={`p-4 ${ready ? "border-emerald-400/20 bg-emerald-400/10" : "border-amber-400/30 bg-amber-400/10"}`}><p className={`text-sm font-semibold ${ready ? "text-emerald-300" : "text-amber-200"}`}>{ready ? "Google AI infrastructure is ready" : "Google AI infrastructure needs configuration"}</p><p className={`mt-1 text-xs leading-5 ${ready ? "text-emerald-100/70" : "text-amber-100/70"}`}>{ready ? "Vertex AI and Google Cloud Storage are configured server-side." : "Add the server-side Google Cloud project, credentials, and storage bucket. No mock result will be returned."}</p></Card>;
}
