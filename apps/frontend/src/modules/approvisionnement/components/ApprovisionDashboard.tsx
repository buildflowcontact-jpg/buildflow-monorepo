import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { PurchaseOrderList } from './PurchaseOrderList';
import { DeliveryTracker } from './DeliveryTracker';
import { usePurchaseOrders, useDeliveries } from '../hooks/useProcurement';
import { ModuleLayout } from '@/components/layout/ModuleLayout';
import { usePermission } from '@/app/providers/PermissionProvider';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

type MainTab = 'orders' | 'deliveries';
type OrderView = 'to_order' | 'in_progress' | 'delivered';
type DeliveryView = 'pending' | 'done';

interface Props {
  projectId: string;
}

export function ApprovisionDashboard({ projectId }: Props) {
  const [mainTab, setMainTab] = useState<MainTab>('orders');
  const [orderView, setOrderView] = useState<OrderView>('to_order');
  const [deliveryView, setDeliveryView] = useState<DeliveryView>('pending');
  const { data: orders = [] } = usePurchaseOrders(projectId);
  const { data: deliveries = [] } = useDeliveries(projectId);
  const { can } = usePermission();
  const queryClient = useQueryClient();

  const lateOrders = orders.filter((order) => {
    if (!order.expected_delivery_at || order.status === 'delivered') return false;
    return new Date(order.expected_delivery_at) < new Date();
  }).length;

  const deliveredOrders = orders.filter((order) => order.status === 'delivered').length;
  const openOrders = Math.max(orders.length - deliveredOrders, 0);

  const lateOrderList = useMemo(
    () => orders.filter((order) => {
      if (!order.expected_delivery_at || order.status === 'delivered') return false;
      return new Date(order.expected_delivery_at) < new Date();
    }),
    [orders]
  );

  const stockBalance = useMemo(() => {
    const deliveredCount = deliveries.length;
    const expectedCount = openOrders;
    const balance = deliveredCount - expectedCount;
    return {
      deliveredCount,
      expectedCount,
      balance,
      trend: balance >= 0 ? 'stable' : 'tension',
    };
  }, [deliveries.length, openOrders]);

  useEffect(() => {
    const channel = supabase
      .channel(`procurement-live-${projectId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'purchase_orders', filter: `project_id=eq.${projectId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['purchase-orders', projectId] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deliveries', filter: `project_id=eq.${projectId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['deliveries', projectId] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, queryClient]);

  return (
    <ModuleLayout
      title="Approvisionnement"
      description="Pilotez le flux commandes et livraisons avec une interface claire et structurée."
      leftClassName="bf-card-soft p-4 space-y-2"
      left={
        <>
          <h3 className="bf-text-primary font-black tracking-tight mb-2">Navigation</h3>
          <div className="flex flex-col gap-1">
            <Button
            type="button"
            variant={mainTab === 'orders' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setMainTab('orders')}
            className="w-full justify-start"
          >
            Commandes
          </Button>
            <Button
              type="button"
              variant={mainTab === 'deliveries' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setMainTab('deliveries')}
              className="w-full justify-start"
            >
              Livraisons
            </Button>
          </div>

          <div className="pt-2 border-t border-slate-200 space-y-1">
            {mainTab === 'orders' ? (
              <>
                <p className="text-xs uppercase bf-text-muted font-semibold">Commandes</p>
                <Button
                  type="button"
                  variant={orderView === 'to_order' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setOrderView('to_order')}
                  className="w-full justify-start"
                >
                  À passer
                </Button>
                <Button
                  type="button"
                  variant={orderView === 'in_progress' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setOrderView('in_progress')}
                  className="w-full justify-start"
                >
                  En cours
                </Button>
                <Button
                  type="button"
                  variant={orderView === 'delivered' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setOrderView('delivered')}
                  className="w-full justify-start"
                >
                  Livrées
                </Button>
              </>
            ) : (
              <>
                <p className="text-xs uppercase bf-text-muted font-semibold">Livraisons</p>
                <Button
                  type="button"
                  variant={deliveryView === 'pending' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setDeliveryView('pending')}
                  className="w-full justify-start"
                >
                  En attente
                </Button>
                <Button
                  type="button"
                  variant={deliveryView === 'done' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setDeliveryView('done')}
                  className="w-full justify-start"
                >
                  Effectuées
                </Button>
              </>
            )}
          </div>
        </>
      }
      right={
        <>
          <h3 className="bf-text-primary font-black tracking-tight mb-2">Actions</h3>
          <div className="flex flex-col gap-1">
            {can('procurement:create') && (
              <Button type="button" variant="ghost" size="sm" className="w-full justify-start" onClick={() => { setMainTab('orders'); setOrderView('to_order'); }}>
                Nouvelle commande
              </Button>
            )}
            {can('procurement:receive') && (
              <Button type="button" variant="ghost" size="sm" className="w-full justify-start" onClick={() => { setMainTab('deliveries'); setDeliveryView('pending'); }}>
                Réception livraison
              </Button>
            )}
            {can('procurement:manage') && (
              <Button type="button" size="sm" className="w-full justify-start" onClick={() => { setMainTab('orders'); setOrderView('in_progress'); }}>
                Escalader retard
              </Button>
            )}
          </div>
          <p className="text-xs bf-text-muted mt-2">Flux : <span className="font-semibold">Commandes</span> {orders.length} → <span className="font-semibold">Livraisons</span> {deliveries.length}</p>
        </>
      }
    >
      <div className="space-y-3">
        <div className="bf-card-soft p-3">
          <div className="flex items-end gap-1 border-b border-slate-200">
            <button
              type="button"
              onClick={() => setMainTab('orders')}
              className={`px-4 py-2 rounded-t-lg text-sm font-semibold border border-b-0 transition-colors ${
                mainTab === 'orders' ? 'bg-white border-slate-300 bf-text-primary' : 'bg-slate-100 border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Commandes
            </button>
            <button
              type="button"
              onClick={() => setMainTab('deliveries')}
              className={`px-4 py-2 rounded-t-lg text-sm font-semibold border border-b-0 transition-colors ${
                mainTab === 'deliveries' ? 'bg-white border-slate-300 bf-text-primary' : 'bg-slate-100 border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Livraisons
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {mainTab === 'orders' ? (
              <>
                <Button type="button" variant={orderView === 'to_order' ? 'default' : 'ghost'} size="sm" onClick={() => setOrderView('to_order')}>A passer</Button>
                <Button type="button" variant={orderView === 'in_progress' ? 'default' : 'ghost'} size="sm" onClick={() => setOrderView('in_progress')}>En cours</Button>
                <Button type="button" variant={orderView === 'delivered' ? 'default' : 'ghost'} size="sm" onClick={() => setOrderView('delivered')}>Livrees</Button>
              </>
            ) : (
              <>
                <Button type="button" variant={deliveryView === 'pending' ? 'default' : 'ghost'} size="sm" onClick={() => setDeliveryView('pending')}>En attente</Button>
                <Button type="button" variant={deliveryView === 'done' ? 'default' : 'ghost'} size="sm" onClick={() => setDeliveryView('done')}>Effectuees</Button>
              </>
            )}
          </div>
        </div>

        <div className="bf-card-soft p-3">
          <p className="text-xs uppercase font-semibold bf-text-muted mb-2">Alertes commandes en retard</p>
          {lateOrderList.length === 0 ? (
            <p className="text-sm text-green-700">Aucune commande en retard.</p>
          ) : (
            <div className="space-y-1 text-sm">
              {lateOrderList.slice(0, 5).map((order) => (
                <p key={order.id} className="text-red-700">
                  {order.reference} en retard depuis le {new Date(order.expected_delivery_at as string).toLocaleDateString('fr-FR')}
                </p>
              ))}
            </div>
          )}
        </div>

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

        <div className="bf-card-soft p-3">
          <p className="text-xs uppercase font-semibold bf-text-muted mb-1">Stocks estimés temps réel</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div>
              <p className="bf-text-muted">Articles reçus</p>
              <p className="text-xl font-black bf-text-primary">{stockBalance.deliveredCount}</p>
            </div>
            <div>
              <p className="bf-text-muted">Attendus</p>
              <p className="text-xl font-black bf-text-primary">{stockBalance.expectedCount}</p>
            </div>
            <div>
              <p className="bf-text-muted">Balance</p>
              <p className={`text-xl font-black ${stockBalance.balance >= 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                {stockBalance.balance >= 0 ? '+' : ''}{stockBalance.balance}
              </p>
              <p className="text-xs bf-text-muted">Etat: {stockBalance.trend === 'stable' ? 'stable' : 'sous tension'}</p>
            </div>
          </div>
        </div>

        <div className="bf-card-soft p-4">
          {mainTab === 'orders' && <PurchaseOrderList projectId={projectId} view={orderView} />}
          {mainTab === 'deliveries' && <DeliveryTracker projectId={projectId} view={deliveryView} />}
        </div>
      </div>
    </ModuleLayout>
  );
}
