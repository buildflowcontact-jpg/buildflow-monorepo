# BuildFlow - Frontend Documentation

## 📋 Vue d'ensemble

BuildFlow est une application web complète de gestion de chantier construction conçue avec **React 18 + TypeScript + Vite 7.x** et **Supabase** pour la gestion de données en temps réel.

## 🚀 Fonctionnalités Principales

### 1. **Routes Principales** (4 modules core)

#### `/executer` - Tableau de Suivi des Tâches
- Visualisation des tâches du projet avec statuts
- Filtre par statut et assignataire
- Quick actions en ligne (start/complete/edit)
- Intégration offline avec Service Worker
- Navigation: Vue principale pour le terrain

#### `/planifier` - Planification Projet
- Calendrier interactif avec événements du projet
- Visualisation Gantt (2D timeline)
- Création/édition d'événements
- Lien avec les tâches

#### `/piloter` - Pilotage BPE (Budget Prévisionnel Engagé)
- Tableau de suivi BPE
- Affichage des indicateurs clés (budget, délai, qualité)
- Workflows de validation multi-étapes
- Suivi des versioning de documents

#### `/equipe` - Gestion Équipe
- Liste des collaborateurs du projet
- Attribution de rôles et permissions
- Affichage des compétences
- Filtrage par rôle/statut

### 2. **Modules Métier** (5 modules spécialisés)

#### `/approvisionner` - Gestion Approvisionnement
- Liste des fournisseurs
- Gestion des commandes (PO)
- Suivi des livraisons
- Historique des articles fournis

