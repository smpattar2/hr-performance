"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, Plus, Trash2, Loader2 } from "lucide-react";
import Link from "next/link";

export default function CreateOkrPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const role = (session?.user as Record<string, unknown>)?.role as string;

  const [loading, setLoading] = useState(false);
  const [cycles, setCycles] = useState<{ id: string; name: string }[]>([]);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [parentObjectives, setParentObjectives] = useState<{ id: string; title: string; type: string }[]>([]);

  const [form, setForm] = useState({
    title: "",
    description: "",
    type: role === "ADMIN" ? "COMPANY" : role === "TEAM_LEAD" ? "DEPARTMENT" : "INDIVIDUAL",
    cycleId: "",
    departmentId: "",
    parentObjectiveId: "",
    keyResults: [{ title: "", targetValue: 100, unit: "%" }],
  });

  useEffect(() => {
    fetch("/api/okrs/form-data")
      .then((r) => r.json())
      .then((data) => {
        setCycles(data.cycles || []);
        setDepartments(data.departments || []);
        setParentObjectives(data.parentObjectives || []);
        if (data.cycles?.length > 0) {
          setForm((f) => ({ ...f, cycleId: data.cycles[0].id }));
        }
      });
  }, []);

  const addKeyResult = () => {
    setForm((f) => ({
      ...f,
      keyResults: [...f.keyResults, { title: "", targetValue: 100, unit: "%" }],
    }));
  };

  const removeKeyResult = (index: number) => {
    setForm((f) => ({
      ...f,
      keyResults: f.keyResults.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/okrs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      router.push("/okrs");
      router.refresh();
    } else {
      alert("Failed to create objective");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href="/okrs"
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Back to OKRs
        </Link>
        <h1 className="text-2xl font-bold text-slate-800">Create New Objective</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Objective Title
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="e.g., Increase customer satisfaction by 30%"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Description
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            rows={3}
            placeholder="Describe the objective..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Type
            </label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              {role === "ADMIN" && <option value="COMPANY">Company</option>}
              {(role === "ADMIN" || role === "TEAM_LEAD") && (
                <option value="DEPARTMENT">Department</option>
              )}
              <option value="INDIVIDUAL">Individual</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              OKR Cycle
            </label>
            <select
              value={form.cycleId}
              onChange={(e) => setForm({ ...form, cycleId: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              required
            >
              {cycles.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {form.type === "DEPARTMENT" && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Department
            </label>
            <select
              value={form.departmentId}
              onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="">Select department</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        )}

        {parentObjectives.length > 0 && form.type !== "COMPANY" && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Align to Parent Objective (Optional)
            </label>
            <select
              value={form.parentObjectiveId}
              onChange={(e) => setForm({ ...form, parentObjectiveId: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="">No alignment</option>
              {parentObjectives.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.type}] {p.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Key Results */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-slate-700">
              Key Results
            </label>
            <button
              type="button"
              onClick={addKeyResult}
              className="flex items-center gap-1 text-sm text-blue-500 hover:text-blue-600"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
          <div className="space-y-3">
            {form.keyResults.map((kr, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <input
                  type="text"
                  value={kr.title}
                  onChange={(e) => {
                    const updated = [...form.keyResults];
                    updated[idx].title = e.target.value;
                    setForm({ ...form, keyResults: updated });
                  }}
                  className="flex-1 px-3 py-2 rounded border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Key result description"
                  required
                />
                <input
                  type="number"
                  value={kr.targetValue}
                  onChange={(e) => {
                    const updated = [...form.keyResults];
                    updated[idx].targetValue = Number(e.target.value);
                    setForm({ ...form, keyResults: updated });
                  }}
                  className="w-20 px-3 py-2 rounded border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Target"
                  required
                />
                <input
                  type="text"
                  value={kr.unit}
                  onChange={(e) => {
                    const updated = [...form.keyResults];
                    updated[idx].unit = e.target.value;
                    setForm({ ...form, keyResults: updated });
                  }}
                  className="w-16 px-3 py-2 rounded border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Unit"
                />
                {form.keyResults.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeKeyResult(idx)}
                    className="p-1 text-slate-400 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? "Creating..." : "Create Objective"}
        </button>
      </form>
    </div>
  );
}
