import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { animations, type AnimationKind } from "@/db/schema";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

const MAX_BYTES = 10 * 1024 * 1024; // 10MB — allows high quality .glb files while keeping DB lean

const ALLOWED: Record<string, AnimationKind> = {
  "image/gif": "image",
  "image/webp": "image",
  "image/png": "image",
  "image/apng": "image",
  "image/jpeg": "image",
  "image/svg+xml": "image",
  "video/mp4": "video",
  "video/webm": "video",
  "application/json": "lottie",
  "model/gltf-binary": "3d",
  "model/gltf+json": "3d",
};

/** List the animation library (metadata only — no base64 payloads). */
export async function GET() {
  const rows = await db
    .select({
      id: animations.id,
      name: animations.name,
      kind: animations.kind,
      mime: animations.mime,
      bytes: animations.bytes,
      createdAt: animations.createdAt,
    })
    .from(animations)
    .orderBy(desc(animations.createdAt))
    .limit(60);

  return NextResponse.json({ items: rows });
}

/** Upload a custom workout animation via multipart form data. */
export async function POST(req: NextRequest) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart form data." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file received." }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "That file is empty." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `Too large — keep animations under ${MAX_BYTES / 1024 / 1024}MB.` },
      { status: 413 },
    );
  }

  const lowerName = file.name.toLowerCase();
  const mime =
    file.type ||
    (lowerName.endsWith(".json") 
      ? "application/json" 
      : lowerName.endsWith(".glb") 
        ? "model/gltf-binary" 
        : lowerName.endsWith(".gltf") 
          ? "model/gltf+json" 
          : "application/octet-stream");
  const kind = ALLOWED[mime];

  if (!kind) {
    return NextResponse.json(
      { error: "Use a GIF, WebP, PNG, MP4, WebM, Lottie JSON, or GLB/GLTF file." },
      { status: 415 },
    );
  }

  const buf = Buffer.from(await file.arrayBuffer());

  // Lottie files must actually parse, otherwise the player would blow up later
  if (kind === "lottie") {
    try {
      const parsed = JSON.parse(buf.toString("utf8")) as { layers?: unknown };
      if (!parsed || typeof parsed !== "object" || !("layers" in parsed)) {
        throw new Error("not lottie");
      }
    } catch {
      return NextResponse.json(
        { error: "That JSON isn't a valid Lottie animation." },
        { status: 422 },
      );
    }
  }

  const rawName = (form.get("name") as string | null) ?? file.name;
  const name = rawName.replace(/\.[a-z0-9]+$/i, "").slice(0, 40) || "Untitled";

  const [row] = await db
    .insert(animations)
    .values({ name, kind, mime, bytes: file.size, data: buf.toString("base64") })
    .returning({
      id: animations.id,
      name: animations.name,
      kind: animations.kind,
      mime: animations.mime,
      bytes: animations.bytes,
      createdAt: animations.createdAt,
    });

  return NextResponse.json(row, { status: 201 });
}
