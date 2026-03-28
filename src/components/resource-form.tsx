"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  practices: { id: number; name: string }[];
  managers: { id: number; name: string }[];
  initial?: {
    id: number;
    name: string;
    resourceType: string;
    level: string | null;
    citizenship: string | null;
    location: string | null;
    expertise: string | null;
    billRate: number | null;
    costRate: number | null;
    practiceId: number | null;
    managerId: number | null;
  };
}

export function ResourceForm({ practices, managers, initial }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const data = Object.fromEntries(fd.entries());

    const url = initial ? `/api/resources/${initial.id}` : "/api/resources";
    const method = initial ? "PUT" : "POST";

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    router.push("/resources");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Name *</label>
        <input
          name="name"
          required
          defaultValue={initial?.name}
          className="w-full border rounded px-3 py-2"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Type *</label>
          <select
            name="resourceType"
            required
            defaultValue={initial?.resourceType || "EE"}
            className="w-full border rounded px-3 py-2"
          >
            <option value="EE">Employee</option>
            <option value="IC">Independent Contractor</option>
            <option value="TBD">TBD</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Practice</label>
          <select
            name="practiceId"
            defaultValue={initial?.practiceId || ""}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">-- None --</option>
            {practices.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Level</label>
          <input
            name="level"
            defaultValue={initial?.level || ""}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Manager</label>
          <select
            name="managerId"
            defaultValue={initial?.managerId || ""}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">-- None --</option>
            {managers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Citizenship</label>
          <input
            name="citizenship"
            defaultValue={initial?.citizenship || ""}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Location</label>
          <input
            name="location"
            defaultValue={initial?.location || ""}
            className="w-full border rounded px-3 py-2"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Expertise</label>
        <input
          name="expertise"
          defaultValue={initial?.expertise || ""}
          className="w-full border rounded px-3 py-2"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Bill Rate ($/hr)
          </label>
          <input
            name="billRate"
            type="number"
            step="0.01"
            defaultValue={initial?.billRate || ""}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Cost Rate ($/hr)
          </label>
          <input
            name="costRate"
            type="number"
            step="0.01"
            defaultValue={initial?.costRate || ""}
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
          {saving ? "Saving..." : initial ? "Update" : "Add Resource"}
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
