import React, { useMemo } from 'react';
import { useSecurityLogs } from '../hooks/useRHSecurity';

interface SecurityAuditLogProps {
  projectId: string;
}

const ACTION_COLORS: Record<string, string> = {
  create: 'bg-green-100 text-green-700',
  update: 'bg-blue-100 text-blue-700',
  delete: 'bg-red-100 text-red-700',
  login: 'bg-yellow-100 text-yellow-700',
  logout: 'bg-gray-100 text-gray-700',
  access_denied: 'bg-red-100 text-red-700',
  export: 'bg-purple-100 text-purple-700',
};

export const SecurityAuditLog: React.FC<SecurityAuditLogProps> = ({ projectId }) => {
  const { data: logs, isLoading, error } = useSecurityLogs(projectId);

  const groupedLogs = useMemo(() => {
    if (!logs) return {};
    const grouped: Record<string, typeof logs> = {};
    logs.forEach((log) => {
      const date = new Date(log.created_at).toLocaleDateString('fr-FR');
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(log);
    });
    return grouped;
  }, [logs]);

  if (isLoading) return <div className="text-gray-500">Chargement...</div>;
  if (error) return <div className="text-red-500">Erreur lors du chargement</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Journal d'audit de sécurité</h3>
        <p className="text-sm text-gray-600 mb-4">
          Derniers 100 événements de sécurité pour ce projet
        </p>
      </div>

      <div className="space-y-4">
        {Object.entries(groupedLogs).map(([date, dayLogs]) => (
          <div key={date} className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
              <h4 className="font-medium text-gray-900">{date}</h4>
            </div>
            <div className="divide-y divide-gray-200">
              {dayLogs.map((log) => {
                const actionClass = ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-700';
                const time = new Date(log.created_at).toLocaleTimeString('fr-FR');
                return (
                  <div key={log.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${actionClass}`}>
                            {log.action}
                          </span>
                          <span className="text-sm text-gray-500">{time}</span>
                        </div>
                        <p className="text-sm text-gray-700">
                          {log.resource_type && (
                            <span>
                              Ressource: <span className="font-medium">{log.resource_type}</span>
                            </span>
                          )}
                        </p>
                        {log.details && (
                          <details className="mt-2 cursor-pointer">
                            <summary className="text-xs text-gray-500 hover:text-gray-700">
                              Détails
                            </summary>
                            <pre className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600 overflow-auto">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {!logs?.length && (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            Aucun événement de sécurité enregistré
          </div>
        )}
      </div>
    </div>
  );
};
