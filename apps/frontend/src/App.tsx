
import React, { Suspense, useState, useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { ThemeProvider } from "./components/ui/theme-provider";
import { useToast } from "./ui/ToastProvider";
import { DocumentList } from "./modules/bureau-etudes/components/DocumentList";
import { useAuth, signOut } from "./modules/chantier/hooks/useAuth";
import { AuthForm } from "./components/ui/AuthForm";
import { useRealtimeProjectEvents } from "./utils/useRealtimeProjectEvents";
import { OnboardingTour } from "./components/ui/OnboardingTour";
import { Header } from "./components/layout/Header";
import { Sidebar } from "./components/layout/Sidebar";
import { MobileNav } from "./components/layout/MobileNav";
import { ProjectBanner } from "./components/layout/ProjectBanner";
import { useProjects } from "./hooks/useProjects";
import { useSyncUITheme } from "./hooks/useSyncUITheme";
import { useProjectStore } from "./store/projectStore";
import { useUIStore } from "./store/uiStore";
import { supabase } from "@/lib/supabase";
import { Spinner } from "./ui/Spinner";
import { t } from "./i18n";
import { CreateProjectPanel } from "./components/shared/CreateProjectPanel";

const QuickActionPro = React.lazy(() => import("./QuickActionPro"));
const EventList = React.lazy(() => import("./features/events/EventList").then((module) => ({ default: module.EventList })));
const PlanViewer = React.lazy(() => import("./features/planviewer/PlanViewer").then((module) => ({ default: module.PlanViewer })));
const Planifier = React.lazy(() => import("./features/planifier/Planifier").then((module) => ({ default: module.Planifier })));
const Piloter = React.lazy(() => import("./features/piloter/Piloter").then((module) => ({ default: module.Piloter })));
const Equipe = React.lazy(() => import("./modules/chantier/components/Equipe").then((module) => ({ default: module.Equipe })));
const ApprovisionDashboard = React.lazy(() => import("./modules/approvisionnement/components/ApprovisionDashboard").then((module) => ({ default: module.ApprovisionDashboard })));
const FinanceDashboard = React.lazy(() => import("./modules/finance/components/FinanceDashboard").then((module) => ({ default: module.FinanceDashboard })));
const RHSecurityDashboard = React.lazy(() => import("./modules/rh-securite/components/RHSecurityDashboard").then((module) => ({ default: module.RHSecurityDashboard })));
const SecurityAuditDashboard = React.lazy(() => import("./modules/rh-securite/components/SecurityAuditDashboard").then((module) => ({ default: module.SecurityAuditDashboard })));
const IntegrationTestRunner = React.lazy(() => import("./modules/testing/components/IntegrationTestRunner").then((module) => ({ default: module.IntegrationTestRunner })));
const CommercialDashboard = React.lazy(() => import("./modules/commercial/components/CommercialDashboard").then((module) => ({ default: module.CommercialDashboard })));
const KPIDashboard = React.lazy(() => import("./modules/kpi/components/KPIDashboard").then((module) => ({ default: module.KPIDashboard })));
const TimeTrackingDashboard = React.lazy(() => import("./modules/time-tracking/components/TimeTrackingDashboard").then((module) => ({ default: module.TimeTrackingDashboard })));
const AccountSettings = React.lazy(() => import("./modules/settings/components/AccountSettings").then((module) => ({ default: module.AccountSettings })));

function SectionLoader({ label = "Chargement du module..." }: { label?: string }) {
  return (
    <div className="surface-panel p-6 flex items-center gap-3">
      <Spinner size={24} />
      <span className="text-sm font-semibold text-slate-700">{label}</span>
    </div>
  );
}

function App() {
  const { user, loading } = useAuth();
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
  const location = useLocation();
  const { currentProjectId, setCurrentProjectId } = useProjectStore();
  const uiTheme = useUIStore((state) => state.uiTheme);
  const { data: projects = [], isLoading: isProjectsLoading } = useProjects();
  const resolvedProjectId = currentProjectId ?? projects[0]?.id ?? null;
  const selectedProject = projects.find((project) => project.id === resolvedProjectId) ?? projects[0] ?? null;

  // Gestion automatique du token Supabase dans l’URL (lien magique)
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('access_token')) {
      const params = new URLSearchParams(hash.replace('#', ''));
      const access_token = params.get('access_token');
      const refresh_token = params.get('refresh_token');
      if (access_token && refresh_token) {
        supabase.auth.setSession({ access_token, refresh_token });
        // Nettoie l’URL pour éviter de garder les tokens dans le hash
        window.location.hash = '';
      }
    }
  }, []);

  // Toast context (accessible dans ToastProvider)
  const { showToast } = useToast() || {};

  // Onboarding interactif — DOIT être avant tout return conditionnel (Rules of Hooks)
  const [showOnboarding, setShowOnboarding] = useState(() => {
    if (typeof window !== 'undefined') {
      return !window.localStorage.getItem('onboardingDone');
    }
    return false;
  });
  const handleCloseOnboarding = useCallback(() => {
    setShowOnboarding(false);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('onboardingDone', '1');
    }
  }, []);

  // Écoute temps réel des événements critiques
  const handleRealtimeEvent = useCallback((payload: any) => {
    if (!showToast) return;
    if (payload.eventType === 'INSERT') {
      if (payload.new.type === 'INCIDENT') showToast('Nouvel incident signalé', 'success');
      if (payload.new.type === 'VALIDATION') showToast('Nouvelle validation', 'success');
      if (payload.new.type === 'PLAN_CHANGE') showToast('Changement de plan', 'success');
    }
  }, [showToast]);

  useEffect(() => {
    if (!currentProjectId && projects.length > 0) {
      setCurrentProjectId(projects[0].id);
    }
  }, [currentProjectId, projects, setCurrentProjectId]);

  useEffect(() => {
    setActiveDocumentId(null);
  }, [resolvedProjectId]);

  useEffect(() => {
    const classes = ['ui-theme-industrial', 'ui-theme-cockpit', 'ui-theme-streamline'];
    document.body.classList.remove(...classes);
    document.body.classList.add(`ui-theme-${uiTheme}`);
  }, [uiTheme]);

  // useRealtimeProjectEvents doit être appelé inconditionnellement (Rules of Hooks)
  useRealtimeProjectEvents({ projectId: user ? resolvedProjectId : null, onEvent: handleRealtimeEvent });
  useSyncUITheme(user);

  if (loading) {
    return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div className="app-shell min-h-screen flex items-center justify-center">
          <div className="surface-panel p-8 flex items-center gap-3">
            <Spinner size={28} />
            <span className="text-sm font-semibold text-slate-700">Chargement de votre espace...</span>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  if (!user) return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="app-shell min-h-screen flex items-center justify-center px-4 py-10 relative overflow-hidden">
        <div className="absolute -top-24 -left-16 h-72 w-72 rounded-full bg-cyan-200/30 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-amber-200/30 blur-3xl pointer-events-none" />

        <div className="surface-panel max-w-xl w-full p-8 md:p-10 flex flex-col items-center">
          <img src="/logo.png" alt="BuildFlow" className="w-24 h-24 object-contain mb-5" />
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 text-center mb-2">{t('welcomeTitle')}</h1>
          <p className="mb-6 text-slate-600 text-center max-w-lg">{t('welcomeSubtitle')}</p>
          <AuthForm />
          <p className="mt-7 text-xs text-slate-500">© {new Date().getFullYear()} BuildFlow</p>
        </div>
      </div>
    </ThemeProvider>
  );

  const userRole = user?.email?.endsWith('@be.com') || user?.email?.endsWith('@admin.com')
    ? t('roleBe')
    : t('roleChantier');

  const projectOptions = projects.map((project) => ({
    id: project.id,
    name: project.name,
    code: project.code,
  }));

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="app-shell min-h-screen">
        {showOnboarding && <OnboardingTour onClose={handleCloseOnboarding} />}

        <Header
          userRole={userRole}
          email={user.email ?? ''}
          onSignOut={signOut}
          statusLabel={t('statusInProgress')}
          projectId={resolvedProjectId}
        />

        <div className="max-w-6xl mx-auto px-4 md:px-6 pt-4 md:pt-6 pb-28 md:pb-8">
          <ProjectBanner
            label="Projet"
            projectName={selectedProject?.name ?? (isProjectsLoading ? 'Chargement du projet...' : 'Aucun projet disponible')}
            projects={projectOptions}
            selectedProjectId={resolvedProjectId}
            onProjectChange={setCurrentProjectId}
          />

          <Sidebar />

          <main className="space-y-6">
            {isProjectsLoading ? (
              <SectionLoader label="Chargement des projets..." />
            ) : null}

            {!isProjectsLoading && !resolvedProjectId ? (
              <CreateProjectPanel onCreated={setCurrentProjectId} />
            ) : null}

            {!isProjectsLoading && resolvedProjectId ? (
            <AnimatePresence mode="wait" initial={false}>
              <Routes location={location} key={location.pathname}>
                <Route path="/" element={<Navigate to="/executer" replace />} />
                <Route path="/executer" element={(
                <motion.section
                  key="executer"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.22 }}
                  className="space-y-5"
                >
                  <div className="surface-panel p-5 md:p-6">
                    <h2 className="text-xl font-black tracking-tight text-slate-900 mb-1">Bienvenue sur le cockpit chantier</h2>
                    <p className="text-sm text-slate-600">Suivez vos documents, vos événements et vos actions rapides au même endroit.</p>
                  </div>

                  <div className="surface-panel p-5 md:p-6">
                    <h3 className="font-black text-slate-900 mb-3">Documents du projet</h3>
                    <DocumentList projectId={resolvedProjectId} onSelect={setActiveDocumentId} />
                  </div>

                  {activeDocumentId && (
                    <Suspense fallback={<SectionLoader label="Chargement du viewer..." />}>
                      <div className="surface-panel p-5 md:p-6">
                        <PlanViewer projectId={resolvedProjectId} documentId={activeDocumentId} />
                      </div>
                    </Suspense>
                  )}

                  <Suspense fallback={<SectionLoader label="Chargement des evenements..." />}>
                    <div className="surface-panel p-5 md:p-6">
                      <EventList projectId={resolvedProjectId} />
                    </div>
                  </Suspense>

                  <Suspense fallback={<SectionLoader label="Chargement des actions rapides..." />}>
                    <div className="surface-panel p-5 md:p-6">
                      <QuickActionPro projectId={resolvedProjectId} activeDocumentId={activeDocumentId || undefined} />
                    </div>
                  </Suspense>
                </motion.section>
                )} />

                <Route path="/planifier" element={(
                <motion.section
                  key="planifier"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.22 }}
                  className="surface-panel p-5 md:p-6"
                >
                  <Suspense fallback={<SectionLoader label="Chargement du planning..." />}>
                    <Planifier />
                  </Suspense>
                </motion.section>
                )} />

                <Route path="/piloter" element={(
                <motion.section
                  key="piloter"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.22 }}
                  className="surface-panel p-5 md:p-6"
                >
                  <Suspense fallback={<SectionLoader label="Chargement des indicateurs..." />}>
                    <Piloter projectName={selectedProject?.name ?? 'Projet actif'} />
                  </Suspense>
                </motion.section>
                )} />

                <Route path="/equipe" element={(
                <motion.section
                  key="equipe"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.22 }}
                  className="surface-panel p-5 md:p-6"
                >
                  <Suspense fallback={<SectionLoader label="Chargement de l'equipe..." />}>
                    <Equipe projectId={resolvedProjectId} projectName={selectedProject?.name ?? 'Projet actif'} />
                  </Suspense>
                </motion.section>
                )} />

                <Route path="/approvisionner" element={(
                <motion.section
                  key="approvisionner"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.22 }}
                >
                  <Suspense fallback={<SectionLoader label="Chargement approvisionnement..." />}>
                    <ApprovisionDashboard projectId={resolvedProjectId} />
                  </Suspense>
                </motion.section>
                )} />

                <Route path="/finance" element={(
                <motion.section
                  key="finance"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.22 }}
                >
                  <Suspense fallback={<SectionLoader label="Chargement finance..." />}>
                    <FinanceDashboard projectId={resolvedProjectId} />
                  </Suspense>
                </motion.section>
                )} />

                <Route path="/rh-securite" element={(
                <motion.section
                  key="rh-securite"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.22 }}
                >
                  <Suspense fallback={<SectionLoader label="Chargement RH Sécurité..." />}>
                    <RHSecurityDashboard projectId={resolvedProjectId} />
                  </Suspense>
                </motion.section>
                )} />

                <Route path="/rh-securite/audit" element={(
                <motion.section
                  key="rh-securite-audit"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.22 }}
                >
                  <Suspense fallback={<SectionLoader label="Chargement Audit Sécurité..." />}>
                    <SecurityAuditDashboard projectId={resolvedProjectId} />
                  </Suspense>
                </motion.section>
                )} />

                <Route path="/commercial" element={(
                <motion.section
                  key="commercial"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.22 }}
                >
                  <Suspense fallback={<SectionLoader label="Chargement Commercial..." />}>
                    <CommercialDashboard projectId={resolvedProjectId} />
                  </Suspense>
                </motion.section>
                )} />

                <Route path="/kpi" element={(
                <motion.section
                  key="kpi"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.22 }}
                >
                  <Suspense fallback={<SectionLoader label="Chargement KPI..." />}>
                    <KPIDashboard projectId={resolvedProjectId} />
                  </Suspense>
                </motion.section>
                )} />

                <Route path="/time-tracking" element={(
                <motion.section
                  key="time-tracking"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.22 }}
                >
                  <Suspense fallback={<SectionLoader label="Chargement suivi du temps..." />}>
                    <TimeTrackingDashboard projectId={resolvedProjectId} />
                  </Suspense>
                </motion.section>
                )} />

                <Route path="/tests/integration" element={(
                <motion.section
                  key="integration-tests"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.22 }}
                >
                  <Suspense fallback={<SectionLoader label="Chargement des tests..." />}>
                    <IntegrationTestRunner />
                  </Suspense>
                </motion.section>
                )} />

                <Route path="/parametres" element={(
                <motion.section
                  key="parametres"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.22 }}
                >
                  <Suspense fallback={<SectionLoader label="Chargement des parametres..." />}>
                    <AccountSettings />
                  </Suspense>
                </motion.section>
                )} />

                <Route path="*" element={<Navigate to="/executer" replace />} />
              </Routes>
            </AnimatePresence>
            ) : null}
          </main>
        </div>

        <MobileNav />
      </div>
    </ThemeProvider>
  );
}

export default App;
