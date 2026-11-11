import { NextResponse } from "next/server";
import { analyzeImage, logVisionSearch } from "@/lib/vision";
import { searchListings } from "@/lib/search";
import { getCurrentUser } from "@/lib/auth";

// Recherche par photo (Google Vision / Clarifai en prod, simulation locale).
// IMPORTANT : la photo est analysée puis supprimée — jamais stockée.
export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "Choisis une photo à analyser." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const analysis = await analyzeImage(buffer);

  const me = await getCurrentUser();
  await logVisionSearch(analysis.category || "recherche visuelle", me?.id);

  // Recherche d'annonces proches visuellement (par catégorie détectée, sinon global)
  const result = await searchListings({
    ...(analysis.category ? { q: analysis.category } : {}),
    limit: 24,
    sort: "popular",
  });

  return NextResponse.json({
    ok: true,
    analysis,
    ...result,
    message: analysis.category
      ? `On dirait que c'est lié à : ${analysis.category}. Voici des annonces similaires !`
      : "Voici des annonces qui pourraient ressembler à ta photo !",
  });
}
