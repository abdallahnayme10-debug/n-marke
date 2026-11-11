import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { requireVerifiedUser } from "@/lib/api";
import { processListingImage, processAvatar } from "@/lib/image";
import { uploadToCloudinary } from "@/lib/cloudinary";

// Upload d'image.
// - En production (Vercel) : envoie sur Cloudinary (système de fichiers en lecture seule).
// - En local (sans clés Cloudinary) : enregistre dans public/uploads.
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

  // 1) Cloudinary si configuré (production)
  const cloudUrl = await uploadToCloudinary(processed, type === "avatar" ? "nmarke/avatars" : "nmarke/listings");
  if (cloudUrl) {
    return NextResponse.json({ ok: true, url: cloudUrl });
  }

  // 2) Sinon, stockage local (développement)
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  const filename = `${randomUUID()}.jpg`;
  await writeFile(path.join(dir, filename), processed);

  return NextResponse.json({ ok: true, url: `/uploads/${filename}` });
}
