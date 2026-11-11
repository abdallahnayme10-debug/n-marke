// Constantes métier de N-marke

export const ISLANDS = [
  { value: "grande-comore", label: "Grande Comore" },
  { value: "anjouan", label: "Anjouan" },
  { value: "moheli", label: "Mohéli" },
] as const;

export const REGIONS: Record<string, string[]> = {
  "grande-comore": [
    "Moroni",
    "Mitsamiouli",
    "Foumbouni",
    "Mbéni",
    "Itsandra",
    "Oichili",
    "Hahaya",
    "Dimani",
  ],
  anjouan: ["Mutsamudu", "Domoni", "Sima", "Ouani", "Moya", "Bazimini"],
  moheli: ["Fomboni", "Miringoni", "Nioumachoua", "Djoiézi", "Hoani"],
};

export const CATEGORIES = [
  { name: "Vêtements et chaussures", icon: "👕", sub: ["Femme", "Homme", "Enfant", "Chaussures", "Accessoires", "Tissus"] },
  { name: "Téléphones et accessoires", icon: "📱", sub: ["Smartphones", "Téléphones simples", "Chargeurs", "Coques", "Écouteurs", "Batteries"] },
  { name: "Électronique et informatique", icon: "💻", sub: ["Ordinateurs", "TV et audio", "Tablettes", "Imprimantes", "Accessoires"] },
  { name: "Alimentation et boissons", icon: "🍽️", sub: ["Épicerie", "Fruits et légumes", "Viandes et poissons", "Plats préparés", "Gâteaux et pâtisseries", "Boissons"] },
  { name: "Maison et décoration", icon: "🏠", sub: ["Meubles", "Cuisine", "Décoration", "Linge de maison", "Électroménager"] },
  { name: "Beauté et bien-être", icon: "💄", sub: ["Cosmétiques", "Soins capillaires", "Parfums", "Bijoux", "Santé"] },
  { name: "Véhicules et pièces détachées", icon: "🚗", sub: ["Voitures", "Motos", "Vélos", "Pièces détachées", "Accessoires auto"] },
  { name: "Services", icon: "🛠️", sub: ["Couture", "Coiffure", "Réparation", "Déménagement", "Cours particuliers", "Autres services"] },
  { name: "Livres et loisirs", icon: "📚", sub: ["Livres", "Musique", "Jeux", "Sport", "Instruments"] },
  { name: "Jouets et enfants", icon: "🧸", sub: ["Jouets", "Puériculture", "Vêtements bébé", "Jeux éducatifs"] },
  { name: "Agriculture et jardin", icon: "🌱", sub: ["Semences", "Outils", "Plantes", "Produits agricoles"] },
  { name: "Autre", icon: "📦", sub: ["Divers"] },
] as const;

export const LISTING_TYPES = {
  disponible: { label: "Disponible maintenant", badge: "bg-leaf-100 text-leaf-700", emoji: "🟢" },
  commande: { label: "Sur commande", badge: "bg-ocean-100 text-ocean-700", emoji: "🔵" },
  occasion: { label: "Occasion / Reconditionné", badge: "bg-sand-200 text-sand-800", emoji: "🟠" },
  particulier: { label: "Vente entre particuliers", badge: "bg-neutral-100 text-neutral-600", emoji: "⚪" },
} as const;

export const CONDITIONS = [
  { value: "neuf", label: "Neuf" },
  { value: "comme-neuf", label: "Comme neuf" },
  { value: "bon-etat", label: "Bon état" },
  { value: "etat-correct", label: "État correct" },
  { value: "pieces", label: "Pour pièces" },
] as const;

export const SELLER_TIERS = {
  occasionnel: { label: "Particulier", maxListings: 3, badge: "bg-neutral-100 text-neutral-600" },
  regulier: { label: "Vendeur", maxListings: 5, badge: "bg-ocean-100 text-ocean-700" },
  premium: { label: "Vendeur Premium", maxListings: 9999, badge: "bg-sand-200 text-sand-800" },
} as const;

export const ORDER_STATUSES: Record<string, { label: string; emoji: string }> = {
  recue: { label: "Commande reçue", emoji: "📥" },
  confirmee: { label: "Confirmée par le vendeur", emoji: "✅" },
  preparation: { label: "En préparation", emoji: "📦" },
  livraison: { label: "En livraison", emoji: "🏍️" },
  livree: { label: "Livrée", emoji: "🎉" },
  annulee: { label: "Annulée", emoji: "✖️" },
};

export const DELIVERY_STATUSES: Record<string, { label: string; emoji: string }> = {
  en_attente: { label: "En attente du livreur", emoji: "⏳" },
  en_route_vendeur: { label: "Livreur en route vers le vendeur", emoji: "🏍️" },
  recupere: { label: "Colis récupéré", emoji: "📦" },
  en_cours: { label: "En cours de livraison", emoji: "🛵" },
  livre: { label: "Livré", emoji: "🎉" },
  annulee: { label: "Annulée", emoji: "✖️" },
};

export const DISPUTE_TYPES: Record<string, string> = {
  non_recu: "Produit non reçu",
  different: "Produit différent de l'annonce",
  endommage: "Produit endommagé",
  vendeur_muet: "Le vendeur ne répond plus",
  livreur: "Problème avec le livreur",
  autre: "Autre",
};

// Tarifs indicatifs de livraison moto (KMF)
export const DELIVERY_RATES = [
  { label: "Même quartier", min: 300, max: 500 },
  { label: "Quartiers voisins", min: 500, max: 1000 },
  { label: "Traversée de ville", min: 1000, max: 2000 },
  { label: "Autre ville (même île)", min: 2000, max: 4000 },
];

// Tarifs de mise en avant (après période gratuite)
export const FEATURE_PLANS = [
  { days: 3, price: 500, label: "3 jours — 500 KMF" },
  { days: 7, price: 1000, label: "7 jours — 1 000 KMF" },
  { days: 30, price: 2500, label: "30 jours — 2 500 KMF" },
];

export const PREMIUM_PRICE = 3000; // KMF / mois

// Plans de publicité sponsorisée (facturation décidée)
export const AD_PLANS = [
  { id: "spot", days: 7, price: 2000, label: "Coup de projecteur", emoji: "🔦", desc: "Ton annonce ou ton lien mis en avant pendant 7 jours" },
  { id: "vitrine", days: 15, price: 4000, label: "Vitrine", emoji: "🪟", desc: "15 jours de visibilité renforcée sur la page d'accueil" },
  { id: "campagne", days: 30, price: 7000, label: "Grande campagne", emoji: "🚀", desc: "Un mois complet en tête des publicités" },
] as const;

// Tags suggérés par catégorie
export const SUGGESTED_TAGS: Record<string, string[]> = {
  default: ["cadeau", "urgence", "soldes", "qualité", "original", "nouveau", "promo", "occasion"],
  "Vêtements et chaussures": ["mode", "neuf", "taille unique", "cadeau", "original", "traditionnel"],
  "Téléphones et accessoires": ["smartphone", "original", "neuf", "occasion", "garantie", "urgence"],
  "Alimentation et boissons": ["frais", "fait maison", "bio", "commande", "livraison rapide"],
  "Maison et décoration": ["déco", "fait main", "cadeau", "qualité", "nouveau"],
  "Véhicules et pièces détachées": ["occasion", "bon état", "urgent", "négociable", "fiable"],
};

export const FREE_PERIOD_DAYS = 60;

export function formatKMF(value: number | null | undefined): string {
  if (value == null) return "Prix à débattre";
  return `${value.toLocaleString("fr-FR")} KMF`;
}

export function slugifyText(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 80);
}
