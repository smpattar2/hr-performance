import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { ClipboardCheck, User, Star } from "lucide-react";
import Link from "next/link";

export default async function ReviewsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const role = (session.user as Record<string, unknown>).role as string;
  const userId = session.user.id;

  const reviewCycles = await prisma.reviewCycle.findMany({
    orderBy: { startDate: "desc" },
    include: {
      reviews: {
        where:
          role === "ADMIN"
            ? {}
            : role === "TEAM_LEAD"
            ? { OR: [{ employeeId: userId }, { tlReviewerId: userId }] }
            : { employeeId: userId },
        include: {
          employee: { include: { department: true } },
          competencies: true,
        },
      },
    },
  });

  // For TLs, get their team members without reviews yet
  let teamMembers: { id: string; name: string; email: string; department: { name: string } | null }[] = [];
  if (role === "TEAM_LEAD") {
    teamMembers = await prisma.user.findMany({
      where: { reportsToId: userId },
      select: { id: true, name: true, email: true, department: { select: { name: true } } },
    });
  }

  // For admin, get all employees
  if (role === "ADMIN") {
    teamMembers = await prisma.user.findMany({
      where: { role: { not: "ADMIN" } },
      select: { id: true, name: true, email: true, department: { select: { name: true } } },
      orderBy: { name: "asc" },
    });
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "MGMT_REVIEW":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "TL_REVIEW":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "SELF_REVIEW":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Performance Reviews</h1>
          <p className="text-slate-500 mt-1">
            {role === "ADMIN"
              ? "Manage and calibrate all reviews"
              : role === "TEAM_LEAD"
              ? "Review your team members"
              : "Your performance review"}
          </p>
        </div>
        {role === "ADMIN" && (
          <Link
            href="/reviews/initiate"
            className="px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium text-sm transition-colors"
          >
            Initiate Reviews
          </Link>
        )}
      </div>

      {reviewCycles.map((cycle) => (
        <div key={cycle.id} className="space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-slate-800">{cycle.name}</h2>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${
              cycle.status === "ACTIVE"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-slate-50 text-slate-700 border-slate-200"
            }`}>
              {cycle.status}
            </span>
          </div>

          {cycle.reviews.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
              <ClipboardCheck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No reviews initiated for this cycle yet</p>
              {role === "ADMIN" && cycle.status === "ACTIVE" && (
                <Link
                  href={`/reviews/initiate?cycleId=${cycle.id}`}
                  className="inline-block mt-3 text-sm text-blue-500 hover:text-blue-600 font-medium"
                >
                  Start reviews for this cycle
                </Link>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">
                      Employee
                    </th>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">
                      Department
                    </th>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">
                      Status
                    </th>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">
                      Self
                    </th>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">
                      TL
                    </th>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">
                      Final
                    </th>
                    <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cycle.reviews.map((review) => (
                    <tr key={review.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium text-blue-600">
                            {review.employee.name.charAt(0)}
                          </div>
                          <span className="text-sm font-medium text-slate-800">
                            {review.employee.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {review.employee.department?.name ?? "-"}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(review.status)}`}>
                          {review.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {review.selfRating ? (
                          <span className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                            {review.selfRating.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {review.tlRating ? (
                          <span className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                            {review.tlRating.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold">
                        {review.finalScore ? (
                          <span className="text-blue-600">{review.finalScore.toFixed(1)}</span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/reviews/${review.id}`}
                          className="text-sm text-blue-500 hover:text-blue-600 font-medium"
                        >
                          {review.status === "NOT_STARTED" && review.employeeId === userId
                            ? "Start Review"
                            : review.status === "SELF_REVIEW" && role === "TEAM_LEAD"
                            ? "Review"
                            : review.status === "TL_REVIEW" && role === "ADMIN"
                            ? "Calibrate"
                            : "View"}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
