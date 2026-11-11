// Limiteur de débit en mémoire (défense en profondeur contre la force brute).
// Adapté à un hébergement mono-instance. Pour du multi-instance (Vercel),
// remplacer par un stockage partagé (Redis / Upstash).

const hits = new Map<string, number[]>();

function clientKey(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "local"
  );
}

/** Retourne true si la requête est autorisée, false si limitée. */
export function rateLimit(req: Request, scope: string, limit = 10, windowMs = 60_000): boolean {
  const key = `${scope}:${clientKey(req)}`;
  const now = Date.now();
  const arr = (hits.get(key) || []).filter((t) => now - t < windowMs);
  if (arr.length >= limit) {
    hits.set(key, arr);
    return false;
  }
  arr.push(now);
  hits.set(key, arr);
  return true;
}

// Nettoyage périodique (évite que la Map grossisse indéfiniment)
setInterval(() => {
  const now = Date.now();
  for (const [k, arr] of hits) {
    const filtered = arr.filter((t) => now - t < 5 * 60_000);
    if (filtered.length === 0) hits.delete(k);
    else hits.set(k, filtered);
  }
}, 5 * 60_000).unref?.();
