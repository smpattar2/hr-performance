"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Star, Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";

interface ReviewData {
  id: string;
  status: string;
  selfRating: number | null;
  selfComments: string | null;
  tlRating: number | null;
  tlComments: string | null;
  mgmtRating: number | null;
  mgmtComments: string | null;
  finalScore: number | null;
  employee: { id: string; name: string; email: string; department: { name: string } | null };
  tlReviewer: { id: string; name: string } | null;
  mgmtReviewer: { id: string; name: string } | null;
  reviewCycle: { name: string };
  competencies: { id: string; competencyName: string; selfScore: number | null; tlScore: number | null; mgmtScore: number | null }[];
}

interface Props {
  review: ReviewData;
  currentUserId: string;
  currentUserRole: string;
}

export function ReviewForm({ review, currentUserId, currentUserRole }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [comments, setComments] = useState("");
  const [competencyScores, setCompetencyScores] = useState<Record<string, number>>(
    Object.fromEntries(review.competencies.map((c) => [c.id, 3]))
  );

  const isEmployee = review.employee.id === currentUserId;
  const isTL = review.tlReviewer?.id === currentUserId || currentUserRole === "TEAM_LEAD";
  const isMgmt = currentUserRole === "ADMIN";

  const canSelfReview = isEmployee && (review.status === "NOT_STARTED" || review.status === "SELF_REVIEW");
  const canTLReview = (isTL || isMgmt) && review.status === "SELF_REVIEW";
  const canMgmtReview = isMgmt && review.status === "TL_REVIEW";

  const canEdit = canSelfReview || canTLReview || canMgmtReview;

  const getReviewType = () => {
    if (canSelfReview) return "self";
    if (canTLReview) return "tl";
    if (canMgmtReview) return "mgmt";
    return "view";
  };

  const reviewType = getReviewType();

  const handleSubmit = async () => {
    setLoading(true);
    const avgScore = Object.values(competencyScores).reduce((a, b) => a + b, 0) / Object.values(competencyScores).length;

    const res = await fetch(`/api/reviews/${review.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: reviewType,
        rating: avgScore,
        comments,
        competencyScores,
      }),
    });

    if (res.ok) {
      router.push("/reviews");
      router.refresh();
    } else {
      alert("Failed to submit review");
      setLoading(false);
    }
  };

  const RatingStars = ({ value, onChange, readonly }: { value: number; onChange?: (v: number) => void; readonly?: boolean }) => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !readonly && onChange?.(star)}
          disabled={readonly}
          className={`transition-colors ${readonly ? "cursor-default" : "cursor-pointer hover:scale-110"}`}
        >
          <Star
            className={`w-5 h-5 ${star <= value ? "text-amber-400 fill-amber-400" : "text-slate-200"}`}
          />
        </button>
      ))}
      <span className="ml-2 text-sm font-medium text-slate-600">{value}/5</span>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/reviews" className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Reviews
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-lg font-semibold text-blue-600">
              {review.employee.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">{review.employee.name}</h1>
              <p className="text-sm text-slate-500">
                {review.employee.department?.name} &middot; {review.reviewCycle.name}
              </p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            review.status === "COMPLETED"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-amber-50 text-amber-700"
          }`}>
            {review.status.replace(/_/g, " ")}
          </span>
        </div>

        {/* Score summary */}
        {(review.selfRating || review.tlRating || review.finalScore) && (
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100">
            <div className="text-center">
              <p className="text-xs text-slate-500 mb-1">Self (20%)</p>
              <p className="text-xl font-bold text-slate-800">{review.selfRating?.toFixed(1) ?? "-"}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500 mb-1">TL (40%)</p>
              <p className="text-xl font-bold text-slate-800">{review.tlRating?.toFixed(1) ?? "-"}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500 mb-1">Final Score</p>
              <p className="text-xl font-bold text-blue-600">{review.finalScore?.toFixed(1) ?? "-"}</p>
            </div>
          </div>
        )}
      </div>

      {review.status === "COMPLETED" && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <p className="text-sm text-emerald-700 font-medium">This review has been completed.</p>
        </div>
      )}

      {/* Competency Ratings */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
        <h2 className="font-semibold text-slate-800 mb-4">
          Competency Ratings
          {canEdit && (
            <span className="text-sm font-normal text-slate-500 ml-2">
              ({reviewType === "self" ? "Self Assessment" : reviewType === "tl" ? "Team Lead Review" : "Management Review"})
            </span>
          )}
        </h2>
        <div className="space-y-4">
          {review.competencies.map((comp) => (
            <div key={comp.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
              <span className="text-sm font-medium text-slate-700">{comp.competencyName}</span>
              {canEdit ? (
                <RatingStars
                  value={competencyScores[comp.id] ?? 3}
                  onChange={(v) => setCompetencyScores((prev) => ({ ...prev, [comp.id]: v }))}
                />
              ) : (
                <div className="flex items-center gap-4">
                  {comp.selfScore && (
                    <span className="text-xs text-slate-500">Self: {comp.selfScore}</span>
                  )}
                  {comp.tlScore && (
                    <span className="text-xs text-slate-500">TL: {comp.tlScore}</span>
                  )}
                  {comp.mgmtScore && (
                    <span className="text-xs text-slate-500">Mgmt: {comp.mgmtScore}</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Comments & Submit */}
      {canEdit && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="font-semibold text-slate-800 mb-4">Comments</h2>
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            rows={4}
            placeholder={
              reviewType === "self"
                ? "Reflect on your achievements, challenges, and areas for growth..."
                : reviewType === "tl"
                ? "Provide feedback on this team member's performance..."
                : "Add management review comments and final calibration notes..."
            }
          />
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="mt-4 w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading
              ? "Submitting..."
              : reviewType === "self"
              ? "Submit Self Assessment"
              : reviewType === "tl"
              ? "Submit TL Review"
              : "Submit & Finalize Review"}
          </button>
        </div>
      )}

      {/* Previous comments (read-only) */}
      {review.selfComments && reviewType !== "self" && (
        <div className="bg-slate-50 rounded-xl p-4 mt-4">
          <p className="text-xs font-medium text-slate-500 mb-1">Self Assessment Comments:</p>
          <p className="text-sm text-slate-700">{review.selfComments}</p>
        </div>
      )}
      {review.tlComments && reviewType === "mgmt" && (
        <div className="bg-slate-50 rounded-xl p-4 mt-4">
          <p className="text-xs font-medium text-slate-500 mb-1">Team Lead Comments:</p>
          <p className="text-sm text-slate-700">{review.tlComments}</p>
        </div>
      )}
    </div>
  );
}
