"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { CycleForm } from "./cycle-form";

export function NewCycleButton({ type }: { type: "okr" | "review" }) {
  const [showForm, setShowForm] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowForm(true)}
        className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white rounded-lg text-xs font-medium hover:bg-blue-600 transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        New
      </button>
      {showForm && <CycleForm type={type} onClose={() => setShowForm(false)} />}
    </>
  );
}
