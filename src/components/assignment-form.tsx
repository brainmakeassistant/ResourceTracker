"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  resources: { id: number; name: string }[];
  projects: { id: number; name: string }[];
  initial?: {
    id: number;
    resourceId: number;
    projectId: number;
    pmId: number | null;
    activity: string | null;
    hoursPerWeek: number;
    startDate: string;
    endDate: string | null;
  };
}

export function AssignmentForm({ resources, projects, initial }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const data = Object.fromEntries(fd.entries());

    const url = initial
      ? `/api/assignments/${initial.id}`
      : "/api/assignments";
    const method = initial ? "PUT" : "POST";

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    router.push("/assignments");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Resource *</label>
        <select
          name="resourceId"
          required
          defaultValue={initial?.resourceId || ""}
          className="w-full border rounded px-3 py-2"
        >
          <option value="">-- Select Resource --</option>
          {resources.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Project *</label>
        <select
          name="projectId"
          required
          defaultValue={initial?.projectId || ""}
          className="w-full border rounded px-3 py-2"
        >
          <option value="">-- Select Project --</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Project Manager
          </label>
          <select
            name="pmId"
            defaultValue={initial?.pmId || ""}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">-- None --</option>
            {resources.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Activity</label>
          <select
            name="activity"
            defaultValue={initial?.activity || ""}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">-- None --</option>
            <option value="Functional">Functional</option>
            <option value="Technical">Technical</option>
            <option value="PM">PM</option>
            <option value="Testing">Testing</option>
            <option value="Training">Training</option>
            <option value="Data Conversion">Data Conversion</option>
            <option value="Integration">Integration</option>
            <option value="Support">Support</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">
          Hours Per Week *
        </label>
        <input
          name="hoursPerWeek"
          type="number"
          step="0.5"
          min="0"
          max="80"
          required
          defaultValue={initial?.hoursPerWeek || ""}
          className="w-full border rounded px-3 py-2"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Start Date *</label>
          <input
            name="startDate"
            type="date"
            required
            defaultValue={
              initial?.startDate
                ? new Date(initial.startDate).toISOString().split("T")[0]
                : ""
            }
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">End Date</label>
          <input
            name="endDate"
            type="date"
            defaultValue={
              initial?.endDate
                ? new Date(initial.endDate).toISOString().split("T")[0]
                : ""
            }
            className="w-full border rounded px-3 py-2"
          />
        </div>
      </div>
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={saving}
          className="bg-[var(--primary)] text-white px-4 py-2 rounded hover:bg-[var(--primary-hover)] disabled:opacity-50"
        >
          {saving ? "Saving..." : initial ? "Update" : "Add Assignment"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 border rounded hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
