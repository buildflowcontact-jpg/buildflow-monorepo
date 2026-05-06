import React, { useState } from 'react';
import { SupplierList } from './SupplierList';
import { PurchaseOrderList } from './PurchaseOrderList';
import { DeliveryTracker } from './DeliveryTracker';

type Tab = 'orders' | 'deliveries' | 'suppliers';

const TABS: { key: Tab; label: string }[] = [
  { key: 'orders', label: 'Commandes' },
  { key: 'deliveries', label: 'Livraisons' },
  { key: 'suppliers', label: 'Fournisseurs' },
];

interface Props {
  projectId: string;
}

export function ApprovisionDashboard({ projectId }: Props) {
  const [tab, setTab] = useState<Tab>('orders');

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-4">
      <h2 className="text-lg font-bold text-gray-800">Approvisionnement</h2>

      <div className="flex border-b">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg border p-4">
        {tab === 'orders' && <PurchaseOrderList projectId={projectId} />}
        {tab === 'deliveries' && <DeliveryTracker projectId={projectId} />}
        {tab === 'suppliers' && <SupplierList projectId={projectId} />}
      </div>
    </div>
  );
}
