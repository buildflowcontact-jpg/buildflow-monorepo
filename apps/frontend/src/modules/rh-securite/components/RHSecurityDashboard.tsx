import React, { useState, useEffect, useMemo } from 'react';
import { WorkerList } from './WorkerList';
import { RoleManagement } from './RoleManagement';
import { SecurityAuditLog } from './SecurityAuditLog';
import { useNavigate } from 'react-router-dom';
import { usePermission } from '@/app/providers/PermissionProvider';

interface RHSecurityDashboardProps {
  projectId: string;
}

type Tab = 'workers' | 'roles' | 'audit';

export const RHSecurityDashboard: React.FC<RHSecurityDashboardProps> = ({ projectId }) => {
  const [activeTab, setActiveTab] = useState<Tab>('workers');
  const navigate = useNavigate();
  const { can } = usePermission();

  const tabs = useMemo(() => [
    { id: 'workers' as Tab, label: 'Collaborateurs', icon: '👥' },
    ...(can('rh:manage') ? [{ id: 'roles' as Tab, label: 'Rôles et permissions', icon: '🔐' }] : []),
    ...(can('audit:read') || can('audit:limited') ? [{ id: 'audit' as Tab, label: 'Audit de sécurité', icon: '📋' }] : []),
  ], [can]);

  // Si l'onglet actif n'est plus disponible (perte de permission), revenir à 'workers'
  useEffect(() => {
    if (!tabs.find((t) => t.id === activeTab)) {
      setActiveTab('workers');
    }
  }, [tabs, activeTab]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bf-module-header p-6">
        <h1 className="bf-text-primary text-3xl font-bold">Gestion RH & Sécurité</h1>
        <p className="bf-text-muted mt-1">
          Gérez les collaborateurs, les rôles, les permissions et l'audit de sécurité
        </p>
      </div>

      {/* Tabs */}
      <div className="bf-tabs-shell">
        <div className="bf-tabs-bar flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`bf-tab flex-1 px-4 py-3 font-medium text-center border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'bf-tab-active'
                  : 'bf-tab-inactive'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'workers' && <WorkerList projectId={projectId} />}
          {activeTab === 'roles' && <RoleManagement projectId={projectId} />}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button
                  onClick={() => navigate('/rh-securite/audit')}
                  className="bf-primary-button px-4 py-2 rounded-lg transition-colors"
                >
                  Vue détaillée des audits →
                </button>
              </div>
              <SecurityAuditLog projectId={projectId} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
