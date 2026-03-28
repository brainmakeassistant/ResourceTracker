"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  initial?: {
    id: number;
    name: string;
    status: string;
    isContingent: boolean;
    citizenshipRequired: string | null;
    salesRep: string | null;
  };
}

export function ProjectForm({ initial }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const data = {
      ...Object.fromEntries(fd.entries()),
      isContingent: fd.get("isContingent") === "on",
    };

    const url = initial ? `/api/projects/${initial.id}` : "/api/projects";
    const method = initial ? "PUT" : "POST";

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    router.push("/projects");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Project Name *</label>
        <input
          name="name"
          required
          defaultValue={initial?.name}
          className="w-full border rounded px-3 py-2"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select
            name="status"
            defaultValue={initial?.status || "Active"}
            className="w-full border rounded px-3 py-2"
          >
            <option value="Active">Active</option>
            <option value="Pipeline">Pipeline</option>
            <option value="Completed">Completed</option>
            <option value="On Hold">On Hold</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Sales Rep</label>
          <input
            name="salesRep"
            defaultValue={initial?.salesRep || ""}
            className="w-full border rounded px-3 py-2"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">
          Citizenship Required
        </label>
        <input
          name="citizenshipRequired"
          defaultValue={initial?.citizenshipRequired || ""}
          className="w-full border rounded px-3 py-2"
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          name="isContingent"
          id="isContingent"
          defaultChecked={initial?.isContingent}
          className="rounded"
        />
        <label htmlFor="isContingent" className="text-sm">
          Contingent (pipeline/not yet signed)
        </label>
      </div>
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={saving}
          className="bg-[var(--primary)] text-white px-4 py-2 rounded hover:bg-[var(--primary-hover)] disabled:opacity-50"
        >
          {saving ? "Saving..." : initial ? "Update" : "Add Project"}
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
