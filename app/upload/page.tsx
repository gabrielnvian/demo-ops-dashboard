"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import type { JobStatus } from "@prisma/client";
import { parseCsvUpload, type ParsedUpload } from "@/lib/parse-csv-upload";
import { addLocalOrdersFromMapped } from "@/lib/local-orders";
import {
  CUSTOMER_MAX,
  NOTES_MAX,
  TITLE_MAX,
  UnsafeInputError,
  sanitizeText,
} from "@/lib/validation";

type MappedRow = {
  title: string;
  customer: string;
  status: JobStatus;
  dueAt: string | null;
  notes: string | null;
};

type PreviewResponse = ParsedUpload;

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
    setLoading(true);
    setFileName(file.name);
    try {
      const result = await parseCsvUpload(file, file.name, file.size);
      if ("error" in result) {
        setError(result.error);
        setPreview(null);
      } else {
        setPreview(result);
      }
    } catch {
      setError("Could not read file. Try again.");
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

  const onCommit = () => {
    if (!preview) return;
    setCommitting(true);
    setError(null);
    try {
      // Sanitize on the client before writing to localStorage. The column
      // mapping pass already ran, so here we just enforce length caps and
      // refuse embedded <script>/<iframe>.
      const cleaned: Array<Omit<MappedRow, never>> = [];
      for (const r of preview.mappedRows) {
        const title = sanitizeText(r.title, TITLE_MAX);
        if (!title) continue;
        const customer = sanitizeText(r.customer, CUSTOMER_MAX) || "Unknown";
        const notes = r.notes ? sanitizeText(r.notes, NOTES_MAX) : "";
        cleaned.push({
          title,
          customer,
          status: r.status as JobStatus,
          dueAt: r.dueAt,
          notes: notes || null,
        });
      }
      if (cleaned.length === 0) {
        setError(
          "No rows had a recognizable title column. Check your CSV headers."
        );
        setCommitting(false);
        return;
      }
      const saved = addLocalOrdersFromMapped(cleaned);
      const params = new URLSearchParams({
        imported: String(saved.length),
      });
      router.push(`/dashboard?${params.toString()}`);
    } catch (err) {
      if (err instanceof UnsafeInputError) {
        setError(err.message);
      } else {
        setError("Could not import rows. Try again.");
      }
      setCommitting(false);
    }
  };

  return (
    <main id="main-content" className="min-h-screen bg-white text-slate-900">
      <nav aria-label="Primary" className="border-b border-slate-100">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <Link
            href="/"
            aria-label="Gabriel Vian, home"
            className="text-sm font-semibold tracking-tight focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 rounded"
          >
            Gabriel Vian
          </Link>
          <Link
            href="/dashboard"
            className="text-xs text-slate-600 hover:text-slate-900 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 rounded"
          >
            View dashboard
          </Link>
        </div>
      </nav>

      <section className="mx-auto max-w-2xl px-6 pt-16 pb-20">
        <Link
          href="/"
          aria-label="Back to landing page"
          className="text-xs text-slate-600 hover:text-slate-900 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 rounded"
        >
          <span aria-hidden="true">&larr;</span> Back
        </Link>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">
          Upload your spreadsheet.
        </h1>
        <p className="mt-3 text-slate-700 leading-relaxed">
          Drop any CSV of orders, jobs, or tasks. I detect the columns, map
          them to a real schema, and drop the rows into a working admin view.
          On this public demo the rows are saved to your browser only; in
          production they would write to the same Postgres the dashboard
          reads from.
        </p>

        {!preview && (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={`mt-10 rounded-lg border-2 border-dashed transition-colors ${
              dragOver
                ? "border-slate-900 bg-slate-50"
                : "border-slate-400 hover:border-slate-600 hover:bg-slate-50"
            }`}
          >
            <input
              ref={inputRef}
              id="csv-file-input"
              type="file"
              accept=".csv,text/csv"
              aria-label="Choose a CSV file to upload"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleFile(file);
              }}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              aria-label="Choose a CSV file, or drop one onto this region"
              aria-describedby="dropzone-hint"
              className="block w-full cursor-pointer rounded-lg p-10 text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
            >
              <span className="block text-sm font-medium text-slate-900">
                {loading
                  ? "Reading your file..."
                  : "Drop a CSV here, or click to select."}
              </span>
              <span id="dropzone-hint" className="mt-2 block text-xs text-slate-600">
                Max 5 MB, up to {MAX_ROWS_HINT} rows. .csv only.
              </span>
              {fileName && !loading && (
                <span className="mt-3 block text-xs text-slate-700">
                  Selected: {fileName}
                </span>
              )}
            </button>
          </div>
        )}

        {!preview && (
          <p className="mt-4 text-xs text-slate-600">
            Don&apos;t have a CSV?{" "}
            <a
              href="/sample-orders.csv"
              className="underline decoration-slate-300 underline-offset-4 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 rounded"
            >
              Try a sample.
            </a>
          </p>
        )}

        {error && (
          <div
            role="alert"
            aria-live="assertive"
            className="mt-6 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900"
          >
            {error}
          </div>
        )}

        {preview && (
          <section
            aria-labelledby="preview-heading"
            className="mt-10 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h2 id="preview-heading" className="text-base font-semibold text-slate-900">
              Looks right?
            </h2>
            <p className="mt-1 text-sm text-slate-700">
              {preview.rowCount} rows detected from{" "}
              <span className="font-medium text-slate-900">{fileName}</span>.{" "}
              {preview.mappableCount} mappable to job orders.
            </p>

            <div className="mt-5">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-700">
                Detected columns
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {preview.columns.map((c) => (
                  <span
                    key={c}
                    className="inline-flex rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-800"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-700">
                First rows
              </p>
              <div className="mt-2 overflow-x-auto rounded-md border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-xs">
                  <caption className="sr-only">
                    Preview of the first rows detected in your uploaded CSV.
                  </caption>
                  <thead className="bg-slate-50">
                    <tr>
                      {preview.columns.map((c) => (
                        <th
                          key={c}
                          scope="col"
                          className="px-3 py-2 text-left font-semibold text-slate-800"
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
                          <td key={c} className="px-3 py-2 text-slate-800">
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
                aria-label={
                  committing
                    ? "Importing rows"
                    : `Import ${preview.mappableCount} rows into this browser`
                }
                className="inline-flex items-center justify-center rounded-md bg-slate-900 px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-slate-800 transition-colors disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
              >
                {committing
                  ? "Importing..."
                  : `Looks good, import ${preview.mappableCount} rows`}
              </button>
              <button
                type="button"
                onClick={reset}
                aria-label="Start over and choose a different CSV"
                className="text-sm text-slate-700 hover:text-slate-900 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 rounded"
              >
                Start over
              </button>
            </div>
            <p className="mt-4 text-xs text-slate-600">
              Imported rows are saved to your browser&apos;s localStorage and
              never leave your machine.
            </p>
          </section>
        )}
      </section>
    </main>
  );
}
