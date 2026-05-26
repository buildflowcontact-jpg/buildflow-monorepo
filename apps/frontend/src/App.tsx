
import React, { Suspense, useState, useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Bell, ChevronDown, ChevronRight, Plus, Search } from 'lucide-react';
import { ThemeProvider } from "./components/ui/theme-provider";
import { useToast } from "./ui/ToastProvider";
import { useAuth, signOut } from "./modules/chantier/hooks/useAuth";
import { useRealtimeProjectEvents } from "./utils/useRealtimeProjectEvents";
import { initSyncBridge } from "@/services/sync/syncBridge";
import { Sidebar } from "./components/layout/Sidebar";
import { MobileNav } from "./components/layout/MobileNav";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import { useProjects } from "./hooks/useProjects";
import { useSyncUITheme } from "./hooks/useSyncUITheme";
import { useProjectStore } from "./store/projectStore";
import { useUIStore } from "./store/uiStore";
import { supabase } from "@/lib/supabase";
import { Spinner } from "./ui/Spinner";
import { t } from "./i18n";
import { ProjectProvider } from "./app/providers/ProjectProvider";
import { PermissionProvider } from "./app/providers/PermissionProvider";
import { AppContextProvider } from "./app/providers/AppContext";

const AuthForm = React.lazy(() => import("./components/ui/AuthForm").then((module) => ({ default: module.AuthForm })));
const GlobalDashboard = React.lazy(() => import("./features/dashboard/GlobalDashboard").then((module) => ({ default: module.GlobalDashboard })));
const OnboardingTour = React.lazy(() => import("./components/ui/OnboardingTour").then((module) => ({ default: module.OnboardingTour })));
const ConflictModal = React.lazy(() => import("./components/ui/ConflictModal").then((module) => ({ default: module.ConflictModal })));
const ExecutePage = React.lazy(() => import("./features/executer/ExecutePage").then((module) => ({ default: module.ExecutePage })));
const Planifier = React.lazy(() => import("./features/planifier/Planifier").then((module) => ({ default: module.Planifier })));
const Piloter = React.lazy(() => import("./features/piloter/Piloter").then((module) => ({ default: module.Piloter })));
const Taches = React.lazy(() => import("./features/taches/Taches").then((module) => ({ default: module.Taches })));
const Equipe = React.lazy(() => import("./modules/chantier/components/Equipe").then((module) => ({ default: module.Equipe })));
const ApprovisionDashboard = React.lazy(() => import("./modules/approvisionnement/components/ApprovisionDashboard").then((module) => ({ default: module.ApprovisionDashboard })));
const FinanceDashboard = React.lazy(() => import("./modules/finance/components/FinanceDashboard").then((module) => ({ default: module.FinanceDashboard })));
const IncidentsPage = React.lazy(() => import("./modules/incidents/pages/IncidentsPage").then((module) => ({ default: module.IncidentsPage })));
const RHSecurityDashboard = React.lazy(() => import("./modules/rh-securite/components/RHSecurityDashboard").then((module) => ({ default: module.RHSecurityDashboard })));
const SecurityAuditDashboard = React.lazy(() => import("./modules/rh-securite/components/SecurityAuditDashboard").then((module) => ({ default: module.SecurityAuditDashboard })));

const CommercialDashboard = React.lazy(() => import("./modules/commercial/components/CommercialDashboard").then((module) => ({ default: module.CommercialDashboard })));
const KPIDashboard = React.lazy(() => import("./modules/kpi/components/KPIDashboard").then((module) => ({ default: module.KPIDashboard })));
const TimeTrackingDashboard = React.lazy(() => import("./modules/time-tracking/components/TimeTrackingDashboard").then((module) => ({ default: module.TimeTrackingDashboard })));
const AccountSettings = React.lazy(() => import("./modules/settings/components/AccountSettings").then((module) => ({ default: module.AccountSettings })));
const AuditTrailPage = React.lazy(() => import("./modules/audit/pages/AuditTrailPage").then((module) => ({ default: module.AuditTrailPage })));
const CreateProjectPanel = React.lazy(() => import("./components/shared/CreateProjectPanel").then((module) => ({ default: module.CreateProjectPanel })));
const ScheduleModule = React.lazy(() => import("./modules/schedule/ScheduleModule").then((module) => ({ default: module.ScheduleModule })));

function SectionLoader({ label = "Chargement du module..." }: { label?: string }) {
  return (
    <div className="surface-panel p-6 flex items-center gap-3">
      <Spinner size={24} />
      <span className="text-sm font-semibold text-slate-700">{label}</span>
    </div>
  );
}

const PAGE_LABELS: Record<string, string> = {
  '/dashboard': 'Tableau de bord',
  '/taches': 'Taches',
  '/planifier': 'Planning',
  '/documents': 'Documents',
  '/executer': 'Documents',
  '/equipe': 'Equipe',
  '/approvisionner': 'Approvisionnements',
  '/incidents': 'Incidents',
  '/parametres': 'Parametres',
};

