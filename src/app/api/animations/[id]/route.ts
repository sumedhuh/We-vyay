import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { animations } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const [row] = await db
    .delete(animations)
    .where(eq(animations.id, id))
    .returning({ id: animations.id });

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ id: row.id });
}
