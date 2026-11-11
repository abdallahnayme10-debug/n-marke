// Sérialisation légère des annonces pour l'affichage (partagée client/serveur).

type RawListing = {
  id: string;
  slug: string;
  title: string;
  price: number | null;
  type: string;
  island: string;
  region: string;
  deliveryAvailable: boolean;
  views: number;
  createdAt: string | Date;
  photos?: string | string[];
  seller?: { name: string; sellerTier: string } | null;
};

export function toCardData(l: RawListing) {
  const photos = Array.isArray(l.photos) ? l.photos : l.photos ? JSON.parse(l.photos) : [];
  return {
    id: l.id,
    slug: l.slug,
    title: l.title,
    price: l.price,
    type: l.type,
    island: l.island,
    region: l.region,
    deliveryAvailable: l.deliveryAvailable,
    views: l.views,
    createdAt: l.createdAt,
    photos,
    seller: l.seller ?? null,
  };
}
