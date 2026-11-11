import { Suspense } from "react";
import SearchClient from "@/components/SearchClient";

export const dynamic = "force-dynamic";

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-6xl px-4 py-10 text-center">Chargement de la recherche…</div>}>
      <SearchClient />
    </Suspense>
  );
}
