import React, { useState } from 'react';
import { SupplierList } from './SupplierList';
import { PurchaseOrderList } from './PurchaseOrderList';
import { DeliveryTracker } from './DeliveryTracker';
import { usePurchaseOrders, useDeliveries } from '../hooks/useProcurement';

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
  const { data: orders = [] } = usePurchaseOrders(projectId);
  const { data: deliveries = [] } = useDeliveries(projectId);

  const lateOrders = orders.filter((order) => {
    if (!order.expected_delivery_at || order.status === 'delivered') return false;
    return new Date(order.expected_delivery_at) < new Date();
  }).length;

  const deliveredOrders = orders.filter((order) => order.status === 'delivered').length;
  const openOrders = Math.max(orders.length - deliveredOrders, 0);

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-4">
      <h2 className="text-lg font-bold text-gray-800">Approvisionnement</h2>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="bg-white rounded-lg border p-3">
          <p className="text-xs uppercase font-semibold text-gray-500 mb-1">Commandes livrées</p>
          <p className="text-2xl font-black text-green-700">{deliveredOrders}</p>
          <div className="h-1.5 mt-2 rounded bg-gray-100 overflow-hidden">
            <div className="h-full bg-green-500" style={{ width: `${orders.length ? Math.round((deliveredOrders / orders.length) * 100) : 0}%` }} />
          </div>
        </div>
        <div className="bg-white rounded-lg border p-3">
          <p className="text-xs uppercase font-semibold text-gray-500 mb-1">Commandes ouvertes</p>
          <p className="text-2xl font-black text-blue-700">{openOrders}</p>
          <div className="h-1.5 mt-2 rounded bg-gray-100 overflow-hidden">
            <div className="h-full bg-blue-500" style={{ width: `${orders.length ? Math.round((openOrders / orders.length) * 100) : 0}%` }} />
          </div>
        </div>
        <div className="bg-white rounded-lg border p-3">
          <p className="text-xs uppercase font-semibold text-gray-500 mb-1">Commandes en retard</p>
          <p className="text-2xl font-black text-red-700">{lateOrders}</p>
          <div className="h-1.5 mt-2 rounded bg-gray-100 overflow-hidden">
            <div className="h-full bg-red-500" style={{ width: `${orders.length ? Math.round((lateOrders / orders.length) * 100) : 0}%` }} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border p-3">
        <p className="text-xs uppercase font-semibold text-gray-500 mb-2">Flux commandes/livraisons</p>
        <div className="flex items-center gap-3 text-sm">
          <span className="px-2 py-1 rounded bg-blue-50 text-blue-700">Commandes: {orders.length}</span>
          <span>→</span>
          <span className="px-2 py-1 rounded bg-emerald-50 text-emerald-700">Livraisons: {deliveries.length}</span>
        </div>
      </div>

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
