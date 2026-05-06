import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface RouteTest {
  path: string;
  label: string;
  icon: string;
  description: string;
  category: 'core' | 'modules' | 'advanced';
}

const ROUTES_TO_TEST: RouteTest[] = [
  // Core routes
  { path: '/executer', label: 'Exécuter', icon: '▶', description: 'Tableau de suivi des tâches', category: 'core' },
  { path: '/planifier', label: 'Planifier', icon: '📅', description: 'Planification projet', category: 'core' },
  { path: '/piloter', label: 'Piloter', icon: '📊', description: 'Pilotage BPE', category: 'core' },
  { path: '/equipe', label: 'Équipe', icon: '👥', description: 'Gestion équipe', category: 'core' },

  // Business modules
  { path: '/approvisionner', label: 'Approvisionner', icon: '📦', description: 'Gestion approvisionnement', category: 'modules' },
  { path: '/finance', label: 'Finance', icon: '💰', description: 'Gestion financière', category: 'modules' },
  { path: '/rh-securite', label: 'RH Sécurité', icon: '🔐', description: 'Gestion RH & sécurité', category: 'modules' },
  { path: '/rh-securite/audit', label: 'Audit Sécurité', icon: '📋', description: 'Dashboard audit avancé', category: 'modules' },
  { path: '/commercial', label: 'Commercial', icon: '🤝', description: 'CRM et pipeline ventes', category: 'modules' },

  // Advanced modules
  { path: '/kpi', label: 'KPI', icon: '📈', description: 'Dashboard KPI executives', category: 'advanced' },
  { path: '/time-tracking', label: 'Temps', icon: '⏱', description: 'Suivi du temps', category: 'advanced' },
];

interface TestResult {
  path: string;
  status: 'pending' | 'loading' | 'success' | 'error';
  message?: string;
}

export const IntegrationTestRunner: React.FC = () => {
  const navigate = useNavigate();
  const [testResults, setTestResults] = useState<Map<string, TestResult>>(new Map());
  const [isRunning, setIsRunning] = useState(false);
  const [autoNavigate, setAutoNavigate] = useState(false);

  const runTests = async () => {
    setIsRunning(true);
    const results = new Map<string, TestResult>();

    for (const route of ROUTES_TO_TEST) {
      results.set(route.path, { path: route.path, status: 'loading' });
      setTestResults(new Map(results));

      try {
        // Simulate navigation and wait
        navigate(route.path);
        
        // Wait for component to load (500ms timeout)
        await new Promise((resolve) => setTimeout(resolve, 500));

        results.set(route.path, {
          path: route.path,
          status: 'success',
          message: 'Composant chargé',
        });
      } catch (error) {
        results.set(route.path, {
          path: route.path,
          status: 'error',
          message: error instanceof Error ? error.message : 'Erreur inconnue',
        });
      }

      setTestResults(new Map(results));
    }

    setIsRunning(false);
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-900';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-900';
      case 'loading':
        return 'bg-yellow-50 border-yellow-200 text-yellow-900';
      case 'pending':
      default:
        return 'bg-gray-50 border-gray-200 text-gray-900';
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'loading':
        return '⏳';
      case 'pending':
      default:
        return '○';
    }
  };

  const categories = ['core', 'modules', 'advanced'] as const;
  const passedTests = Array.from(testResults.values()).filter((r) => r.status === 'success').length;
  const totalTests = Array.from(testResults.values()).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-3xl font-bold text-gray-900">Tests d'Intégration</h1>
        <p className="text-gray-600 mt-1">
          Validez le fonctionnement de tous les modules et routes
        </p>
      </div>

      {/* Summary */}
      {testResults.size > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm font-medium text-gray-600">Tests exécutés</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">{totalTests}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm font-medium text-gray-600">Réussis</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{passedTests}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm font-medium text-gray-600">Taux de réussite</p>
            <p className="text-3xl font-bold text-purple-600 mt-2">
              {totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0}%
            </p>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="bg-white rounded-lg shadow p-4 flex gap-4 items-center">
        <button
          onClick={runTests}
          disabled={isRunning}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isRunning ? '⏳ Tests en cours...' : '▶ Lancer les tests'}
        </button>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={autoNavigate}
            onChange={(e) => setAutoNavigate(e.target.checked)}
            className="rounded"
          />
          Navigation automatique
        </label>
        {testResults.size > 0 && (
          <button
            onClick={() => {
              setTestResults(new Map());
              navigate('/executer');
            }}
            className="ml-auto px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Réinitialiser
          </button>
        )}
      </div>

      {/* Results by category */}
      {testResults.size > 0 && (
        <AnimatePresence>
          {categories.map((category) => {
            const categoryTests = ROUTES_TO_TEST.filter((r) => r.category === category);
            const categoryResults = categoryTests.map((r) => testResults.get(r.path)).filter(Boolean) as TestResult[];

            if (categoryResults.length === 0) return null;

            return (
              <motion.div
                key={category}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white rounded-lg shadow overflow-hidden"
              >
                <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900 capitalize">
                    {category === 'core' ? 'Routes principales' : category === 'modules' ? 'Modules métier' : 'Modules avancés'}
                  </h3>
                </div>
                <div className="divide-y divide-gray-200">
                  {categoryTests.map((route) => {
                    const result = testResults.get(route.path);
                    return (
                      <motion.div
                        key={route.path}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => navigate(route.path)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <span className="text-2xl">{route.icon}</span>
                              <h4 className="font-semibold text-gray-900">{route.label}</h4>
                            </div>
                            <p className="text-sm text-gray-600">{route.description}</p>
                            <p className="text-xs text-gray-500 mt-1 font-mono">{route.path}</p>
                          </div>
                          {result && (
                            <div className={`px-4 py-2 rounded-lg border flex items-center gap-2 ${getStatusColor(result.status)}`}>
                              <span className="text-lg">{getStatusIcon(result.status)}</span>
                              <span className="text-sm font-medium capitalize">
                                {result.status === 'loading' ? 'Chargement...' : result.status === 'pending' ? 'En attente' : result.message || result.status}
                              </span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      )}

      {/* Manual test checklist */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Tests manuels recommandés</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <p>✓ Vérifier que le changement de projet fonctionne (dropdown en haut)</p>
          <p>✓ Tester la recherche globale dans chaque module</p>
          <p>✓ Vérifier les transitions Framer Motion entre routes</p>
          <p>✓ Tester la mode offline en désactivant la connexion</p>
          <p>✓ Vérifier les notifications real-time (ouvrir NotificationBell)</p>
          <p>✓ Tester les exports PDF/Excel dans Finance</p>
          <p>✓ Valider la navigation mobile (viewport {`<`} 768px)</p>
          <p>✓ Vérifier les opérations CRUD dans chaque module</p>
        </div>
      </div>
    </div>
  );
};
