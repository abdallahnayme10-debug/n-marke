import { notFound } from "next/navigation";
import { getConfigValue } from "@/lib/settings";

export const dynamic = "force-dynamic";

const DEFAULTS: Record<string, { title: string; emoji: string; content: string[] }> = {
  conditions: {
    title: "Conditions générales d'utilisation",
    emoji: "📄",
    content: [
      "Bienvenue sur N-marke ! En utilisant notre plateforme, tu acceptes ces conditions simples et honnêtes.",
      "N-marke est un marché en ligne qui met en relation des acheteurs, des vendeurs et des livreurs aux Comores. Nous ne sommes pas propriétaires des produits vendus : chaque vendeur est responsable de ses annonces, de la qualité de ses produits et de ses engagements.",
      "En t'inscrivant, tu t'engages à fournir des informations exactes et à ne pas vendre d'articles interdits (voir nos Règles de la plateforme).",
      "Les transactions se font directement entre les utilisateurs. N-marke fournit les outils de mise en relation, la messagerie et la livraison par moto, mais n'est pas partie aux transactions entre acheteurs et vendeurs.",
      "Nous nous réservons le droit de suspendre un compte qui ne respecte pas ces règles, notamment en cas de litiges répétés ou de comportement frauduleux.",
      "En cas de problème, utilise notre système de litige ou contacte le support. Nous ferons de notre mieux pour t'aider, avec bienveillance.",
    ],
  },
  confidentialite: {
    title: "Politique de confidentialité",
    emoji: "🔒",
    content: [
      "Chez N-marke, on respecte ta vie privée. Voici exactement ce qu'on fait avec tes informations.",
      "Nous collectons : ton nom ou pseudo, ton numéro de téléphone, ton île et ta région, tes annonces, tes messages et tes commandes. C'est tout.",
      "Ton numéro de téléphone sert à te connecter et à t'envoyer des notifications importantes (commandes, livraisons, paiements). Nous ne le vendons jamais à personne.",
      "Ton mot de passe est chiffré : personne, même nous, ne peut le lire.",
      "Les photos que tu envoies pour la recherche visuelle sont analysées puis supprimées immédiatement. Elles ne sont jamais sauvegardées.",
      "Tu peux demander la suppression de ton compte et de tes données à tout moment en contactant le support.",
    ],
  },
  "mentions-legales": {
    title: "Mentions légales",
    emoji: "⚖️",
    content: [
      "N-marke est un service de marché en ligne opéré aux Comores.",
      "Pour toute question, contacte-nous via la page d'aide ou à l'adresse indiquée sur la plateforme.",
      "N-marke est une marque de la plateforme. Tous les contenus (logo, textes, design) sont protégés.",
      "Les prix affichés sont en francs comoriens (KMF) et sont fixés librement par les vendeurs.",
    ],
  },
  cookies: {
    title: "Politique de cookies",
    emoji: "🍪",
    content: [
      "N-marke utilise des cookies pour améliorer ton expérience.",
      "Nous utilisons : un cookie de session pour te garder connecté(e), et le stockage local pour tes préférences (mode sombre, économie de données, vue grille/liste).",
      "Ces cookies ne servent pas à te suivre à travers le web et ne partagent aucune donnée avec des tiers publicitaires.",
      "Tu peux supprimer les cookies à tout moment dans les réglages de ton navigateur.",
    ],
  },
  regles: {
    title: "Règles de la plateforme",
    emoji: "📏",
    content: [
      "Pour que N-marke reste un espace sûr et agréable pour tous, voici ce qui est interdit de vendre :",
      "❌ Armes, munitions et explosifs",
      "❌ Drogues et substances illicites",
      "❌ Produits contrefaits ou volés",
      "❌ Animaux vivants (sauf autorisation spéciale)",
      "❌ Médicaments sur ordonnance",
      "❌ Produits dangereux ou rappelés",
      "❌ Contenus offensants, discriminatoires ou illégaux",
      "❌ Comptes bancaires ou données personnelles d'autrui",
      "En cas de doute, demande-toi : est-ce que je vendrais ça à ma famille ? Si la réponse est non, ne le vends pas ici.",
      "Le non-respect de ces règles peut entraîner la suppression de l'annonce et la suspension du compte.",
    ],
  },
};

// Clé de réglage correspondante (modifiable par le propriétaire)
const CONFIG_KEY: Record<string, string> = {
  conditions: "rule_conditions",
  confidentialite: "rule_confidentialite",
  regles: "rule_regles",
};

export default async function LegalPage({ params }: { params: { slug: string } }) {
  const page = DEFAULTS[params.slug];
  if (!page) notFound();

  // Règle personnalisée par le propriétaire (si définie)
  let content = page.content;
  const configKey = CONFIG_KEY[params.slug];
  if (configKey) {
    const custom = await getConfigValue(configKey as never);
    if (custom && custom.trim()) {
      content = custom
        .split(/\n+/)
        .map((l) => l.trim())
        .filter(Boolean);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-6 text-center">
        <span className="text-5xl">{page.emoji}</span>
        <h1 className="mt-2 text-3xl font-extrabold text-ocean-900 dark:text-white">{page.title}</h1>
      </div>
      <div className="card space-y-4 p-6">
        {content.map((p, i) => (
          <p key={i} className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-200">{p}</p>
        ))}
      </div>
    </div>
  );
}
