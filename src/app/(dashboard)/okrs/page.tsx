import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { Target, Plus, ChevronDown } from "lucide-react";
import Link from "next/link";

export default async function OkrsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const role = (session.user as Record<string, unknown>).role as string;
  const userId = session.user.id;

  const cycles = await prisma.okrCycle.findMany({
    orderBy: { startDate: "desc" },
  });

  const objectives = await prisma.objective.findMany({
    where:
      role === "ADMIN"
        ? {}
        : role === "TEAM_LEAD"
        ? { OR: [{ ownerId: userId }, { type: { in: ["COMPANY", "DEPARTMENT"] } }] }
        : { OR: [{ ownerId: userId }, { type: "COMPANY" }] },
    include: {
      keyResults: true,
      owner: true,
      department: true,
      childObjectives: {
        include: {
          keyResults: true,
          owner: true,
          childObjectives: {
            include: { keyResults: true, owner: true },
          },
        },
      },
    },
    orderBy: [{ type: "asc" }, { createdAt: "desc" }],
  });

  const companyOkrs = objectives.filter((o) => o.type === "COMPANY");
  const deptOkrs = objectives.filter((o) => o.type === "DEPARTMENT");
  const individualOkrs = objectives.filter((o) => o.type === "INDIVIDUAL");

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      ON_TRACK: "bg-emerald-50 text-emerald-700 border-emerald-200",
      AT_RISK: "bg-amber-50 text-amber-700 border-amber-200",
      BEHIND: "bg-red-50 text-red-700 border-red-200",
      COMPLETED: "bg-blue-50 text-blue-700 border-blue-200",
    };
    return colors[status] || "bg-slate-50 text-slate-700 border-slate-200";
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">OKR Management</h1>
          <p className="text-slate-500 mt-1">
            Track and manage objectives & key results
          </p>
        </div>
        {(role === "ADMIN" || role === "TEAM_LEAD") && (
          <Link
            href="/okrs/create"
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Objective
          </Link>
        )}
      </div>

      {/* Active Cycle */}
      {cycles.filter((c) => c.status === "ACTIVE").length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Target className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-blue-800">
                Active Cycle: {cycles.find((c) => c.status === "ACTIVE")?.name}
              </p>
              <p className="text-xs text-blue-600">
                {new Date(
                  cycles.find((c) => c.status === "ACTIVE")!.startDate
                ).toLocaleDateString()}{" "}
                -{" "}
                {new Date(
                  cycles.find((c) => c.status === "ACTIVE")!.endDate
                ).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Company OKRs */}
      <section>
        <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <div className="w-3 h-3 bg-purple-500 rounded-full" />
          Company Objectives
        </h2>
        {companyOkrs.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
            No company objectives set yet
          </div>
        ) : (
          <div className="space-y-4">
            {companyOkrs.map((obj) => (
              <ObjCard key={obj.id} obj={obj} getStatusBadge={getStatusBadge} level={0} />
            ))}
          </div>
        )}
      </section>

      {/* Department OKRs */}
      {deptOkrs.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full" />
            Department Objectives
          </h2>
          <div className="space-y-4">
            {deptOkrs.map((obj) => (
              <ObjCard key={obj.id} obj={obj} getStatusBadge={getStatusBadge} level={0} />
            ))}
          </div>
        </section>
      )}

      {/* Individual OKRs */}
      {individualOkrs.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <div className="w-3 h-3 bg-emerald-500 rounded-full" />
            Individual Objectives
          </h2>
          <div className="space-y-4">
            {individualOkrs.map((obj) => (
              <ObjCard key={obj.id} obj={obj} getStatusBadge={getStatusBadge} level={0} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ObjCard({
  obj,
  getStatusBadge,
  level,
}: {
  obj: {
    id: string;
    title: string;
    type: string;
    status: string;
    progress: number;
    owner: { name: string };
    department?: { name: string } | null;
    keyResults: { id: string; title: string; progress: number; currentValue: number; targetValue: number; unit: string }[];
    childObjectives?: unknown[];
  };
  getStatusBadge: (s: string) => string;
  level: number;
}) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden ${level > 0 ? "ml-8" : ""}`}>
      <div className="px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-base font-semibold text-slate-800">
                {obj.title}
              </h3>
              <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusBadge(obj.status)}`}>
                {obj.status.replace(/_/g, " ")}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span>Owner: {obj.owner.name}</span>
              {obj.department && <span>Dept: {obj.department.name}</span>}
              <span className="px-2 py-0.5 bg-slate-100 rounded-full">{obj.type}</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-slate-800">
              {Math.round(obj.progress)}%
            </span>
            <div className="w-24 h-2 bg-slate-100 rounded-full mt-1">
              <div
                className="h-2 bg-blue-500 rounded-full transition-all"
                style={{ width: `${obj.progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Key Results */}
        {obj.keyResults.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Key Results
            </p>
            {obj.keyResults.map((kr) => (
              <div key={kr.id} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-600">{kr.title}</span>
                    <span className="text-xs text-slate-500">
                      {kr.currentValue}/{kr.targetValue} {kr.unit}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full">
                    <div
                      className="h-1.5 bg-emerald-500 rounded-full"
                      style={{ width: `${kr.progress}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs font-medium text-slate-600 w-10 text-right">
                  {Math.round(kr.progress)}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
