"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  MessageSquare,
  Star,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface Props {
  feedbackId: string;
  recipientName: string;
  cycleName: string;
}

export function FeedbackForm({ feedbackId, recipientName, cycleName }: Props) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comments, setComments] = useState("");
  const [strengths, setStrengths] = useState("");
  const [improvements, setImprovements] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (rating === 0) {
      setError("Please provide a rating");
      return;
    }
    if (!comments.trim()) {
      setError("Please provide general comments");
      return;
    }

    setSubmitting(true);
    setError("");

    const res = await fetch(`/api/feedback/${feedbackId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rating,
        comments,
        strengths,
        improvements,
        isAnonymous,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to submit feedback");
      setSubmitting(false);
    } else {
      router.push("/feedback");
      router.refresh();
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        href="/feedback"
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Feedback
      </Link>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-1">
          <MessageSquare className="w-5 h-5 text-amber-500" />
          Give Feedback
        </h1>
        <p className="text-sm text-slate-500 mb-6">
          Providing feedback for <strong>{recipientName}</strong> &middot;{" "}
          {cycleName}
        </p>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}

        {/* Rating */}
        <div className="mb-6">
          <label className="text-sm font-medium text-slate-700 block mb-2">
            Overall Rating <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-1 transition-transform hover:scale-110"
              >
                <Star
                  className={`w-8 h-8 ${
                    star <= (hoverRating || rating)
                      ? "text-amber-400 fill-amber-400"
                      : "text-slate-200"
                  }`}
                />
              </button>
            ))}
            {rating > 0 && (
              <span className="ml-3 text-sm text-slate-600 font-medium">
                {rating === 1
                  ? "Needs Improvement"
                  : rating === 2
                  ? "Below Average"
                  : rating === 3
                  ? "Meets Expectations"
                  : rating === 4
                  ? "Exceeds Expectations"
                  : "Outstanding"}
              </span>
            )}
          </div>
        </div>

        {/* General Comments */}
        <div className="mb-4">
          <label className="text-sm font-medium text-slate-700 block mb-1">
            General Comments <span className="text-red-500">*</span>
          </label>
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            rows={4}
            placeholder="Share your overall feedback about this person's performance..."
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Strengths */}
        <div className="mb-4">
          <label className="text-sm font-medium text-slate-700 block mb-1">
            Key Strengths
          </label>
          <textarea
            value={strengths}
            onChange={(e) => setStrengths(e.target.value)}
            rows={3}
            placeholder="What does this person do well? What are their standout qualities?"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Areas for Improvement */}
        <div className="mb-6">
          <label className="text-sm font-medium text-slate-700 block mb-1">
            Areas for Improvement
          </label>
          <textarea
            value={improvements}
            onChange={(e) => setImprovements(e.target.value)}
            rows={3}
            placeholder="What could this person improve on? What would help them grow?"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Anonymity Toggle */}
        <div className="flex items-center gap-3 mb-6 p-3 bg-slate-50 rounded-lg">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-slate-700">Submit anonymously</span>
          </label>
          <span className="text-xs text-slate-500">
            {isAnonymous
              ? "Your name will not be visible to the recipient"
              : "Your name will be visible to TL and management"}
          </span>
        </div>

        {/* Submit */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <MessageSquare className="w-4 h-4" />
            )}
            Submit Feedback
          </button>
          <Link
            href="/feedback"
            className="px-4 py-2.5 text-slate-600 text-sm hover:text-slate-800"
          >
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}
