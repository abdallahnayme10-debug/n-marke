import slugify from "slugify";

export function toSlug(input: string): string {
  return slugify(input, {
    lower: true,
    strict: true,
    locale: "fr",
    trim: true,
  });
}

export function timeAgo(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return "à l'instant";
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  if (diff < 86400 * 30) return `il y a ${Math.floor(diff / 86400)} j`;
  return d.toLocaleDateString("fr-FR");
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export function pluralize(n: number, singular: string, plural?: string): string {
  return `${n} ${n > 1 ? plural || singular + "s" : singular}`;
}
