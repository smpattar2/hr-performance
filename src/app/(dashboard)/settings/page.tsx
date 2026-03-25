import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { Settings, Target, ClipboardCheck } from "lucide-react";
import { NewCycleButton } from "./settings-client";
import { CycleStatusToggle } from "./cycle-status-toggle";

export default async function SettingsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const role = (session.user as Record<string, unknown>).role as string;
  if (role !== "ADMIN") redirect("/dashboard");

  const [okrCycles, reviewCycles] = await Promise.all([
    prisma.okrCycle.findMany({ orderBy: { startDate: "desc" } }),
    prisma.reviewCycle.findMany({ orderBy: { startDate: "desc" } }),
  ]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "CLOSED": return "bg-slate-50 text-slate-500 border-slate-200";
      default: return "bg-amber-50 text-amber-700 border-amber-200";
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
        <p className="text-slate-500 mt-1">Manage cycles, scoring, and system configuration</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* OKR Cycles */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-500" />
              OKR Cycles
            </h3>
            <NewCycleButton type="okr" />
          </div>
          <div className="divide-y divide-slate-100">
            {okrCycles.length === 0 ? (
              <div className="px-6 py-8 text-center text-slate-400 text-sm">No OKR cycles yet</div>
            ) : (
              okrCycles.map((cycle) => (
                <div key={cycle.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{cycle.name}</p>
                    <p className="text-xs text-slate-500">
                      Q{cycle.quarter} {cycle.year} &middot;{" "}
                      {new Date(cycle.startDate).toLocaleDateString()} &ndash; {new Date(cycle.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusBadge(cycle.status)}`}>
                      {cycle.status}
                    </span>
                    <CycleStatusToggle type="okr" id={cycle.id} currentStatus={cycle.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Review Cycles */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-amber-500" />
              Review Cycles
            </h3>
            <NewCycleButton type="review" />
          </div>
          <div className="divide-y divide-slate-100">
            {reviewCycles.length === 0 ? (
              <div className="px-6 py-8 text-center text-slate-400 text-sm">No review cycles yet</div>
            ) : (
              reviewCycles.map((cycle) => (
                <div key={cycle.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{cycle.name}</p>
                    <p className="text-xs text-slate-500">
                      {cycle.year} &middot;{" "}
                      {new Date(cycle.startDate).toLocaleDateString()} &ndash; {new Date(cycle.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusBadge(cycle.status)}`}>
                      {cycle.status}
                    </span>
                    <CycleStatusToggle type="review" id={cycle.id} currentStatus={cycle.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Scoring Config */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-4">
          <Settings className="w-5 h-5 text-slate-400" />
          Review Scoring Configuration
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 text-center border border-blue-200">
            <p className="text-3xl font-bold text-blue-700">20%</p>
            <p className="text-sm text-blue-600 mt-1 font-medium">Self Assessment</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 text-center border border-purple-200">
            <p className="text-3xl font-bold text-purple-700">40%</p>
            <p className="text-sm text-purple-600 mt-1 font-medium">Team Lead Review</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-4 text-center border border-emerald-200">
            <p className="text-3xl font-bold text-emerald-700">40%</p>
            <p className="text-sm text-emerald-600 mt-1 font-medium">Management Review</p>
          </div>
        </div>
        <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
          <p className="text-sm text-slate-600">
            <strong>Rating Scale:</strong> 1 (Needs Improvement) &middot; 2 (Below Expectations) &middot; 3 (Meets Expectations) &middot; 4 (Exceeds Expectations) &middot; 5 (Outstanding)
          </p>
        </div>
        <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
          <p className="text-sm text-slate-600">
            <strong>Competencies:</strong> Goal Achievement &middot; Technical Skills &middot; Communication &middot; Leadership & Initiative &middot; Teamwork & Collaboration
          </p>
        </div>
      </div>
    </div>
  );
}
