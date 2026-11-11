import Link from "next/link";
import Logo from "@/components/Logo";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-cream-200 bg-white dark:border-night-700 dark:bg-night-800">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="mb-3">
            <Logo size={40} />
          </div>
          <p className="text-sm text-neutral-500">
            Le marché en ligne des Comores. Simple, humain et chaleureux.
          </p>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-ocean-700 dark:text-ocean-200">Découvrir</h3>
          <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-300">
            <li><Link href="/recherche" className="hover:text-ocean-500">Explorer les annonces</Link></li>
            <li><Link href="/publier" className="hover:text-ocean-500">Publier une annonce</Link></li>
            <li><Link href="/livreurs" className="hover:text-ocean-500">Devenir livreur</Link></li>
            <li><Link href="/carte" className="hover:text-ocean-500">Carte des vendeurs</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-ocean-700 dark:text-ocean-200">Aide</h3>
          <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-300">
            <li><Link href="/aide" className="hover:text-ocean-500">Centre d'aide et FAQ</Link></li>
            <li><Link href="/aide#contact" className="hover:text-ocean-500">Contact et signalement</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-ocean-700 dark:text-ocean-200">Légal</h3>
          <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-300">
            <li><Link href="/legal/conditions" className="hover:text-ocean-500">Conditions générales</Link></li>
            <li><Link href="/legal/confidentialite" className="hover:text-ocean-500">Politique de confidentialité</Link></li>
            <li><Link href="/legal/mentions-legales" className="hover:text-ocean-500">Mentions légales</Link></li>
            <li><Link href="/legal/cookies" className="hover:text-ocean-500">Politique de cookies</Link></li>
            <li><Link href="/legal/regles" className="hover:text-ocean-500">Règles de la plateforme</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-cream-200 py-5 text-center text-xs text-neutral-400 dark:border-night-700">
        © {new Date().getFullYear()} N-marke — Fait avec ❤️ aux Comores ·{" "}
        <Link href="/proprietaire" className="hover:text-neutral-500">Espace propriétaire</Link>
      </div>
    </footer>
  );
}
