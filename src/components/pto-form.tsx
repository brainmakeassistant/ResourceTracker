"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  resources: { id: number; name: string }[];
}

export function PTORequestForm({ resources }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const data = Object.fromEntries(fd.entries());

    await fetch("/api/pto", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    router.push("/pto");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Resource *</label>
        <select
          name="resourceId"
          required
          className="w-full border rounded px-3 py-2"
        >
          <option value="">-- Select Person --</option>
          {resources.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Start Date *</label>
          <input
            name="startDate"
            type="date"
            required
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">End Date *</label>
          <input
            name="endDate"
            type="date"
            required
            className="w-full border rounded px-3 py-2"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">
          Hours Per Day (default 8)
        </label>
        <input
          name="hoursPerDay"
          type="number"
          step="0.5"
          defaultValue="8"
          className="w-full border rounded px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Reason</label>
        <textarea
          name="reason"
          rows={3}
          className="w-full border rounded px-3 py-2"
          placeholder="Vacation, personal day, etc."
        />
      </div>
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={saving}
          className="bg-[var(--primary)] text-white px-4 py-2 rounded hover:bg-[var(--primary-hover)] disabled:opacity-50"
        >
          {saving ? "Saving..." : "Submit Request"}
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
