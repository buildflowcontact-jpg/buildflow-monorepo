import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const steps = [
  {
    title: "Bienvenue sur BuildFlow !",
    description: "Gérez vos chantiers, documents et équipes en toute simplicité. Suivez ce guide pour découvrir les fonctionnalités clés.",
  },
  {
    title: "Navigation rapide",
    description: "Utilisez la barre en bas (ou en haut sur desktop) pour passer d’un module à l’autre : Exécuter, Planifier, Piloter, Équipe.",
  },
  {
    title: "Actions rapides",
    description: "Le bouton + en bas à droite permet d’ajouter rapidement un événement, une photo ou une tâche.",
  },
  {
    title: "Feedback instantané",
    description: "Chaque action affiche un toast de confirmation ou d’erreur en bas de l’écran.",
  },
  {
    title: "C’est parti !",
    description: "Vous êtes prêt à utiliser BuildFlow. Retrouvez ce guide dans le menu Profil à tout moment.",
  },
];

export function OnboardingTour({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={step}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -40 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
        aria-modal="true"
        role="dialog"
      >
        <div className="bg-white dark:bg-card rounded-xl shadow-lg p-8 max-w-md w-full border border-border flex flex-col items-center">
          <h2 className="text-xl font-bold mb-2 text-primary text-center">{steps[step].title}</h2>
          <p className="mb-6 text-muted-foreground text-center">{steps[step].description}</p>
          <div className="flex gap-2 mt-4">
            {step > 0 && (
              <button
                className="px-4 py-2 rounded bg-muted text-muted-foreground border border-border hover:bg-accent"
                onClick={() => setStep(s => s - 1)}
              >Précédent</button>
            )}
            {step < steps.length - 1 ? (
              <button
                className="px-4 py-2 rounded bg-primary text-primary-foreground font-bold hover:bg-primary/90"
                onClick={() => setStep(s => s + 1)}
              >Suivant</button>
            ) : (
              <button
                className="px-4 py-2 rounded bg-green-600 text-white font-bold hover:bg-green-700"
                onClick={onClose}
              >Terminer</button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
