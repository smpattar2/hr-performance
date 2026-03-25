"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function InitiateReviewsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ created: number; total: number } | null>(null);
  const [cycles, setCycles] = useState<{ id: string; name: string; status: string }[]>([]);
  const [selectedCycleId, setSelectedCycleId] = useState(searchParams.get("cycleId") || "");

  useEffect(() => {
    fetch("/api/okrs/form-data")
      .then(() => {});
    // Fetch review cycles
    fetch("/api/review-cycles")
      .then((r) => r.json())
      .then((data) => {
        setCycles(data.cycles || []);
        if (!selectedCycleId && data.cycles?.length > 0) {
          setSelectedCycleId(data.cycles[0].id);
        }
      });
  }, [selectedCycleId]);

  const handleInitiate = async () => {
    if (!selectedCycleId) return;
    setLoading(true);
    const res = await fetch("/api/reviews/initiate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewCycleId: selectedCycleId }),
    });
    const data = await res.json();
    setResult(data);
    setLoading(false);
  };

  return (
    <div className="max-w-lg mx-auto">
      <Link href="/reviews" className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Reviews
      </Link>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h1 className="text-xl font-bold text-slate-800 mb-2">Initiate Performance Reviews</h1>
        <p className="text-slate-500 text-sm mb-6">
          This will create review records for all employees in the selected cycle.
        </p>

        {result ? (
          <div className="text-center py-6">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <p className="text-lg font-semibold text-slate-800">
              Reviews Initiated!
            </p>
            <p className="text-sm text-slate-500 mt-1">
              Created {result.created} new reviews out of {result.total} employees
            </p>
            <Link
              href="/reviews"
              className="inline-block mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              View Reviews
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Select Review Cycle
              </label>
              <select
                value={selectedCycleId}
                onChange={(e) => setSelectedCycleId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                {cycles.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.status})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleInitiate}
              disabled={loading || !selectedCycleId}
              className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Creating reviews..." : "Initiate Reviews for All Employees"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
