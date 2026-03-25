import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  MessageSquare,
  ThumbsUp,
  AlertCircle,
  UserPlus,
  Star,
} from "lucide-react";
import { NominationActions } from "./nomination-actions";

export default async function FeedbackPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const role = (session.user as Record<string, unknown>).role as string;
  const userId = session.user.id;

  const [
    myNominations,
    pendingApprovals,
    pendingFeedback,
    feedbackGiven,
    feedbackReceived,
    activeCycles,
  ] = await Promise.all([
    prisma.peerNomination.findMany({
      where: { employeeId: userId },
      include: {
        peer: { select: { id: true, name: true } },
        reviewCycle: { select: { id: true, name: true } },
        approvedBy: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    role === "ADMIN" || role === "TEAM_LEAD"
      ? prisma.peerNomination.findMany({
          where: {
            status: "PENDING",
            ...(role === "TEAM_LEAD"
              ? { employee: { reportsToId: userId } }
              : {}),
          },
          include: {
            employee: { select: { id: true, name: true } },
            peer: { select: { id: true, name: true } },
            reviewCycle: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
    prisma.peerFeedback.findMany({
      where: { fromUserId: userId, status: "PENDING" },
      include: {
        toUser: { select: { id: true, name: true } },
        reviewCycle: { select: { id: true, name: true } },
      },
    }),
    prisma.peerFeedback.findMany({
      where: { fromUserId: userId, status: "COMPLETED" },
      include: {
        toUser: { select: { id: true, name: true } },
        reviewCycle: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    role === "ADMIN" || role === "TEAM_LEAD"
      ? prisma.peerFeedback.findMany({
          where: { status: "COMPLETED" },
          include: {
            fromUser: { select: { id: true, name: true } },
            toUser: { select: { id: true, name: true } },
            reviewCycle: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 30,
        })
      : Promise.resolve([]),
    prisma.reviewCycle.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">360 Feedback</h1>
          <p className="text-slate-500 mt-1">
            Nominate peers, give and receive feedback
          </p>
        </div>
        {activeCycles.length > 0 && (
          <Link
            href="/feedback/nominate"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Nominate Peers
          </Link>
        )}
      </div>

      {/* Pending Feedback Requests */}
      {pendingFeedback.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <h3 className="font-semibold text-amber-800">
              Pending Feedback ({pendingFeedback.length})
            </h3>
          </div>
          <div className="space-y-2">
            {pendingFeedback.map((fb) => (
              <div
                key={fb.id}
                className="flex items-center justify-between bg-white rounded-lg p-3 border border-amber-100"
              >
                <div>
                  <span className="text-sm text-slate-700">
                    Provide feedback for{" "}
                    <strong>{fb.toUser.name}</strong>
                  </span>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {fb.reviewCycle.name}
                  </p>
                </div>
                <Link
                  href={`/feedback/${fb.id}/submit`}
                  className="px-3 py-1.5 bg-amber-500 text-white rounded-md text-xs font-medium hover:bg-amber-600 transition-colors"
                >
                  Give Feedback
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Nomination Approvals (TL/Admin) */}
      {pendingApprovals.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <UserPlus className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-blue-800">
              Nominations to Approve ({pendingApprovals.length})
            </h3>
          </div>
          <div className="space-y-2">
            {pendingApprovals.map((nom) => (
              <div
                key={nom.id}
                className="flex items-center justify-between bg-white rounded-lg p-3 border border-blue-100"
              >
                <div>
                  <span className="text-sm text-slate-700">
                    <strong>{nom.employee.name}</strong> nominated{" "}
                    <strong>{nom.peer.name}</strong>
                  </span>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {nom.reviewCycle.name}
                  </p>
                </div>
                <NominationActions nominationId={nom.id} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* My Nominations */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-blue-500" />
              My Nominations ({myNominations.length})
            </h3>
          </div>
          <div className="divide-y divide-slate-100">
            {myNominations.length === 0 ? (
              <div className="px-6 py-8 text-center text-slate-400">
                <UserPlus className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No peer nominations yet</p>
                {activeCycles.length > 0 && (
                  <Link
                    href="/feedback/nominate"
                    className="text-blue-500 hover:text-blue-600 text-sm mt-2 inline-block"
                  >
                    Nominate peers for feedback
                  </Link>
                )}
              </div>
            ) : (
              myNominations.map((nom) => (
                <div key={nom.id} className="px-6 py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {nom.peer.name}
                      </p>
                      <p className="text-xs text-slate-500">{nom.reviewCycle.name}</p>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        nom.status === "APPROVED"
                          ? "bg-emerald-50 text-emerald-700"
                          : nom.status === "REJECTED"
                          ? "bg-red-50 text-red-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {nom.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Feedback Given */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <ThumbsUp className="w-5 h-5 text-emerald-500" />
              Feedback Given ({feedbackGiven.length})
            </h3>
          </div>
          <div className="divide-y divide-slate-100">
            {feedbackGiven.length === 0 ? (
              <div className="px-6 py-8 text-center text-slate-400">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No feedback given yet</p>
              </div>
            ) : (
              feedbackGiven.map((fb) => (
                <div key={fb.id} className="px-6 py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        To: {fb.toUser.name}
                      </p>
                      <p className="text-xs text-slate-500">{fb.reviewCycle.name}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span className="text-sm font-medium text-slate-700">
                        {fb.rating?.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* All Feedback (Admin/TL view) */}
      {(role === "ADMIN" || role === "TEAM_LEAD") && feedbackReceived.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-purple-500" />
              All Feedback ({feedbackReceived.length})
            </h3>
          </div>
          <div className="divide-y divide-slate-100">
            {feedbackReceived.map((fb) => (
              <div key={fb.id} className="px-6 py-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-slate-800">
                    {fb.isAnonymous ? "Anonymous" : fb.fromUser.name}{" "}
                    <span className="text-slate-400 mx-1">&rarr;</span>{" "}
                    {fb.toUser.name}
                  </p>
                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span className="text-sm font-semibold text-slate-700">
                      {fb.rating?.toFixed(1)}
                    </span>
                  </div>
                </div>
                {fb.comments && (
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                    {fb.comments}
                  </p>
                )}
                {fb.strengths && (
                  <p className="text-xs text-emerald-600 mt-1">
                    <strong>Strengths:</strong> {fb.strengths}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
