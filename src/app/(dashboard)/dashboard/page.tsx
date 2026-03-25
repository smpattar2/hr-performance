import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Target,
  ClipboardCheck,
  Users,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
} from "lucide-react";
import { DashboardCharts } from "@/components/dashboard/dashboard-charts";

async function getDashboardData(userId: string, role: string, departmentId: string | null) {
  const [
    totalUsers,
    totalDepartments,
    activeOkrCycles,
    activeReviewCycles,
    objectives,
    reviews,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.department.count(),
    prisma.okrCycle.findMany({ where: { status: "ACTIVE" } }),
    prisma.reviewCycle.findMany({ where: { status: "ACTIVE" } }),
    prisma.objective.findMany({
      where:
        role === "ADMIN"
          ? {}
          : role === "TEAM_LEAD"
          ? { OR: [{ ownerId: userId }, { type: "COMPANY" }] }
          : { ownerId: userId },
      include: { keyResults: true, owner: true },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    prisma.review.findMany({
      where:
        role === "ADMIN"
          ? {}
          : role === "TEAM_LEAD"
          ? { OR: [{ employeeId: userId }, { tlReviewerId: userId }] }
          : { employeeId: userId },
      include: { employee: true },
      take: 5,
    }),
  ]);

  return {
    totalUsers,
    totalDepartments,
    activeOkrCycles,
    activeReviewCycles,
    objectives,
    reviews,
  };
}

async function getChartsData(role: string, departmentId: string | null) {
  // Department OKR progress
  const departments = await prisma.department.findMany({
    include: {
      objectives: {
        where: { type: "DEPARTMENT" },
        select: { progress: true },
      },
    },
  });

  const deptOkrData = departments
    .map((dept) => ({
      department: dept.name.length > 12 ? dept.name.slice(0, 12) + "…" : dept.name,
      progress: dept.objectives.length > 0
        ? Math.round(
            dept.objectives.reduce((sum, o) => sum + o.progress, 0) / dept.objectives.length
          )
        : 0,
      count: dept.objectives.length,
    }))
    .filter((d) => d.count > 0);

  // OKR status distribution
  const allObjectives = await prisma.objective.groupBy({
    by: ["status"],
    _count: { id: true },
  });

  const statusMap: Record<string, { color: string; label: string }> = {
    ON_TRACK: { color: "#10b981", label: "On Track" },
    AT_RISK: { color: "#f59e0b", label: "At Risk" },
    BEHIND: { color: "#ef4444", label: "Behind" },
    COMPLETED: { color: "#3b82f6", label: "Completed" },
  };

  const okrStatusData = Object.entries(statusMap).map(([key, { color, label }]) => ({
    name: label,
    value: allObjectives.find((o) => o.status === key)?._count.id ?? 0,
    color,
  }));

  // Review completion status
  const allReviews = await prisma.review.groupBy({
    by: ["status"],
    _count: { id: true },
  });

  const reviewStatusMap: Record<string, { fill: string; label: string }> = {
    NOT_STARTED: { fill: "#94a3b8", label: "Not Started" },
    SELF_REVIEW: { fill: "#f59e0b", label: "Self Review" },
    TL_REVIEW: { fill: "#3b82f6", label: "TL Review" },
    MGMT_REVIEW: { fill: "#8b5cf6", label: "Mgmt Review" },
    COMPLETED: { fill: "#10b981", label: "Completed" },
  };

  const reviewStatusData = Object.entries(reviewStatusMap).map(([key, { fill, label }]) => ({
    name: label,
    value: allReviews.find((r) => r.status === key)?._count.id ?? 0,
    fill,
  }));

  // Rating distribution
  const completedReviews = await prisma.review.findMany({
    where: { status: "COMPLETED", finalScore: { not: null } },
    select: { finalScore: true },
  });

  const ratingBuckets = [
    { rating: "1 - Needs Improvement", min: 0, max: 1.5 },
    { rating: "2 - Below Average", min: 1.5, max: 2.5 },
    { rating: "3 - Meets Expectations", min: 2.5, max: 3.5 },
    { rating: "4 - Exceeds", min: 3.5, max: 4.5 },
    { rating: "5 - Outstanding", min: 4.5, max: 5.1 },
  ];

  const ratingDistData = ratingBuckets.map((bucket) => ({
    rating: bucket.rating,
    count: completedReviews.filter(
      (r) => r.finalScore! >= bucket.min && r.finalScore! < bucket.max
    ).length,
  }));

  return { deptOkrData, okrStatusData, reviewStatusData, ratingDistData };
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const role = (session.user as Record<string, unknown>).role as string;
  const departmentId = (session.user as Record<string, unknown>).departmentId as string | null;
  const data = await getDashboardData(session.user.id, role, departmentId);
  const chartsData = role === "ADMIN" || role === "TEAM_LEAD"
    ? await getChartsData(role, departmentId)
    : null;

  const stats = [
    {
      label: "Total Employees",
      value: data.totalUsers,
      icon: Users,
      color: "bg-blue-50 text-blue-600",
      show: role === "ADMIN",
    },
    {
      label: "Departments",
      value: data.totalDepartments,
      icon: Target,
      color: "bg-purple-50 text-purple-600",
      show: role === "ADMIN",
    },
    {
      label: "Active OKR Cycles",
      value: data.activeOkrCycles.length,
      icon: TrendingUp,
      color: "bg-emerald-50 text-emerald-600",
      show: true,
    },
    {
      label: "Active Review Cycles",
      value: data.activeReviewCycles.length,
      icon: ClipboardCheck,
      color: "bg-amber-50 text-amber-600",
      show: true,
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ON_TRACK":
      case "COMPLETED":
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case "AT_RISK":
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case "BEHIND":
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  const getReviewStatusLabel = (status: string) => {
    return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-500 mt-1">
          {role === "ADMIN"
            ? "Company-wide performance overview"
            : role === "TEAM_LEAD"
            ? "Your team performance overview"
            : "Your performance overview"}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats
          .filter((s) => s.show)
          .map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-slate-500">
                  {stat.label}
                </span>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-800">{stat.value}</p>
            </div>
          ))}
      </div>

      {/* Analytics Charts — Admin & TL only */}
      {chartsData && (
        <div>
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            Analytics
          </h2>
          <DashboardCharts
            deptOkrData={chartsData.deptOkrData}
            okrStatusData={chartsData.okrStatusData}
            reviewStatusData={chartsData.reviewStatusData}
            ratingDistData={chartsData.ratingDistData}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent OKRs */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-500" />
              Recent Objectives
            </h3>
          </div>
          <div className="divide-y divide-slate-100">
            {data.objectives.length === 0 ? (
              <div className="px-6 py-8 text-center text-slate-400">
                <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No objectives yet</p>
              </div>
            ) : (
              data.objectives.map((obj) => (
                <Link
                  key={obj.id}
                  href={`/okrs/${obj.id}`}
                  className="block px-6 py-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {getStatusIcon(obj.status)}
                        <h4 className="text-sm font-medium text-slate-800 truncate">
                          {obj.title}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="px-2 py-0.5 bg-slate-100 rounded-full">
                          {obj.type}
                        </span>
                        <span>{obj.owner.name}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-slate-800">
                        {Math.round(obj.progress)}%
                      </span>
                      <div className="w-20 h-2 bg-slate-100 rounded-full mt-1">
                        <div
                          className="h-2 bg-blue-500 rounded-full transition-all"
                          style={{ width: `${obj.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Review Status */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-amber-500" />
              Performance Reviews
            </h3>
          </div>
          <div className="divide-y divide-slate-100">
            {data.reviews.length === 0 ? (
              <div className="px-6 py-8 text-center text-slate-400">
                <ClipboardCheck className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No reviews started yet</p>
                {data.activeReviewCycles.length > 0 && (
                  <p className="text-xs mt-1">
                    Active cycle: {data.activeReviewCycles[0].name}
                  </p>
                )}
              </div>
            ) : (
              data.reviews.map((review) => (
                <Link
                  key={review.id}
                  href={`/reviews/${review.id}`}
                  className="block px-6 py-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-slate-800">
                        {review.employee.name}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Status: {getReviewStatusLabel(review.status)}
                      </p>
                    </div>
                    {review.finalScore && (
                      <span className="text-lg font-bold text-blue-600">
                        {review.finalScore.toFixed(1)}
                      </span>
                    )}
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Active Cycles Info */}
      {role === "ADMIN" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {data.activeOkrCycles.map((cycle) => (
            <div
              key={cycle.id}
              className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white"
            >
              <h3 className="font-semibold text-lg mb-2">{cycle.name}</h3>
              <p className="text-blue-100 text-sm">
                {new Date(cycle.startDate).toLocaleDateString()} -{" "}
                {new Date(cycle.endDate).toLocaleDateString()}
              </p>
              <div className="mt-4 flex items-center gap-2">
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                  {cycle.status}
                </span>
              </div>
            </div>
          ))}
          {data.activeReviewCycles.map((cycle) => (
            <div
              key={cycle.id}
              className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-6 text-white"
            >
              <h3 className="font-semibold text-lg mb-2">{cycle.name}</h3>
              <p className="text-amber-100 text-sm">
                {new Date(cycle.startDate).toLocaleDateString()} -{" "}
                {new Date(cycle.endDate).toLocaleDateString()}
              </p>
              <div className="mt-4 flex items-center gap-2">
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                  {cycle.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