#### `/finance` - Gestion Financière
- **BudgetPlanner**: Catégories (Matériaux, Main d'œuvre, Équipement, Sous-traitance, Transport, Divers)
- **InvoiceManager**: Workflow factures (pending → paid/cancelled)
- **ExpenseTracker**: Suivi des dépenses par catégorie
- **FinanceDashboard**: Vue synthétique financière

#### `/rh-securite` - Gestion RH & Sécurité
- **WorkerList**: CRUD collaborateurs
- **RoleManagement**: Gestion des rôles et permissions
- **SecurityAuditLog**: Visualisation des logs de sécurité
- **RHSecurityDashboard**: Synthèse RH & sécurité

#### `/rh-securite/audit` - Dashboard Audit Avancé
- Filtrage par action/date range
- Statistiques 30 jours (création/modification/suppression)
- Analyse des patterns d'accès
- Table interactive avec pagination

#### `/commercial` - CRM & Pipeline Ventes
- **ClientList**: Gestion des clients (statuts: prospect, contacted, qualified, customer, inactive)
- **SalesLeadPipeline**: Pipeline visuel (new → contacted → qualified → proposal → won/lost)
- **CommercialDashboard**: KPIs ventes et conversion rates

### 3. **Modules Avancés** (2 modules)

#### `/kpi` - Dashboard KPI Executives
- Métriques clés: taux d'achèvement projet, score qualité, budget rate, tâches completion
- Statuts d'alerte: Qualité/Budget/Tâches/Approvisionnement
- Vue d'exécution executive
- Indicateurs de performance globale

#### `/time-tracking` - Suivi du Temps
- Enregistrement des heures travaillées
- Filtre par mois/collaborateur/tâche
- Statistiques heures/jour
- CRUD entries temps avec historique

### 4. **Fonctionnalités Transversales**

#### 🔔 Notifications Real-time
- **NotificationBell**: Badge dans le Header
- **NotificationCenter**: Modal avec gestion notifications
- Subscriptions Supabase en temps réel
- Types: success, warning, error, info
- CRUD notifications avec archivage

#### 🔍 Recherche Globale
- **SearchGlobal**: Barre de recherche dans Header
- Recherche multi-modules (tâches, collaborateurs, clients, etc.)
- Résultats avec navigation directe

#### 📑 Gestion Multi-Projet
- **ProjectBanner**: Sélection de projet
- Zustand store: `useProjectStore()`
- Context propagé dans tous les modules

#### 📥 Exports
- **PDF Export**: Via html2pdf
- **Excel Export**: Via xlsx library
- Disponible dans Finance et autres modules

#### 🔐 Authentification & Autorisations
- Auth Supabase avec JWT
- Rôles utilisateur (admin, project_manager, worker, supervisor)
- Permissions granulaires par action
- Session management dans App.tsx

#### 📴 Mode Offline
- Service Worker enregistré
- Cache-first strategy pour assets
- IndexedDB pour données offline
- Sync on reconnect

## 📊 Architecture Technique

### Dépendances Clés

```json
{
  "react": "^18.3.1",
  "typescript": "^5.3.3",
  "vite": "^7.0.0",
  "@tanstack/react-query": "^5.28.0",
  "@supabase/supabase-js": "^2.105.1",
  "framer-motion": "^10.16.16",
  "zustand": "^5.0.0",
  "react-router-dom": "^6.30.3"
}
```

### Structure des Fichiers

```
src/
├── modules/
│   ├── executer/          # Tâches
│   ├── planifier/         # Calendrier & Gantt
│   ├── piloter/           # BPE & suivi
│   ├── equipe/            # Collaborateurs
│   ├── approvisionner/    # Fournisseurs & PO
│   ├── finance/           # Budgets, factures, dépenses
│   ├── rh-securite/       # RH & audit sécurité
│   ├── commercial/        # CRM & ventes
│   ├── kpi/               # Dashboard KPIs
│   ├── time-tracking/     # Suivi du temps
│   ├── notifications/     # Real-time notifications
│   └── testing/           # Integration tests
├── components/
│   ├── layout/            # Header, Sidebar, MobileNav
│   └── shared/            # SearchGlobal, etc.
├── lib/
│   ├── supabase.ts        # Supabase client
│   └── serviceWorker.ts
├── store/
│   └── projectStore.ts    # Zustand project state
├── types/
│   └── database.types.ts  # Supabase auto-generated types (24 tables)
└── App.tsx               # Main router
```

### Patterns de Code

#### Hook Pattern (React Query)

```typescript
// Query (read)
export function useEntity(projectId: string) {
  return useQuery({
    queryKey: ['entity', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('entities')
        .select('*')
        .eq('project_id', projectId);
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });
}

// Mutation (write)
export function useCreateEntity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateEntityInput) => {
      const { data: result, error } = await supabase
        .from('entities')
        .insert([data]);
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entity'] });
    },
  });
}
```

#### Component Pattern (Framer Motion + Suspense)

```typescript
// Lazy import
const MyModule = React.lazy(() => 
  import("./modules/my/MyModule").then(m => ({ default: m.MyModule }))
);

// Route with animation
<Route path="/my-route" element={(
  <motion.section
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.22 }}
  >
    <Suspense fallback={<SectionLoader label="Chargement..." />}>
      <MyModule projectId={resolvedProjectId} />
    </Suspense>
  </motion.section>
)} />
```

#### Form Pattern (Controlled Components)

```typescript
const [formData, setFormData] = useState({...});
const [editingId, setEditingId] = useState<string | null>(null);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (editingId) {
    await updateMutation.mutateAsync({...});
    setEditingId(null);
  } else {
    await createMutation.mutateAsync({...});
  }
  setFormData({...});
};
```

### Schema Supabase (24 tables)

```typescript
Database['public']['Tables'] = {
  // Projects & Documents
  projects, documents, document_versions, project_events,
  
  // Tasks & Workers
  tasks, workers, suppliers, incidents,
  
  // Notifications & Access
  notifications, user_roles, role_permissions, security_logs,
  
  // Finance
  budgets, invoices, expenses,
  
  // Procurement
  purchase_orders, purchase_order_items, deliveries,
  
  // Commercial
  clients, sales_leads, sales_pipeline,
  
  // Time
  time_entries,
  
  // Legacy (not in use)
  bpe_logs, workflow_logs
}
```

**Requirement**: Toutes les tables doivent inclure:
```typescript
Relationships: [];
CompositeTypes: Record<string, never>;
```

## 🎨 Design System

### Tailwind Configuration
- Colors: slate, gray, blue, green, red, yellow, orange, purple
- Typography: Inter font via Tailwind
- Responsive: mobile-first (sm: 640px, md: 768px, lg: 1024px)

### Motion Transitions
- Standard entry: `initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}`
- Exit: `exit={{ opacity: 0, y: -10 }}`
- Stagger: Optional delay prop (0.1, 0.2, etc.)

### Color Semantics
- Green: Success, création, status active
- Blue: Info, modification, primary actions
- Red: Danger, suppression, erreurs
- Yellow: Warning, pending, à attention
- Orange: Critical, access denied
- Purple: Export, special actions

## 🧪 Testing

### Routes d'intégration (`/tests/integration`)
- Test runner automatisé pour toutes les 11 routes
- Catégorisation par complexité
- Checklist de tests manuels
- Dashboard de statistiques

### Tests recommandés
- [ ] Changement de projet (multi-project context)
- [ ] Recherche globale dans chaque module
- [ ] Transitions Framer Motion
- [ ] Mode offline (désactiver connexion)
- [ ] Notifications real-time
- [ ] Exports PDF/Excel
- [ ] Navigation mobile (viewport < 768px)
- [ ] Opérations CRUD dans tous les modules

## 📦 Build & Deploy

### Development
```bash
npm --prefix apps/frontend run dev    # Start Vite dev server
npm --prefix apps/frontend run typecheck  # TypeScript validation
```

### Production
```bash
npm --prefix apps/frontend run build   # Build optimisé (Vite)
# Résultat: dist/ folder
```

### Bundle Stats
- Main bundle: ~450 kB (gzipped: ~142 kB)
- IFC Viewer: ~2.5 MB (viewer 3D)
- PDF Viewer: ~139 kB (viewer PDF)
- Lazy chunks: TimeTracking (10 kB), SecurityAudit (7 kB), etc.

## 🚀 Optimisations Implémentées

1. **Code Splitting**: Lazy loading de tous les modules
2. **React Query**: Gestion cache & refetch automatique
3. **Framer Motion**: Hardware-accelerated animations
4. **Tailwind CSS**: Purging CSS non-utilisé
5. **Service Worker**: Offline-first strategy
6. **TypeScript**: Full type safety avec Supabase

## 📱 Responsive Design

- **Desktop** (lg): 2-3 colonnes, navigation sidebar
- **Tablet** (md): Navigation adaptée, grilles ajustées
- **Mobile** (sm): MobileNav bottom bar, single column

## 🔄 Real-time Features

- Notifications avec Supabase subscriptions
- WebSocket support automatique
- Sync multi-user sans conflict
- Offline queue + sync on reconnect

## 🎯 Prochaines Étapes Possibles

1. **Optimisations Perf**: Image optimization, code splitting avancé
2. **Documentation**: Guides utilisateur, API docs
3. **Tests E2E**: Playwright/Cypress pour automation
4. **Analytics**: Tracking usage patterns
5. **Mobile App**: React Native version

---

**Version**: 1.0.0  
**Last Updated**: 2024  
**Build Status**: ✅ All tests passing
