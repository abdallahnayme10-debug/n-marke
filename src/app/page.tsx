import Link from "next/link";
import { prisma } from "@/lib/db";
import { runMaintenance } from "@/lib/maintenance";
import { searchListings } from "@/lib/search";
import { getFreePeriodDaysRemaining, getFreePeriodMode } from "@/lib/billing";
import { getCurrentUser } from "@/lib/auth";
import { toCardData } from "@/lib/serialize";
import SearchBar from "@/components/SearchBar";
import ListingGrid from "@/components/ListingGrid";
import PublicStats from "@/components/PublicStats";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  await runMaintenance();

  const [stats, categories, banners, featured, recent, commande, particulier, couriers, me] = await Promise.all([
    prisma.listing.count({ where: { status: "active" } }).then((activeListings) => ({
      activeListings,
      users: 0,
      deliveries: 0,
    })),
    prisma.category.findMany({ orderBy: { sort: "asc" }, include: { _count: { select: { listings: { where: { status: "active" } } } } } }),
    prisma.banner.findMany({ where: { active: true }, orderBy: { createdAt: "desc" } }),
    searchListings({ featured: true, limit: 12 }),
    searchListings({ sort: "recent", limit: 16 }),
    searchListings({ type: "commande", limit: 8 }),
    searchListings({ type: "particulier", limit: 8 }),
    prisma.user.findMany({ where: { isCourier: true }, select: { id: true, name: true, region: true, island: true, profilePhoto: true }, take: 6 }),
    getCurrentUser(),
  ]);

  const userCount = await prisma.user.count();
  const deliveryCount = await prisma.delivery.count({ where: { status: "livre" } });
  const regionCount = (await prisma.listing.groupBy({ by: ["region"], where: { status: "active" } })).length;
  const freeDays = await getFreePeriodDaysRemaining();
  const freePeriodMode = await getFreePeriodMode();

  const ads = await prisma.ad.findMany({
    where: { status: "active", endsAt: { gt: new Date() } },
    orderBy: { startsAt: "desc" },
    take: 12,
    include: { user: { select: { name: true } } },
  });

  const allStats = {
    activeListings: stats.activeListings,
    users: userCount,
    deliveries: deliveryCount,
    regionsCovered: regionCount,
    freeDays: Math.max(0, freeDays),
    freePeriodActive: freePeriodMode === "indefinite" || freeDays > 0,
    freePeriodIndefinite: freePeriodMode === "indefinite",
  };

  const nearMe = me?.region
    ? await searchListings({ island: me.island || undefined, region: me.region, limit: 8 })
    : null;

  return (
    <div className="pb-10">
      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-ocean-50 via-cream-50 to-cream dark:from-night-800 dark:via-night-900 dark:to-night-900">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-leaf-200/40 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 top-32 h-64 w-64 rounded-full bg-sand-200/40 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4 py-10 sm:py-16">
          {/* Compteur période gratuite */}
          {allStats.freePeriodActive && (
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-sand-100 px-4 py-2 text-sm font-bold text-sand-800 dark:bg-night-700 dark:text-sand-200">
              🎁 {allStats.freePeriodIndefinite
                ? "N-marke est gratuit pour le moment !"
                : `Profitez de N-marke gratuitement encore ${allStats.freeDays} jour${allStats.freeDays > 1 ? "s" : ""}`}
            </div>
          )}

          <h1 className="max-w-2xl text-3xl font-extrabold leading-tight text-ocean-900 dark:text-white sm:text-5xl">
            Le marché en ligne des Comores, <span className="text-ocean-500">tout simplement</span>.
          </h1>
          <p className="mt-3 max-w-xl text-base text-neutral-600 dark:text-neutral-300 sm:text-lg">
            Achète, vends et fais-toi livrer par moto. N-marke, c'est fait avec le cœur, pour toi. 🌴
          </p>

          <div className="mt-6 max-w-2xl">
            <SearchBar hero />
          </div>
        </div>
      </section>

      {/* ── BANNIÈRES ── */}
      {banners.length > 0 && (
        <section className="mx-auto max-w-6xl px-4">
          <div className="mt-6 flex gap-3 overflow-x-auto no-scrollbar">
            {banners.map((b) => (
              <div
                key={b.id}
                className="flex shrink-0 items-center gap-3 rounded-3xl px-5 py-4 shadow-soft"
                style={{ background: b.color }}
              >
                <span className="text-3xl">{b.emoji || "🎉"}</span>
                <div>
                  <p className="font-bold text-white">{b.title}</p>
                  <p className="text-sm text-white/90">{b.message}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── PUBLICITÉS ── */}
      {ads.length > 0 && (
        <section className="mx-auto mt-8 max-w-6xl px-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-ocean-900 dark:text-white">📣 Publicités</h2>
            <Link href="/publicite" className="text-sm font-bold text-ocean-500 hover:underline">Faire de la pub</Link>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
            {ads.map((a) => (
              <a
                key={a.id}
                href={a.link}
                target={a.link.startsWith("http") ? "_blank" : undefined}
                rel="noopener noreferrer"
                className="card flex shrink-0 items-center gap-3 p-3 hover:-translate-y-1"
                style={{ maxWidth: 320 }}
              >
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-cream-100 dark:bg-night-700">
                  {a.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-2xl">📣</div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="line-clamp-1 font-bold text-ocean-900 dark:text-white">{a.title}</p>
                  <p className="text-xs text-neutral-400">par {a.user?.name}</p>
                  <span className="badge mt-1 bg-sand-200 text-sand-800">Sponsorisé</span>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* ── CATÉGORIES ── */}
      <section className="mx-auto mt-10 max-w-6xl px-4">
        <h2 className="section-title mb-4">Parcourir par catégorie</h2>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/recherche?category=${c.slug}`}
              className="card flex flex-col items-center gap-2 p-4 text-center transition-all hover:-translate-y-1 hover:shadow-warm"
            >
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-cream-100 text-2xl dark:bg-night-700">{c.icon}</span>
              <span className="text-xs font-bold text-ocean-800 dark:text-ocean-100">{c.name}</span>
              <span className="text-xs text-neutral-400">{c._count.listings} annonces</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── ANNONCES À LA UNE ── */}
      {featured.items.length > 0 && (
        <section className="mx-auto mt-12 max-w-6xl px-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="section-title">✨ À la une</h2>
            <Link href="/recherche?featured=1" className="text-sm font-bold text-ocean-500 hover:underline">Tout voir</Link>
          </div>
          <ListingGrid items={featured.items.map(toCardData)} />
        </section>
      )}

      {/* ── FILTRES RAPIDES (sections courtes) ── */}
      <section className="mx-auto mt-12 max-w-6xl px-4">
        <div className="grid gap-8 lg:grid-cols-2">
          {commande.items.length > 0 && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-ocean-900 dark:text-white">🔵 Sur commande en ce moment</h2>
                <Link href="/recherche?type=commande" className="text-sm font-bold text-ocean-500 hover:underline">Tout voir</Link>
              </div>
              <ListingGrid items={commande.items.map(toCardData)} />
            </div>
          )}
          {particulier.items.length > 0 && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-ocean-900 dark:text-white">🤝 Ventes entre particuliers</h2>
                <Link href="/recherche?type=particulier" className="text-sm font-bold text-ocean-500 hover:underline">Tout voir</Link>
              </div>
              <ListingGrid items={particulier.items.map(toCardData)} />
            </div>
          )}
        </div>
      </section>

      {/* ── LIVREURS DISPONIBLES ── */}
      {couriers.length > 0 && (
        <section className="mx-auto mt-12 max-w-6xl px-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="section-title">🏍️ Livreurs disponibles maintenant</h2>
            <Link href="/livreurs" className="text-sm font-bold text-ocean-500 hover:underline">Tous les livreurs</Link>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
            {couriers.map((c) => (
              <Link key={c.id} href="/livreurs" className="card flex shrink-0 items-center gap-3 p-4">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-leaf-100 text-xl dark:bg-night-700">
                  {c.profilePhoto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.profilePhoto} alt={c.name} className="h-full w-full rounded-full object-cover" />
                  ) : "🏍️"}
                </span>
                <div>
                  <p className="font-bold text-ocean-900 dark:text-white">{c.name}</p>
                  <p className="text-xs text-neutral-500">📍 {c.region} · Disponible</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── PRÈS DE CHEZ MOI ── */}
      {nearMe && nearMe.items.length > 0 && (
        <section className="mx-auto mt-12 max-w-6xl px-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="section-title">📍 Près de chez moi ({me!.region})</h2>
            <Link href={`/recherche?island=${me!.island}&region=${encodeURIComponent(me!.region || "")}`} className="text-sm font-bold text-ocean-500 hover:underline">Tout voir</Link>
          </div>
          <ListingGrid items={nearMe.items.map(toCardData)} />
        </section>
      )}

      {/* ── ANNONCES RÉCENTES ── */}
      <section className="mx-auto mt-12 max-w-6xl px-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="section-title">🕘 Annonces récentes</h2>
          <Link href="/recherche" className="text-sm font-bold text-ocean-500 hover:underline">Tout voir</Link>
        </div>
        <ListingGrid items={recent.items.map(toCardData)} />
      </section>

      {/* ── STATISTIQUES PUBLIQUES ── */}
      <PublicStats stats={allStats} />
    </div>
  );
}
