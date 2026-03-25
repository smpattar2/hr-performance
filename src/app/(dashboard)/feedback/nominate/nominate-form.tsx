"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  UserPlus,
  Search,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface Colleague {
  id: string;
  name: string;
  email: string;
  departmentName: string;
}

interface Props {
  cycles: { id: string; name: string }[];
  colleagues: Colleague[];
  existingNominations: { peerId: string; reviewCycleId: string }[];
}

export function NominateForm({ cycles, colleagues, existingNominations }: Props) {
  const router = useRouter();
  const [selectedCycle, setSelectedCycle] = useState(cycles[0]?.id ?? "");
  const [search, setSearch] = useState("");
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [nominated, setNominated] = useState<string[]>(
    existingNominations
      .filter((n) => n.reviewCycleId === cycles[0]?.id)
      .map((n) => n.peerId)
  );
  const [error, setError] = useState("");

  const filteredColleagues = colleagues.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.departmentName.toLowerCase().includes(search.toLowerCase())
  );

  const handleNominate = async (peerId: string) => {
    setSubmitting(peerId);
    setError("");

    const res = await fetch("/api/feedback/nominations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewCycleId: selectedCycle, peerId }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to nominate");
    } else {
      setNominated((prev) => [...prev, peerId]);
    }

    setSubmitting(null);
  };

  const handleCycleChange = (cycleId: string) => {
    setSelectedCycle(cycleId);
    setNominated(
      existingNominations
        .filter((n) => n.reviewCycleId === cycleId)
        .map((n) => n.peerId)
    );
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
          <UserPlus className="w-5 h-5 text-blue-500" />
          Nominate Peers for Feedback
        </h1>
        <p className="text-sm text-slate-500 mb-6">
          Select 2-5 colleagues to provide feedback on your performance.
          Your team lead will approve the nominations.
        </p>

        {/* Cycle selector */}
        {cycles.length > 1 && (
          <div className="mb-4">
            <label className="text-sm font-medium text-slate-700 mb-1 block">
              Review Cycle
            </label>
            <select
              value={selectedCycle}
              onChange={(e) => handleCycleChange(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
            >
              {cycles.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Progress */}
        <div className="flex items-center gap-3 mb-4 p-3 bg-slate-50 rounded-lg">
          <span className="text-sm text-slate-600">
            Nominated: <strong>{nominated.length}</strong> / 5
          </span>
          <div className="flex-1 h-2 bg-slate-200 rounded-full">
            <div
              className={`h-2 rounded-full transition-all ${
                nominated.length >= 2 ? "bg-emerald-500" : "bg-amber-500"
              }`}
              style={{ width: `${(nominated.length / 5) * 100}%` }}
            />
          </div>
          {nominated.length < 2 && (
            <span className="text-xs text-amber-600">Min 2 required</span>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search colleagues by name, email, or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Colleagues list */}
        <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg max-h-96 overflow-y-auto">
          {filteredColleagues.map((colleague) => {
            const isNominated = nominated.includes(colleague.id);
            const isSubmitting = submitting === colleague.id;
            const isMaxed = nominated.length >= 5 && !isNominated;

            return (
              <div
                key={colleague.id}
                className={`flex items-center justify-between px-4 py-3 ${
                  isNominated ? "bg-emerald-50" : ""
                }`}
              >
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {colleague.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {colleague.departmentName} &middot; {colleague.email}
                  </p>
                </div>
                {isNominated ? (
                  <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                    <CheckCircle2 className="w-4 h-4" />
                    Nominated
                  </span>
                ) : (
                  <button
                    onClick={() => handleNominate(colleague.id)}
                    disabled={isSubmitting || isMaxed}
                    className="px-3 py-1.5 bg-blue-500 text-white rounded-md text-xs font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <UserPlus className="w-3.5 h-3.5" />
                    )}
                    Nominate
                  </button>
                )}
              </div>
            );
          })}
          {filteredColleagues.length === 0 && (
            <div className="px-4 py-8 text-center text-slate-400 text-sm">
              No colleagues found matching your search
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
