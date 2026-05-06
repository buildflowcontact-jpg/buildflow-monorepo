import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SupplierList } from './SupplierList';
import { PurchaseOrderList } from './PurchaseOrderList';
import { DeliveryTracker } from './DeliveryTracker';
import { usePurchaseOrders, useDeliveries } from '../hooks/useProcurement';
import { ModuleLayout } from '@/components/layout/ModuleLayout';
import { SkeletonCard } from '@/components/ui/Skeleton';

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
    <ModuleLayout
      title="Approvisionnement"
      description="Pilotez le flux commandes vers livraisons avec une execution rapide."
      leftClassName="bf-card-soft p-4 space-y-2"
      left={
        <>
          <h3 className="bf-text-primary font-black tracking-tight">Navigation donnees</h3>
          {TABS.map((t) => (
            <Button
              key={t.key}
              type="button"
              variant={tab === t.key ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setTab(t.key)}
              className="w-full justify-start"
            >
              {t.label}
            </Button>
          ))}
        </>
      }
      right={
        <>
          <h3 className="bf-text-primary font-black tracking-tight">Actions rapides</h3>
          <Button type="button" variant="ghost" size="sm" className="w-full justify-start" onClick={() => setTab('orders')}>Nouvelle commande</Button>
          <Button type="button" variant="ghost" size="sm" className="w-full justify-start" onClick={() => setTab('deliveries')}>Reception livraison</Button>
          <Button type="button" size="sm" className="w-full justify-start" onClick={() => setTab('orders')}>Escalader retard</Button>
          <p className="text-xs bf-text-muted">Flux: Commandes {orders.length} → Livraisons {deliveries.length}</p>
        </>
      }
    >
      <div className="space-y-3">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="bf-card-soft p-3">
            <p className="text-xs uppercase font-semibold bf-text-muted mb-1">Commandes livrees</p>
            <p className="text-2xl font-black text-green-700">{deliveredOrders}</p>
          </div>
          <div className="bf-card-soft p-3">
            <p className="text-xs uppercase font-semibold bf-text-muted mb-1">Commandes ouvertes</p>
            <p className="text-2xl font-black text-blue-700">{openOrders}</p>
          </div>
          <div className="bf-card-soft p-3">
            <p className="text-xs uppercase font-semibold bf-text-muted mb-1">Commandes en retard</p>
            <p className="text-2xl font-black text-red-700">{lateOrders}</p>
          </div>
        </div>

        <div className="bf-card-soft p-4">
          {tab === 'orders' && <PurchaseOrderList projectId={projectId} />}
          {tab === 'deliveries' && <DeliveryTracker projectId={projectId} />}
          {tab === 'suppliers' && <SupplierList projectId={projectId} />}
        </div>
      </div>
    </ModuleLayout>
  );
}
