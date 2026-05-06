// modules/audit/pages/AuditTrailPage.tsx
// Vue administrateur — journal d'audit immuable avec filtres et realtime.
import React, { useState, useCallback } from 'react';
import { useAuditLogs } from '../hooks/useAuditLogs';
import { useAuditRealtime } from '../hooks/useAuditRealtime';
import { ACTION_COLORS, SENSITIVE_ACTIONS } from '../types';
import type { AuditFilters } from '../types';
import { formatDateTime } from '@/utils/date';
import { useToast } from '../../../ui/ToastProvider';

interface AuditTrailPageProps {
  projectId?: string;
}

const ENTITY_TYPES = ['incident', 'task', 'document', 'invoice', 'purchase_order', 'user', 'project'];
const ACTIONS_LIST = ['CREATE', 'UPDATE', 'DELETE', 'READ', 'EXPORT', 'LOGIN', 'FINANCE_VIEW', 'FINANCE_EXPORT', 'DATA_EXPORT', 'USER_PERMISSION_CHANGE', 'DELETE_ENTITY'];

export const AuditTrailPage: React.FC<AuditTrailPageProps> = ({ projectId }) => {
  const { showToast } = useToast() || {};
  const [filters, setFilters] = useState<AuditFilters>({ projectId });

  const { data: logs, isLoading, isFetching, refetch } = useAuditLogs(filters);

  const handleSensitiveAction = useCallback((log: Record<string, unknown>) => {
    showToast?.(`⚠️ Action sensible détectée : ${log['action']}`, 'success');
  }, [showToast]);

  useAuditRealtime({ projectId, onSensitiveAction: handleSensitiveAction });

  const setFilter = (key: keyof AuditFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value || undefined }));
  };

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-5xl mx-auto">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900">🔐 Audit Trail Sécurité</h1>
          <p className="text-sm text-slate-500">Journal immuable de toutes les actions métier</p>
        </div>
        <div className="flex items-center gap-2">
          {isFetching && <span className="text-xs text-slate-400 animate-pulse">Actualisation…</span>}
          <button
            onClick={() => refetch()}
            className="text-xs border border-slate-300 rounded-lg px-3 py-1.5 hover:bg-slate-50 transition-colors"
          >
            ↻ Actualiser
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 rounded-xl p-3 border border-slate-200">
        <div>
          <label className="text-xs text-slate-500 block mb-1 font-medium">Action</label>
          <select
            className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 bg-white"
            onChange={(e) => setFilter('action', e.target.value)}
          >
            <option value="">Toutes</option>
            {ACTIONS_LIST.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-500 block mb-1 font-medium">Entité</label>
          <select
            className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 bg-white"
            onChange={(e) => setFilter('entityType', e.target.value)}
          >
            <option value="">Toutes</option>
            {ENTITY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-500 block mb-1 font-medium">Depuis</label>
          <input
            type="date"
            className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 bg-white"
            onChange={(e) => setFilter('from', e.target.value ? `${e.target.value}T00:00:00Z` : '')}
          />
        </div>
        <div>
          <label className="text-xs text-slate-500 block mb-1 font-medium">Jusqu'au</label>
          <input
            type="date"
            className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 bg-white"
            onChange={(e) => setFilter('to', e.target.value ? `${e.target.value}T23:59:59Z` : '')}
          />
        </div>
      </div>

      {/* Compteur + export CSV */}
      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>{logs?.length ?? 0} entrée{(logs?.length ?? 0) !== 1 ? 's' : ''}</span>
        <button
          onClick={() => exportCSV(logs ?? [])}
          className="text-xs text-purple-600 hover:text-purple-800 font-medium transition-colors"
        >
          ↓ Exporter CSV
        </button>
      </div>

      {/* Tableau des logs */}
      {isLoading ? (
        <p className="text-slate-400 text-sm">Chargement…</p>
      ) : !logs?.length ? (
        <p className="text-slate-400 text-sm">Aucun log pour ces filtres.</p>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => {
            const isSensitive = SENSITIVE_ACTIONS.includes(log.action);
            return (
              <div
                key={log.id}
                className={`rounded-xl border p-3 text-sm ${
                  isSensitive
                    ? 'border-orange-300 bg-orange-50'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {isSensitive && (
                      <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-semibold">
                        ⚠️ sensible
                      </span>
                    )}
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        ACTION_COLORS[log.action] ?? 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {log.action}
                    </span>
                    {log.entity_type && (
                      <span className="text-xs text-slate-500">
                        {log.entity_type}
                        {log.entity_id && (
                          <span className="text-slate-400 ml-1 font-mono">
                            {log.entity_id.slice(0, 8)}…
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 shrink-0">{formatDateTime(log.created_at)}</span>
                </div>

                <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                  {log.user_id && (
                    <span>👤 <span className="font-mono">{log.user_id.slice(0, 8)}…</span></span>
                  )}
                  {log.project_id && (
                    <span>📁 <span className="font-mono">{log.project_id.slice(0, 8)}…</span></span>
                  )}
                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                    <details className="cursor-pointer">
                      <summary className="text-slate-400 hover:text-slate-600">métadonnées</summary>
                      <pre className="mt-1 text-xs bg-slate-100 rounded p-2 max-w-md overflow-auto">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Export CSV côté client
function exportCSV(logs: ReturnType<typeof useAuditLogs>['data'] & object[]) {
  const header = 'id,user_id,action,entity_type,entity_id,project_id,created_at';
  const rows = logs.map((l: any) =>
    [l.id, l.user_id, l.action, l.entity_type, l.entity_id, l.project_id, l.created_at]
      .map((v) => `"${v ?? ''}"`)
      .join(',')
  );
  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `audit-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
