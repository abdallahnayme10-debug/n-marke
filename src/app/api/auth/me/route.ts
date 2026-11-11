import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { REGIONS } from "@/lib/constants";

function safeUser(u: {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  isVerified: boolean;
  island: string | null;
  region: string | null;
  profilePhoto: string | null;
  bio: string | null;
  sellerTier: string;
  premiumUntil: Date | null;
  isCourier: boolean;
  role: string;
  referralCode: string;
  theme: string;
  dataSaver: boolean;
  smsEnabled: boolean;
  createdAt: Date;
}) {
  return {
    id: u.id,
    name: u.name,
    phone: u.phone,
    email: u.email,
    isVerified: u.isVerified,
    island: u.island,
    region: u.region,
    profilePhoto: u.profilePhoto,
    bio: u.bio,
    sellerTier: u.sellerTier,
    premiumUntil: u.premiumUntil,
    isCourier: u.isCourier,
    role: u.role,
    referralCode: u.referralCode,
    theme: u.theme,
    dataSaver: u.dataSaver,
    smsEnabled: u.smsEnabled,
    createdAt: u.createdAt,
  };
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Non connecté." }, { status: 401 });
  const full = await prisma.user.findUnique({ where: { id: user.id } });
  return NextResponse.json({ ok: true, user: safeUser(full!) });
}

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Non connecté." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const data: Record<string, unknown> = {};

  if (typeof body?.name === "string" && body.name.length >= 2) data.name = body.name;
  if (typeof body?.bio === "string") data.bio = body.bio.slice(0, 300);
  if (typeof body?.island === "string" && REGIONS[body.island]) data.island = body.island;
  if (typeof body?.region === "string") data.region = body.region;
  if (typeof body?.theme === "string" && ["light", "dark", "auto"].includes(body.theme)) data.theme = body.theme;
  if (typeof body?.dataSaver === "boolean") data.dataSaver = body.dataSaver;
  if (typeof body?.smsEnabled === "boolean") data.smsEnabled = body.smsEnabled;

  const updated = await prisma.user.update({ where: { id: user.id }, data });
  return NextResponse.json({ ok: true, user: safeUser(updated), message: "C'est enregistré !" });
}
