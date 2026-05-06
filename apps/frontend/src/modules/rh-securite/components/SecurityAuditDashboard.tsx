import React, { useState, useMemo } from 'react';
import { useSecurityLogs, useSecurityLogStats } from '../hooks/useSecurityAudit';
import { motion } from 'framer-motion';

interface SecurityAuditDashboardProps {
  projectId: string;
}

export const SecurityAuditDashboard: React.FC<SecurityAuditDashboardProps> = ({ projectId }) => {
  const [filterAction, setFilterAction] = useState<string>('');
  const [dateRange, setDateRange] = useState<[string, string]>([
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    new Date().toISOString().split('T')[0],
  ]);

  const { data: logs = [], isLoading } = useSecurityLogs(projectId, {
    action: filterAction || undefined,
    dateRange: dateRange[0] && dateRange[1] ? dateRange : undefined,
  });

  const { data: stats } = useSecurityLogStats(projectId);

  const actionOptions = useMemo(() => {
    const actions = new Set<string>();
    logs.forEach((log) => actions.add(log.action));
    return Array.from(actions).sort();
  }, [logs]);

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create':
        return 'bg-green-100 text-green-800';
      case 'update':
        return 'bg-blue-100 text-blue-800';
      case 'delete':
        return 'bg-red-100 text-red-800';
      case 'login':
        return 'bg-yellow-100 text-yellow-800';
      case 'access_denied':
        return 'bg-orange-100 text-orange-800';
      case 'export':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      create: 'Création',
      update: 'Modification',
      delete: 'Suppression',
      login: 'Connexion',
      access_denied: 'Accès refusé',
      export: 'Export',
    };
    return labels[action] || action;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-3xl font-bold text-gray-900">Journal d'audit sécurité</h1>
        <p className="text-gray-600 mt-1">
          Consultez et analysez tous les événements de sécurité du projet
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow p-4"
          >
            <p className="text-sm font-medium text-gray-600">Total événements (30j)</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">{stats.totalLogs}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow p-4"
          >
            <p className="text-sm font-medium text-gray-600">Créations</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{stats.actionCounts['create'] || 0}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow p-4"
          >
            <p className="text-sm font-medium text-gray-600">Modifications</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">{stats.actionCounts['update'] || 0}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-lg shadow p-4"
          >
            <p className="text-sm font-medium text-gray-600">Suppressions</p>
            <p className="text-3xl font-bold text-red-600 mt-2">{stats.actionCounts['delete'] || 0}</p>
          </motion.div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtres</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type d'action</label>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous les événements</option>
              {actionOptions.map((action) => (
                <option key={action} value={action}>
                  {getActionLabel(action)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date début</label>
            <input
              type="date"
              value={dateRange[0]}
              onChange={(e) => setDateRange([e.target.value, dateRange[1]])}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date fin</label>
            <input
              type="date"
              value={dateRange[1]}
              onChange={(e) => setDateRange([dateRange[0], e.target.value])}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Événements ({logs.length})</h3>
        </div>

        {isLoading ? (
          <div className="px-6 py-12 text-center text-gray-500">Chargement...</div>
        ) : logs.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            Aucun événement pour cette période
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Date/Heure</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Action</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">User ID</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {logs.map((log) => (
                  <motion.tr
                    key={log.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getActionColor(log.action)}`}>
                        {getActionLabel(log.action)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-mono text-xs">
                      {log.actor_id ? log.actor_id.substring(0, 8) + '...' : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                      {typeof log.details === 'string' ? log.details : JSON.stringify(log.details || {})}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
