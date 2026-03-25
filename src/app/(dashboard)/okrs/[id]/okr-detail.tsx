"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Target,
  TrendingUp,
  ChevronRight,
  Loader2,
  TreePine,
} from "lucide-react";

interface KeyResult {
  id: string;
  title: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  progress: number;
}

interface ChildObjective {
  id: string;
  title: string;
  type: string;
  status: string;
  progress: number;
  owner: { name: string };
  keyResults: KeyResult[];
  childObjectives?: ChildObjective[];
}

interface ObjectiveData {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  progress: number;
  owner: { name: string };
  department: { name: string } | null;
  cycle: { name: string };
  parentObjective: { id: string; title: string; type: string } | null;
  keyResults: KeyResult[];
  childObjectives: ChildObjective[];
  createdAt: string;
  updatedAt: string;
}

interface Props {
  objective: ObjectiveData;
  canEdit: boolean;
  userRole: string;
}

export function OkrDetail({ objective, canEdit, userRole }: Props) {
  const router = useRouter();
  const [updatingKR, setUpdatingKR] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ON_TRACK":
      case "COMPLETED":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "AT_RISK":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "BEHIND":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const getProgressBarColor = (progress: number) => {
    if (progress >= 70) return "bg-emerald-500";
    if (progress >= 40) return "bg-amber-500";
    return "bg-red-500";
  };

  const updateKeyResult = async (krId: string, newValue: number) => {
    setUpdatingKR(krId);
    await fetch(`/api/okrs/${objective.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keyResultId: krId, currentValue: newValue }),
    });
    setUpdatingKR(null);
    router.refresh();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back */}
      <Link
        href="/okrs"
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="w-4 h-4" /> Back to OKRs
      </Link>

      {/* Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="px-2.5 py-0.5 text-xs rounded-full border bg-slate-100 text-slate-600">
                {objective.type}
              </span>
              <span
                className={`px-2.5 py-0.5 text-xs rounded-full border ${getStatusColor(objective.status)}`}
              >
                {objective.status.replace(/_/g, " ")}
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-800 mb-1">
              {objective.title}
            </h1>
            {objective.description && (
              <p className="text-sm text-slate-500">{objective.description}</p>
            )}
            <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
              <span>Owner: <strong>{objective.owner.name}</strong></span>
              {objective.department && (
                <span>Dept: <strong>{objective.department.name}</strong></span>
              )}
              <span>Cycle: <strong>{objective.cycle.name}</strong></span>
            </div>
          </div>
          <div className="text-center">
            <div className="relative w-20 h-20">
              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 72 72">
                <circle cx="36" cy="36" r="30" fill="none" stroke="#e2e8f0" strokeWidth="6" />
                <circle
                  cx="36"
                  cy="36"
                  r="30"
                  fill="none"
                  stroke={objective.progress >= 70 ? "#10b981" : objective.progress >= 40 ? "#f59e0b" : "#ef4444"}
                  strokeWidth="6"
                  strokeDasharray={`${(objective.progress / 100) * 188.5} 188.5`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-slate-800">
                {Math.round(objective.progress)}%
              </span>
            </div>
          </div>
        </div>

        {/* Parent alignment */}
        {objective.parentObjective && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-xs text-blue-600 font-medium mb-1">Aligned to:</p>
            <Link
              href={`/okrs/${objective.parentObjective.id}`}
              className="text-sm text-blue-700 font-medium hover:underline flex items-center gap-1"
            >
              <Target className="w-3.5 h-3.5" />
              [{objective.parentObjective.type}] {objective.parentObjective.title}
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>

      {/* Key Results */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            Key Results ({objective.keyResults.length})
          </h2>
        </div>
        <div className="divide-y divide-slate-100">
          {objective.keyResults.map((kr) => (
            <div key={kr.id} className="px-6 py-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-slate-800">{kr.title}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-600">
                    {kr.currentValue} / {kr.targetValue} {kr.unit}
                  </span>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded ${
                      kr.progress >= 70
                        ? "bg-emerald-50 text-emerald-700"
                        : kr.progress >= 40
                        ? "bg-amber-50 text-amber-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    {Math.round(kr.progress)}%
                  </span>
                </div>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full mb-3">
                <div
                  className={`h-2.5 rounded-full transition-all duration-500 ${getProgressBarColor(kr.progress)}`}
                  style={{ width: `${kr.progress}%` }}
                />
              </div>
              {canEdit && (
                <div className="flex items-center gap-3">
                  <label className="text-xs text-slate-500">Update progress:</label>
                  <input
                    type="range"
                    min={0}
                    max={kr.targetValue}
                    step={kr.targetValue > 100 ? 1 : 0.1}
                    defaultValue={kr.currentValue}
                    className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    onChange={(e) => {
                      // Debounced update on mouse up
                    }}
                    onMouseUp={(e) => {
                      const val = parseFloat((e.target as HTMLInputElement).value);
                      updateKeyResult(kr.id, val);
                    }}
                    onTouchEnd={(e) => {
                      const val = parseFloat((e.target as HTMLInputElement).value);
                      updateKeyResult(kr.id, val);
                    }}
                  />
                  {updatingKR === kr.id && (
                    <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Child Objectives (Cascading) */}
      {objective.childObjectives.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
              <TreePine className="w-5 h-5 text-emerald-500" />
              Aligned Objectives ({objective.childObjectives.length})
            </h2>
          </div>
          <div className="divide-y divide-slate-100">
            {objective.childObjectives.map((child) => (
              <CascadeItem key={child.id} obj={child} level={0} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CascadeItem({ obj, level }: { obj: ChildObjective; level: number }) {
  return (
    <>
      <Link
        href={`/okrs/${obj.id}`}
        className="block px-6 py-3 hover:bg-slate-50 transition-colors"
        style={{ paddingLeft: `${24 + level * 24}px` }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-2 h-2 rounded-full ${
                obj.status === "COMPLETED" || obj.status === "ON_TRACK"
                  ? "bg-emerald-500"
                  : obj.status === "AT_RISK"
                  ? "bg-amber-500"
                  : "bg-red-500"
              }`}
            />
            <div>
              <p className="text-sm font-medium text-slate-800">{obj.title}</p>
              <p className="text-xs text-slate-500">
                {obj.type} &middot; {obj.owner.name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-24 h-1.5 bg-slate-100 rounded-full">
              <div
                className="h-1.5 bg-blue-500 rounded-full"
                style={{ width: `${obj.progress}%` }}
              />
            </div>
            <span className="text-xs font-medium text-slate-600 w-10 text-right">
              {Math.round(obj.progress)}%
            </span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>
        </div>
      </Link>
      {obj.childObjectives?.map((child) => (
        <CascadeItem key={child.id} obj={child} level={level + 1} />
      ))}
    </>
  );
}
