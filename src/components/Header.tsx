"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/app/providers";
import Logo from "@/components/Logo";

type User = { id: string; name: string; role: string; isCourier: boolean; profilePhoto: string | null; isVerified: boolean };

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        setUser(d.ok ? d.user : null);
        if (d.ok) {
          fetch("/api/notifications")
            .then((r) => r.json())
            .then((n) => setUnread(n.unread || 0))
            .catch(() => {});
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [pathname]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/");
    router.refresh();
  }

  const navLink = (href: string, label: string) => (
    <Link
      href={href}
      className={`rounded-xl px-3 py-2 text-sm font-bold transition-colors ${
        pathname === href ? "bg-ocean-50 text-ocean-700 dark:bg-night-700 dark:text-ocean-200" : "text-ocean-800 hover:bg-ocean-50 dark:text-ocean-100 dark:hover:bg-night-700"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-cream-200 bg-cream-50/90 backdrop-blur-md dark:border-night-700 dark:bg-night-900/90">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        {/* Logo */}
        <Logo size={40} />

        {/* Navigation desktop */}
        <nav className="ml-2 hidden items-center gap-1 lg:flex">
          {navLink("/", "Accueil")}
          {navLink("/recherche", "Explorer")}
          {navLink("/publier", "Vendre")}
          {navLink("/publicite", "Publicité")}
          {navLink("/livreurs", "Livreurs")}
          {navLink("/aide", "Aide")}
        </nav>

        {/* Recherche compacte (desktop) */}
        <form
          className="ml-auto hidden flex-1 max-w-sm md:block"
          onSubmit={(e) => {
            e.preventDefault();
            const q = (e.currentTarget.elements.namedItem("q") as HTMLInputElement)?.value;
            router.push(`/recherche?q=${encodeURIComponent(q || "")}`);
          }}
        >
          <input
            name="q"
            type="search"
            placeholder="Chercher un produit, une marque…"
            className="input py-2"
          />
        </form>

        <div className="ml-auto flex items-center gap-1 md:ml-3" ref={menuRef}>
          {/* Mode sombre */}
          <button
            onClick={() => setTheme(theme === "auto" ? (resolvedTheme === "dark" ? "light" : "dark") : theme === "dark" ? "light" : "dark")}
            className="grid h-10 w-10 place-items-center rounded-2xl text-lg hover:bg-cream-200 dark:hover:bg-night-700"
            aria-label="Basculer le mode sombre"
            title="Mode sombre"
          >
            {resolvedTheme === "dark" ? "☀️" : "🌙"}
          </button>

          {!loading && user ? (
            <>
              <Link href="/favoris" className="grid h-10 w-10 place-items-center rounded-2xl text-lg hover:bg-cream-200 dark:hover:bg-night-700" title="Mes favoris">❤️</Link>
              <Link href="/messages" className="relative grid h-10 w-10 place-items-center rounded-2xl text-lg hover:bg-cream-200 dark:hover:bg-night-700" title="Messages">💬</Link>
              <Link href="/notifications" className="relative grid h-10 w-10 place-items-center rounded-2xl text-lg hover:bg-cream-200 dark:hover:bg-night-700" title="Notifications">
                🔔
                {unread > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 grid h-5 w-5 place-items-center rounded-full bg-red-500 text-[10px] font-bold text-white">{unread > 9 ? "9+" : unread}</span>
                )}
              </Link>
              <button onClick={() => setMenuOpen((v) => !v)} className="flex items-center gap-2 rounded-2xl p-1 hover:bg-cream-200 dark:hover:bg-night-700">
                <span className="grid h-9 w-9 place-items-center overflow-hidden rounded-full bg-ocean-100 text-base font-bold text-ocean-700 dark:bg-night-700 dark:text-ocean-200">
                  {user.profilePhoto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.profilePhoto} alt={user.name} className="h-full w-full object-cover" />
                  ) : (
                    user.name?.charAt(0)?.toUpperCase() || "🙂"
                  )}
                </span>
              </button>

              {menuOpen && (
                <div className="absolute right-4 top-16 w-60 overflow-hidden rounded-3xl border border-cream-200 bg-white shadow-soft-lg dark:border-night-700 dark:bg-night-800">
                  <div className="border-b border-cream-200 px-4 py-3 dark:border-night-700">
                    <p className="font-bold text-ocean-900 dark:text-white">{user.name}</p>
                    <p className="text-xs text-neutral-500">{user.isCourier ? "Livreur 🏍️" : user.role === "admin" ? "Administrateur" : "Membre"}</p>
                  </div>
                  <MenuLink href="/mon-compte" label="👤 Mon profil" />
                  <MenuLink href="/mes-annonces" label="📦 Mes annonces" />
                  <MenuLink href="/commandes" label="🛒 Mes commandes" />
                  <MenuLink href="/parrainage" label="🎁 Parrainage" />
                  {user.isCourier && <MenuLink href="/tableau-de-bord-livreur" label="🏍️ Tableau livreur" />}
                  {user.role === "admin" && <MenuLink href="/admin" label="🛠️ Administration" />}
                  <button onClick={logout} className="block w-full px-4 py-3 text-left text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                    Se déconnecter
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/connexion" className="btn-ghost px-4 py-2">Connexion</Link>
              <Link href="/inscription" className="btn-primary px-4 py-2">S'inscrire</Link>
            </div>
          )}
        </div>
      </div>

      {/* Barre de navigation mobile */}
      <nav className="flex items-center gap-1 overflow-x-auto px-4 pb-2 no-scrollbar lg:hidden">
        {navLink("/", "Accueil")}
        {navLink("/recherche", "Explorer")}
        {navLink("/publier", "Vendre")}
        {navLink("/publicite", "Publicité")}
        {navLink("/livreurs", "Livreurs")}
        {navLink("/aide", "Aide")}
      </nav>
    </header>
  );
}

function MenuLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="block px-4 py-3 text-sm font-semibold text-ocean-800 hover:bg-cream-100 dark:text-ocean-100 dark:hover:bg-night-700">
      {label}
    </Link>
  );
}
