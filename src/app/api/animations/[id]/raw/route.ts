import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { animations } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

/** Streams the stored asset with its real content type + immutable caching. */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const [row] = await db
    .select({ data: animations.data, mime: animations.mime })
    .from(animations)
    .where(eq(animations.id, id))
    .limit(1);

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const bytes = new Uint8Array(Buffer.from(row.data, "base64"));

  return new NextResponse(bytes, {
    headers: {
      "Content-Type": row.mime,
      "Content-Length": String(bytes.byteLength),
      // content is immutable per id, so the browser fetches each asset once
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