function App() {
  const { user, loading } = useAuth();
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
  const location = useLocation();
  const { currentProjectId, setCurrentProjectId } = useProjectStore();
  const uiTheme = useUIStore((state) => state.uiTheme);
  const { data: projects = [], isLoading: isProjectsLoading } = useProjects();
  const resolvedProjectId = currentProjectId ?? projects[0]?.id ?? null;
  const selectedProject = projects.find((project) => project.id === resolvedProjectId) ?? projects[0] ?? null;
  const userId = user?.id;

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

  // Initialisation du SyncBridge : offline sync + Supabase Realtime (une seule fois)
  useEffect(() => {
    const cleanup = initSyncBridge();
    return cleanup;
  }, []);

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
          <Suspense fallback={<SectionLoader label="Chargement de l'authentification..." />}>
            <AuthForm />
          </Suspense>
          <p className="mt-7 text-xs text-slate-500">© {new Date().getFullYear()} BuildFlow</p>
        </div>
      </div>
    </ThemeProvider>
  );

  const userRole = user?.email?.endsWith('@be.com') || user?.email?.endsWith('@admin.com')
    ? t('roleBe')
    : t('roleChantier');
  const userMetadata = (user?.user_metadata ?? {}) as Record<string, unknown>;
  const sidebarUserName = [userMetadata.first_name, userMetadata.last_name]
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .join(' ')
    || user?.email?.split('@')[0]
    || 'Compte utilisateur';
  const sidebarUserProfile = typeof userMetadata.profile_title === 'string' && userMetadata.profile_title.trim().length > 0
    ? userMetadata.profile_title
    : userRole;

  const projectOptions = projects.map((project) => ({
    id: project.id,
    name: project.name,
    code: project.code,
  }));
  const pageLabel = PAGE_LABELS[location.pathname] ?? 'Workspace';
  const topbarProjectName = selectedProject?.name ?? 'Projet';

  return (
    <ProjectProvider>
      <PermissionProvider userId={userId}>
        <AppContextProvider user={user}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="app-shell min-h-screen">
        {showOnboarding ? (
          <Suspense fallback={null}>
            <OnboardingTour onClose={handleCloseOnboarding} />
          </Suspense>
        ) : null}
        <Suspense fallback={null}>
          <ConflictModal />
        </Suspense>

        <div className="w-full min-h-screen px-4 pt-4 pb-32 md:px-0 md:pt-0 md:pb-0">
          <div className="flex flex-col gap-6 md:gap-0 md:flex-row md:items-stretch md:h-screen">
          <Sidebar
            projects={projectOptions}
            selectedProjectId={resolvedProjectId}
            onProjectChange={setCurrentProjectId}
            onSignOut={signOut}
            currentUser={{
              name: sidebarUserName,
              email: user?.email ?? undefined,
              profile: sidebarUserProfile,
            }}
          />

          <main className="min-w-0 flex-1 space-y-4 md:h-full md:overflow-y-auto md:px-6 md:py-5">
            <div className="hidden md:flex items-center justify-between gap-4 border-b border-slate-200/90 bg-white/95 px-1 pb-4 pt-1">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                  <span className="hover:text-slate-600">Projets</span>
                  <ChevronRight size={14} />
                  <span className="truncate text-slate-500">{topbarProjectName}</span>
                  <ChevronRight size={14} />
                  <span className="text-slate-700">{pageLabel}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="group flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/90 px-3 py-2 text-sm text-slate-500 focus-within:border-blue-300 focus-within:bg-white">
                  <Search size={15} className="text-slate-400" />
                  <input
                    type="text"
                    placeholder="Rechercher (projets, taches, documents...)"
                    className="w-72 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                  />
                </label>

                <button type="button" className="relative rounded-xl border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-50">
                  <Bell size={17} />
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">3</span>
                </button>

                <button type="button" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_24px_-18px_rgba(37,99,235,0.85)] hover:bg-blue-700">
                  <Plus size={16} />
                  Creer
                  <ChevronDown size={14} />
                </button>

                <button type="button" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-left hover:bg-slate-50">
                  <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-slate-200 text-xs font-black text-slate-700">
                    {sidebarUserName.slice(0, 2).toUpperCase()}
                  </span>
                  <ChevronDown size={14} className="text-slate-500" />
                </button>
              </div>
            </div>

            {isProjectsLoading ? (
              <SectionLoader label="Chargement des projets..." />
            ) : null}

            {!isProjectsLoading && !resolvedProjectId ? (
              <Suspense fallback={<SectionLoader label="Chargement de la création de projet..." />}>
                <CreateProjectPanel onCreated={setCurrentProjectId} />
              </Suspense>
            ) : null}

            {!isProjectsLoading && resolvedProjectId ? (
            <AnimatePresence mode="wait" initial={false}>
              <Routes location={location} key={location.pathname}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={(
                <ProtectedRoute permission="module:dashboard">
                <motion.section
                  key="dashboard"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.22 }}
                  className="space-y-5"
                >
                  <Suspense fallback={<SectionLoader label="Chargement du tableau de bord..." />}>
                    <GlobalDashboard />
                  </Suspense>
                </motion.section>
                </ProtectedRoute>
                )} />
                <Route path="/executer" element={(
                <ProtectedRoute permission="module:executer">
                <motion.section
                  key="executer"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.22 }}
                  className="surface-panel p-5 md:p-6"
                >
                  <Suspense fallback={<SectionLoader label="Chargement exécution terrain..." />}>
                    <ExecutePage projectId={resolvedProjectId} activeDocumentId={activeDocumentId} onSelectDocument={setActiveDocumentId} />
                  </Suspense>
                </motion.section>
                </ProtectedRoute>
                )} />

                <Route path="/documents" element={<Navigate to="/executer" replace />} />

                <Route path="/planifier" element={(
                  <ProtectedRoute permission="module:planifier">
                <motion.section
                  key="planifier"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.22 }}
                  className="surface-panel p-5 md:p-6"
                >
                  <Suspense fallback={<SectionLoader label="Chargement du planning..." />}>
                          <Planifier projectId={resolvedProjectId} />
                  </Suspense>
                </motion.section>
                </ProtectedRoute>
                )} />

                <Route path="/schedule" element={(
                <ProtectedRoute permission="module:planifier">
                <motion.section
                  key="schedule"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.22 }}
                >
                  <Suspense fallback={<SectionLoader label="Chargement du planning des equipes..." />}>
                    <ScheduleModule
                      projectId={resolvedProjectId}
                      currentUserId={userId}
                    />
                  </Suspense>
                </motion.section>
                </ProtectedRoute>
                )} />


                <Route path="/taches" element={(
                <ProtectedRoute permission="module:piloter">
                <motion.section
                  key="taches"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.22 }}
                  className="surface-panel p-5 md:p-6"
                >
                  <Suspense fallback={<SectionLoader label="Chargement des tâches..." />}>
                    <Taches />
                  </Suspense>
                </motion.section>
                </ProtectedRoute>
                )} />

                <Route path="/piloter" element={(
                <ProtectedRoute permission="module:piloter">
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
                </ProtectedRoute>
                )} />

                <Route path="/equipe" element={(
                <ProtectedRoute permission="module:equipe">
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
                </ProtectedRoute>
                )} />

                <Route path="/approvisionner" element={(
                <ProtectedRoute permission="module:approvisionner">
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
                </ProtectedRoute>
                )} />

                <Route path="/finance" element={(
                <ProtectedRoute permission="module:finance">
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
                </ProtectedRoute>
                )} />

                <Route path="/incidents" element={(
                <ProtectedRoute permission="module:terrain">
                <motion.section
                  key="incidents"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.22 }}
                  className="surface-panel p-5 md:p-6"
                >
                  <Suspense fallback={<SectionLoader label="Chargement incidents terrain..." />}>
                    <IncidentsPage projectId={resolvedProjectId} />
                  </Suspense>
                </motion.section>
                </ProtectedRoute>
                )} />

                <Route path="/rh-securite" element={(
                <ProtectedRoute permission="module:rh">
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
                </ProtectedRoute>
                )} />

                <Route path="/rh-securite/audit" element={(
                <ProtectedRoute permission="audit:read">
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
                </ProtectedRoute>
                )} />

                <Route path="/commercial" element={(
                <ProtectedRoute permission="module:commercial">
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
                </ProtectedRoute>
                )} />

                <Route path="/kpi" element={(
                <ProtectedRoute permission="module:kpi">
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
                </ProtectedRoute>
                )} />

                <Route path="/time-tracking" element={(
                <ProtectedRoute permission="module:time">
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
                </ProtectedRoute>
                )} />

                <Route path="/parametres" element={(
                <ProtectedRoute permission="module:parametres">
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
                </ProtectedRoute>
                )} />

                <Route path="/terrain" element={<Navigate to="/incidents" replace />} />

                <Route path="/retour-chantier" element={<Navigate to="/incidents" replace />} />

                <Route path="/audit" element={(
                <ProtectedRoute permission="module:audit">
                <motion.section
                  key="audit"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.22 }}
                >
                  <Suspense fallback={<SectionLoader label="Chargement audit trail..." />}>
                    <AuditTrailPage projectId={resolvedProjectId} />
                  </Suspense>
                </motion.section>
                </ProtectedRoute>
                )} />

                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </AnimatePresence>
            ) : null}
          </main>
          </div>
        </div>

        <MobileNav />
      </div>
    </ThemeProvider>
        </AppContextProvider>
      </PermissionProvider>
    </ProjectProvider>
  );
}

export default App;
