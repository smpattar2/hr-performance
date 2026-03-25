"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

export function NominationActions({ nominationId }: { nominationId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const handleAction = async (status: "APPROVED" | "REJECTED") => {
    setLoading(status);
    await fetch(`/api/feedback/nominations/${nominationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setLoading(null);
    router.refresh();
  };

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={() => handleAction("APPROVED")}
        disabled={loading !== null}
        className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500 text-white rounded text-xs font-medium hover:bg-emerald-600 disabled:opacity-50"
      >
        {loading === "APPROVED" ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <CheckCircle2 className="w-3.5 h-3.5" />
        )}
        Approve
      </button>
      <button
        onClick={() => handleAction("REJECTED")}
        disabled={loading !== null}
        className="flex items-center gap-1 px-2.5 py-1 bg-red-500 text-white rounded text-xs font-medium hover:bg-red-600 disabled:opacity-50"
      >
        {loading === "REJECTED" ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <XCircle className="w-3.5 h-3.5" />
        )}
        Reject
      </button>
    </div>
  );
}
