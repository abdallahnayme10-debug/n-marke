import { NextResponse } from "next/server";
import { searchListings } from "@/lib/search";

// 8 annonces similaires (même catégorie, prix proche, même île/région, même marque).
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const result = await searchListings({ similarTo: params.id, excludeId: params.id, limit: 8 });
  return NextResponse.json({ ok: true, items: result.items });
}
