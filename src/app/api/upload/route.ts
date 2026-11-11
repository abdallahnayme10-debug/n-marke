import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { requireVerifiedUser } from "@/lib/api";
import { processListingImage, processAvatar } from "@/lib/image";

// Upload d'image local (développement). En production, brancher Cloudinary.
export async function POST(req: Request) {
  const { user, error } = await requireVerifiedUser();
  if (error) return error;

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  const type = form?.get("type"); // "listing" | "avatar"
  const position = (form?.get("position") as string) || "bottom-right";
  const watermark = type !== "avatar";

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "Aucune image reçue." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const processed =
    type === "avatar"
      ? await processAvatar(buffer)
      : await processListingImage(buffer, { watermark, position: position as never });

  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  const filename = `${randomUUID()}.jpg`;
  await writeFile(path.join(dir, filename), processed);

  return NextResponse.json({ ok: true, url: `/uploads/${filename}` });
}
