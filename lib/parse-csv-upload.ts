import Papa from "papaparse";
import { MAX_BYTES, MAX_ROWS, mapRow } from "@/lib/csv-mapping";

export type ParsedUpload = {
  columns: string[];
  preview: Array<Record<string, string>>;
  rowCount: number;
  mappableCount: number;
  mappedRows: Array<{
    title: string;
    customer: string;
    status: string;
    dueAt: string | null;
    notes: string | null;
  }>;
};

export type ParseError = {
  error: string;
  status: 400 | 413 | 415;
};

export function parseCsvUpload(
  file: File,
  name: string,
  size: number
): Promise<ParsedUpload | ParseError> {
  return new Promise((resolve) => {
    if (size > MAX_BYTES) {
      resolve({ error: "File is too big. Max 5 MB.", status: 413 });
      return;
    }
    if (!name.toLowerCase().endsWith(".csv")) {
      resolve({ error: "Please upload a .csv file.", status: 415 });
      return;
    }

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
      complete(results) {
        if (results.errors && results.errors.length > 0) {
          const first = results.errors[0];
          resolve({
            error: `CSV parse error: ${first?.message ?? "malformed file"}`,
            status: 400,
          });
          return;
        }
        const data = results.data || [];
        if (data.length === 0) {
          resolve({ error: "No rows found in file.", status: 400 });
          return;
        }
        if (data.length > MAX_ROWS) {
          resolve({
            error: `Too many rows. Max ${MAX_ROWS} rows per upload.`,
            status: 413,
          });
          return;
        }
        const columns = results.meta?.fields ?? Object.keys(data[0] || {});
        const preview = data.slice(0, 3);
        const mapped = data
          .map((r) => mapRow(r))
          .filter(
            (r): r is NonNullable<ReturnType<typeof mapRow>> => r !== null
          );
        const mappedRows = mapped.map((r) => ({
          title: r.title,
          customer: r.customer,
          status: r.status,
          dueAt: r.dueAt ? r.dueAt.toISOString() : null,
          notes: r.notes,
        }));
        resolve({
          columns,
          preview,
          rowCount: data.length,
          mappableCount: mapped.length,
          mappedRows,
        });
      },
      error(err) {
        resolve({ error: `CSV parse error: ${err.message}`, status: 400 });
      },
    });
  });
}
