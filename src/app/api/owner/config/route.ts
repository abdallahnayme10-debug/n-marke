import { NextResponse } from "next/server";
import { isOwner } from "@/lib/owner";
import { getOwnerConfig, updateOwnerConfig } from "@/lib/settings";

// Config propriétaire : lire (secrets masqués) / mettre à jour.
export async function GET() {
  if (!(await isOwner())) {
    return NextResponse.json({ ok: false, error: "Accès refusé." }, { status: 401 });
  }
  const config = await getOwnerConfig();
  return NextResponse.json({ ok: true, config });
}

export async function POST(req: Request) {
  if (!(await isOwner())) {
    return NextResponse.json({ ok: false, error: "Accès refusé." }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  await updateOwnerConfig(body);
  const config = await getOwnerConfig();
  return NextResponse.json({ ok: true, config, message: "Réglages enregistrés ✅" });
}
