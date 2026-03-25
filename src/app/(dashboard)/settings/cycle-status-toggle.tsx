"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface Props {
  type: "okr" | "review";
  id: string;
  currentStatus: string;
}

const statusFlow: Record<string, string[]> = {
  DRAFT: ["ACTIVE"],
  ACTIVE: ["CLOSED"],
  CLOSED: [],
};

export function CycleStatusToggle({ type, id, currentStatus }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const nextStatuses = statusFlow[currentStatus] || [];

  if (nextStatuses.length === 0) return null;

  const handleToggle = async (newStatus: string) => {
    setLoading(true);
    await fetch("/api/settings/cycles", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, id, status: newStatus }),
    });
    setLoading(false);
    router.refresh();
  };

  return (
    <div className="flex items-center gap-1">
      {nextStatuses.map((ns) => (
        <button
          key={ns}
          onClick={() => handleToggle(ns)}
          disabled={loading}
          className={`text-xs px-2 py-1 rounded font-medium transition-colors disabled:opacity-50 ${
            ns === "ACTIVE"
              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : ns === "ACTIVE" ? "Activate" : "Close"}
        </button>
      ))}
    </div>
  );
}
