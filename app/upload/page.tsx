"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";

type PreviewResponse = {
  columns: string[];
  preview: Array<Record<string, string>>;
  rowCount: number;
  mappableCount: number;
  rows: Array<Record<string, string>>;
};

const MAX_BYTES = 5 * 1024 * 1024;
const MAX_ROWS_HINT = 500;

export default function UploadPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const reset = () => {
    setPreview(null);
    setFileName(null);
    setError(null);
  };

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Please upload a .csv file.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("File is too big. Max 5 MB.");
      return;
    }
    setLoading(true);
    setFileName(file.name);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Upload failed.");
        setPreview(null);
      } else {
        setPreview(data);
      }
    } catch (err) {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) void handleFile(file);
    },
    [handleFile]
  );

  const onCommit = async () => {
    if (!preview) return;
    setCommitting(true);
    setError(null);
    try {
      const res = await fetch("/api/upload/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: preview.rows }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Import failed.");
        setCommitting(false);
        return;
      }
      const count = data.inserted as number;
      const params = new URLSearchParams({
        imported: String(count),
      });
      router.push(`/dashboard?${params.toString()}`);
    } catch (err) {
      setError("Network error. Try again.");
      setCommitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <nav className="border-b border-slate-100">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <Link href="/" className="text-sm font-semibold tracking-tight">
            Gabriel Vian
          </Link>
          <Link
            href="/dashboard"
            className="text-xs text-slate-500 hover:text-slate-900 transition-colors"
          >
            View dashboard
          </Link>
        </div>
      </nav>

      <section className="mx-auto max-w-2xl px-6 pt-16 pb-20">
        <Link
          href="/"
          className="text-xs text-slate-500 hover:text-slate-900 transition-colors"
        >
          &larr; Back
        </Link>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">
          Upload your spreadsheet.
        </h1>
        <p className="mt-3 text-slate-600 leading-relaxed">
          Drop any CSV of orders, jobs, or tasks. I will detect the columns,
          map them to a real schema, and create a working admin view from it.
          Uploaded rows live for one hour on this public demo.
        </p>

        {!preview && (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={`mt-10 cursor-pointer rounded-lg border-2 border-dashed p-10 text-center transition-colors ${
              dragOver
                ? "border-slate-900 bg-slate-50"
                : "border-slate-300 hover:border-slate-500 hover:bg-slate-50"
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleFile(file);
              }}
            />
            <p className="text-sm font-medium text-slate-900">
              {loading
                ? "Reading your file..."
                : "Drop a CSV here, or click to select."}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Max 5 MB, up to {MAX_ROWS_HINT} rows. .csv only.
            </p>
            {fileName && !loading && (
              <p className="mt-3 text-xs text-slate-600">Selected: {fileName}</p>
            )}
          </div>
        )}

        {!preview && (
          <p className="mt-4 text-xs text-slate-500">
            Don&apos;t have a CSV?{" "}
            <a
              href="/sample-orders.csv"
              className="underline decoration-slate-300 underline-offset-4 hover:text-slate-900"
            >
              Try a sample.
            </a>
          </p>
        )}

        {error && (
          <div className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {preview && (
          <div className="mt-10 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">
              Looks right?
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {preview.rowCount} rows detected from{" "}
              <span className="font-medium text-slate-900">{fileName}</span>.{" "}
              {preview.mappableCount} mappable to job orders.
            </p>

            <div className="mt-5">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Detected columns
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {preview.columns.map((c) => (
                  <span
                    key={c}
                    className="inline-flex rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                First rows
              </p>
              <div className="mt-2 overflow-x-auto rounded-md border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-xs">
                  <thead className="bg-slate-50">
                    <tr>
                      {preview.columns.map((c) => (
                        <th
                          key={c}
                          className="px-3 py-2 text-left font-semibold text-slate-600"
                        >
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {preview.preview.map((r, i) => (
                      <tr key={i}>
                        {preview.columns.map((c) => (
                          <td key={c} className="px-3 py-2 text-slate-700">
                            {r[c] ?? ""}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={onCommit}
                disabled={committing}
                className="inline-flex items-center justify-center rounded-md bg-slate-900 px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-slate-800 transition-colors disabled:opacity-60"
              >
                {committing
                  ? "Importing..."
                  : `Looks good, import ${preview.mappableCount} rows`}
              </button>
              <button
                type="button"
                onClick={reset}
                className="text-sm text-slate-500 hover:text-slate-900 transition-colors"
              >
                Start over
              </button>
            </div>
            <p className="mt-4 text-xs text-slate-500">
              Imported rows expire in 1 hour on this public demo.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
