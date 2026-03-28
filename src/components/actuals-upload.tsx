"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ActualsUpload() {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{
    imported: number;
    skipped: number;
  } | null>(null);

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setUploading(true);
    setResult(null);

    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/actuals/upload", {
      method: "POST",
      body: fd,
    });

    const data = await res.json();
    setResult(data);
    setUploading(false);
    router.refresh();
  }

  return (
    <div className="bg-white rounded-lg border p-6 mb-6">
      <h2 className="text-lg font-semibold mb-3">Upload Actuals</h2>
      <p className="text-sm text-gray-600 mb-4">
        Upload an Excel file with columns: Resource, Project, Week (date), Hours.
        Column names are flexible (e.g., &quot;Employee&quot;, &quot;Actual Hours&quot;).
      </p>
      <form onSubmit={handleUpload} className="flex items-end gap-4">
        <div>
          <input
            type="file"
            name="file"
            accept=".xlsx,.xls,.csv"
            required
            className="text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={uploading}
          className="bg-[var(--primary)] text-white px-4 py-2 rounded text-sm hover:bg-[var(--primary-hover)] disabled:opacity-50"
        >
          {uploading ? "Uploading..." : "Upload"}
        </button>
      </form>
      {result && (
        <p className="mt-3 text-sm">
          <span className="text-green-600 font-medium">
            {result.imported} imported
          </span>
          {result.skipped > 0 && (
            <span className="text-yellow-600 ml-2">
              ({result.skipped} skipped — unmatched names or missing data)
            </span>
          )}
        </p>
      )}
    </div>
  );
}
