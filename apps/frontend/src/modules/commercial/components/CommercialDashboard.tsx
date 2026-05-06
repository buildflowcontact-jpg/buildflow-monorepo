import React, { useState } from 'react';
import { ClientList } from './ClientList';
import { SalesLeadPipeline } from './SalesLeadPipeline';

interface CommercialDashboardProps {
  projectId: string;
}

type Tab = 'clients' | 'pipeline';

export const CommercialDashboard: React.FC<CommercialDashboardProps> = ({ projectId }) => {
  const [activeTab, setActiveTab] = useState<Tab>('clients');

  const tabs = [
    { id: 'clients' as Tab, label: 'Clients', icon: '👥' },
    { id: 'pipeline' as Tab, label: 'Pipeline commercial', icon: '📈' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bf-module-header p-6">
        <h1 className="bf-text-primary text-3xl font-bold">Gestion Commercial CRM</h1>
        <p className="bf-text-muted mt-1">
          Gérez vos clients et suivez votre pipeline de ventes
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
          {activeTab === 'clients' && <ClientList projectId={projectId} />}
          {activeTab === 'pipeline' && <SalesLeadPipeline projectId={projectId} />}
        </div>
      </div>
    </div>
  );
};
