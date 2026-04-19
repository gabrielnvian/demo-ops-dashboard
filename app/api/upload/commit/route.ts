import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MAX_ROWS, mapRow } from "@/lib/csv-mapping";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = { rows?: Array<Record<string, string>> };

export async function POST(request: Request) {
  let body: Body;
  try {
    body = await request.json();
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }

  const rows = body.rows || [];
  if (rows.length === 0) {
    return NextResponse.json(
      { error: "No rows to import." },
      { status: 400 }
    );
  }
  if (rows.length > MAX_ROWS) {
    return NextResponse.json(
      { error: `Too many rows. Max ${MAX_ROWS} rows per upload.` },
      { status: 413 }
    );
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 60 * 60 * 1000);

  const mapped = rows
    .map((r) => mapRow(r))
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .map((r) => ({
      ...r,
      createdAt: now,
      expiresAt,
    }));

  if (mapped.length === 0) {
    return NextResponse.json(
      {
        error:
          "No rows had a recognizable title column. Make sure your CSV has a title, order, job, or name column.",
      },
      { status: 400 }
    );
  }

  try {
    const result = await prisma.$transaction(
      mapped.map((r) => prisma.jobOrder.create({ data: r }))
    );
    return NextResponse.json({
      inserted: result.length,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (err) {
    console.error("[upload/commit] insert failed:", err);
    return NextResponse.json(
      { error: "Could not save rows. Try again." },
      { status: 500 }
    );
  }
}
