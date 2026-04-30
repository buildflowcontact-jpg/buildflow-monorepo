
import React, { useState, useCallback } from "react";
import { ThemeProvider } from "./components/ui/theme-provider";
import { ToastProvider, useToast } from "./ui/ToastProvider";
import QuickActionPro from "./QuickActionPro";
import { EventList } from "./features/events/EventList";
import { PlanViewer } from "./features/planviewer/PlanViewer";
import { DocumentList } from "./modules/bureau-etudes/components/DocumentList";
import { useAuth, signOut } from "./modules/chantier/hooks/useAuth";
import { AuthForm } from "./components/ui/AuthForm";


import { Planifier } from "./features/planifier/Planifier";
import { Piloter } from "./features/piloter/Piloter";
import { Equipe } from "./modules/chantier/components/Equipe";
import { useRealtimeProjectEvents } from "./utils/useRealtimeProjectEvents";

function App() {
    console.log('[LOG] App loaded. window.location:', window.location.href);
  const { user, loading } = useAuth();
  const projectId = "demo-project-uuid";
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'executer' | 'planifier' | 'piloter' | 'equipe'>('executer');

  // Toast context (accessible dans ToastProvider)
  const { showToast } = useToast() || {};

  // Écoute temps réel des événements critiques
  const handleRealtimeEvent = useCallback((payload) => {
    if (!showToast) return;
    if (payload.eventType === 'INSERT') {
      if (payload.new.type === 'INCIDENT') showToast('Nouvel incident signalé', 'success');
      if (payload.new.type === 'VALIDATION') showToast('Nouvelle validation', 'success');
      if (payload.new.type === 'PLAN_CHANGE') showToast('Changement de plan', 'success');
    }
  }, [showToast]);
  if (user) {
    useRealtimeProjectEvents({ projectId, onEvent: handleRealtimeEvent });
  }

  if (loading) return <div className="p-8">Chargement...</div>;
  if (!user) return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 to-blue-300">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full flex flex-col items-center">
          <img src="/logo.svg" alt="BuildFlow" className="w-24 mb-4" />
          <h1 className="text-2xl font-bold text-blue-700 mb-2">Bienvenue sur BuildFlow</h1>
          <p className="mb-6 text-gray-600 text-center">Connectez-vous pour accéder à votre espace chantier, plans, documents et notifications en temps réel.</p>
          <AuthForm />
          <p className="mt-6 text-xs text-gray-400">© {new Date().getFullYear()} BuildFlow</p>
        </div>
      </div>
    </ThemeProvider>
  );

  const isBE = user?.email?.endsWith('@be.com') || user?.email?.endsWith('@admin.com');

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-screen bg-gray-50">
      <header className="p-4 bg-blue-700 text-white font-bold text-xl flex justify-between items-center">
        <span>BuildFlow</span>
        <button onClick={signOut} className="bg-white text-blue-700 px-3 py-1 rounded font-bold">Déconnexion</button>
      </header>
      {/* Fil d'Ariane et résumé projet */}
      <div className="bg-blue-100 text-blue-900 px-4 py-2 text-sm flex flex-col md:flex-row md:items-center md:gap-4 border-b border-blue-200">
        <nav aria-label="Fil d'Ariane" className="flex items-center gap-2 mb-1 md:mb-0">
          <span className="font-bold">Projet démo</span>
          <span aria-hidden="true">/</span>
          <span className={activeTab === 'executer' ? 'font-bold underline' : ''}>Exécuter</span>
          <span aria-hidden="true">/</span>
          <span className={activeTab === 'planifier' ? 'font-bold underline' : ''}>Planifier</span>
          <span aria-hidden="true">/</span>
          <span className={activeTab === 'piloter' ? 'font-bold underline' : ''}>Piloter</span>
          <span aria-hidden="true">/</span>
          <span className={activeTab === 'equipe' ? 'font-bold underline' : ''}>Équipe</span>
        </nav>
        <div className="text-xs text-blue-700 md:ml-auto">
          <span className="font-semibold">Statut&nbsp;:</span> En cours &nbsp;|&nbsp; <span className="font-semibold">Utilisateur&nbsp;:</span> {user.email}
        </div>
      </div>
      {/* Barre de navigation mobile-friendly en bas de l'écran */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-around bg-blue-700 text-white font-semibold py-2 shadow md:static md:bg-blue-100 md:text-blue-700 md:justify-start md:gap-4 md:py-4">
        <button
          onClick={() => setActiveTab('executer')}
          className={`flex-1 py-2 md:py-0 md:flex-none rounded ${activeTab === 'executer' ? 'bg-blue-900 md:bg-transparent underline' : ''}`}
          style={{ fontSize: 18 }}
        >
          Exécuter
        </button>
        <button
          onClick={() => setActiveTab('planifier')}
          className={`flex-1 py-2 md:py-0 md:flex-none rounded ${activeTab === 'planifier' ? 'bg-blue-900 md:bg-transparent underline' : ''}`}
          style={{ fontSize: 18 }}
        >
          Planifier
        </button>
        <button
          onClick={() => setActiveTab('piloter')}
          className={`flex-1 py-2 md:py-0 md:flex-none rounded ${activeTab === 'piloter' ? 'bg-blue-900 md:bg-transparent underline' : ''}`}
          style={{ fontSize: 18 }}
        >
          Piloter
        </button>
        <button
          onClick={() => setActiveTab('equipe')}
          className={`flex-1 py-2 md:py-0 md:flex-none rounded ${activeTab === 'equipe' ? 'bg-blue-900 md:bg-transparent underline' : ''}`}
          style={{ fontSize: 18 }}
        >
          Équipe
        </button>
      </nav>
      <main className="p-4 pb-20 md:pb-8 space-y-8 max-w-2xl mx-auto">
        {activeTab === 'executer' && (
          <>
            <h2 className="text-lg font-semibold mb-4">Bienvenue sur le cockpit chantier</h2>
            <div className="mb-4">
              <h3 className="font-bold mb-2">Documents du projet</h3>
              <DocumentList projectId={projectId} onSelect={setActiveDocumentId} />
            </div>
            {activeDocumentId && (
              <>
                <PlanViewer projectId={projectId} documentId={activeDocumentId} />
                <div className="mt-4">
                  {/* DocumentVersionList supprimé : composant non migré */}
                </div>
              </>
            )}
            <EventList projectId={projectId} />
            {/* BEInbox supprimé : composant non migré */}
            <QuickActionPro projectId={projectId} activeDocumentId={activeDocumentId || undefined} />
          </>
        )}
        {activeTab === 'planifier' && <Planifier />}
        {activeTab === 'piloter' && <Piloter />}
        {activeTab === 'equipe' && <Equipe />}
      </main>
      </div>
    </ThemeProvider>
  );
}

export default App;
