import { NextResponse } from "next/server";
import Papa from "papaparse";
import { MAX_BYTES, MAX_ROWS, mapRow } from "@/lib/csv-mapping";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch (err) {
    return NextResponse.json(
      { error: "Could not read upload. Try again." },
      { status: 400 }
    );
  }

  const file = form.get("file");
  if (!file || typeof file === "string") {
    return NextResponse.json(
      { error: "No file attached." },
      { status: 400 }
    );
  }

  const name = (file as File).name || "";
  const size = (file as File).size || 0;

  if (size > MAX_BYTES) {
    return NextResponse.json(
      { error: "File is too big. Max 5 MB." },
      { status: 413 }
    );
  }

  const isCsvName = name.toLowerCase().endsWith(".csv");
  if (!isCsvName) {
    return NextResponse.json(
      { error: "Please upload a .csv file." },
      { status: 415 }
    );
  }

  const text = await (file as File).text();
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  if (parsed.errors && parsed.errors.length > 0) {
    const first = parsed.errors[0];
    return NextResponse.json(
      {
        error: `CSV parse error: ${first?.message ?? "malformed file"}`,
      },
      { status: 400 }
    );
  }

  const data = parsed.data || [];
  if (data.length === 0) {
    return NextResponse.json(
      { error: "No rows found in file." },
      { status: 400 }
    );
  }

  if (data.length > MAX_ROWS) {
    return NextResponse.json(
      { error: `Too many rows. Max ${MAX_ROWS} rows per upload.` },
      { status: 413 }
    );
  }

  const columns = parsed.meta?.fields ?? Object.keys(data[0] || {});
  const preview = data.slice(0, 3);
  const mappedCount = data.filter((r) => mapRow(r) !== null).length;

  return NextResponse.json({
    columns,
    preview,
    rowCount: data.length,
    mappableCount: mappedCount,
    rows: data,
  });
}
