import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { collectionItems } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

/** Which collections already contain this workout (drives the save state). */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const rows = await db
    .select({ collectionId: collectionItems.collectionId })
    .from(collectionItems)
    .where(eq(collectionItems.workoutId, id));

  return NextResponse.json({ ids: rows.map((r: { collectionId: string }) => r.collectionId) });
}
