"use client";

import { useEffect, useState } from "react";

const STEPS = [
  {
    emoji: "🌴",
    title: "Bienvenue sur N-marke !",
    text: "Le marché en ligne des Comores. Ici, tout le monde peut acheter et vendre, en toute simplicité.",
  },
  {
    emoji: "🛒",
    title: "Achète facilement",
    text: "Cherche ce que tu veux, contacte le vendeur, et reçois-le chez toi par moto.",
  },
  {
    emoji: "📸",
    title: "Vends en 2 minutes",
    text: "Prends des photos, mets un prix, et publie ton annonce. C'est tout !",
  },
  {
    emoji: "🏍️",
    title: "Deviens livreur",
    text: "Tu as une moto ? Inscris-toi comme livreur et gagne de l'argent.",
  },
];

export default function Onboarding() {
  const [step, setStep] = useState(-1);

  useEffect(() => {
    if (!localStorage.getItem("nmarke-onboarded")) {
      setStep(0);
    }
  }, []);

  function finish() {
    localStorage.setItem("nmarke-onboarded", "1");
    setStep(-1);
  }

  if (step < 0) return null;

  const current = STEPS[step];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ocean-900/60 p-4 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-md animate-slide-up rounded-4xl bg-white p-8 text-center shadow-soft-lg dark:bg-night-800">
        <div className="mb-4 text-6xl animate-float">{current.emoji}</div>
        <h2 className="mb-3 text-2xl font-extrabold text-ocean-900 dark:text-white">{current.title}</h2>
        <p className="mb-8 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">{current.text}</p>

        {/* Points de progression */}
        <div className="mb-8 flex justify-center gap-2">
          {STEPS.map((_, i) => (
            <span key={i} className={`h-2.5 rounded-full transition-all ${i === step ? "w-8 bg-ocean-400" : "w-2.5 bg-cream-200 dark:bg-night-700"}`} />
          ))}
        </div>

        <div className="flex gap-3">
          <button onClick={finish} className="btn-ghost flex-1">Passer</button>
          <button
            onClick={() => (step === STEPS.length - 1 ? finish() : setStep(step + 1))}
            className="btn-primary flex-1"
          >
            {step === STEPS.length - 1 ? "Commencer 🚀" : "Suivant"}
          </button>
        </div>
      </div>
    </div>
  );
}
