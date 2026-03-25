"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck, Loader2 } from "lucide-react";

export function NotificationActions() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const markAllRead = async () => {
    setLoading(true);
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAll: true }),
    });
    setLoading(false);
    router.refresh();
  };

  return (
    <button
      onClick={markAllRead}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <CheckCheck className="w-4 h-4" />
      )}
      Mark all read
    </button>
  );
}
