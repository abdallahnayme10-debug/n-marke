import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <p className="text-7xl">🧭</p>
      <h1 className="mt-4 text-3xl font-extrabold text-ocean-900 dark:text-white">Oups, page introuvable</h1>
      <p className="mt-2 text-neutral-500">Cette page n'existe pas ou l'annonce a été retirée.</p>
      <Link href="/" className="btn-primary mt-6">Retour à l'accueil</Link>
    </div>
  );
}
