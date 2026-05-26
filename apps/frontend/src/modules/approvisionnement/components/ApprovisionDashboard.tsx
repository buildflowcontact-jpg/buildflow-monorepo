import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { PurchaseOrderList } from './PurchaseOrderList';
import { DeliveryTracker } from './DeliveryTracker';
import { usePurchaseOrders, useDeliveries } from '../hooks/useProcurement';
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
  const queryClient = useQueryClient();

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

    return () => { supabase.removeChannel(channel); };
  }, [projectId, queryClient]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="bf-text-primary font-black text-2xl">Approvisionnement</h2>
        <p className="bf-text-muted text-sm">Commandes · {orders.length} &nbsp;|&nbsp; Livraisons · {deliveries.length}</p>
      </div>

      {/* Intercalaires principaux */}
      <div className="bf-card-soft overflow-hidden">
        {/* Barre d'onglets */}
        <div className="flex border-b border-slate-200">
          <button
            type="button"
            onClick={() => setMainTab('orders')}
            className={`px-6 py-3 text-sm font-semibold transition-colors border-b-2 -mb-px ${
              mainTab === 'orders'
                ? 'border-blue-600 text-blue-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700 bg-slate-50'
            }`}
          >
            Commandes
          </button>
          <button
            type="button"
            onClick={() => setMainTab('deliveries')}
            className={`px-6 py-3 text-sm font-semibold transition-colors border-b-2 -mb-px ${
              mainTab === 'deliveries'
                ? 'border-blue-600 text-blue-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700 bg-slate-50'
            }`}
          >
            Livraisons
          </button>
        </div>

        {/* Sous-filtres */}
        <div className="flex items-center gap-1.5 px-4 py-2 bg-white border-b border-slate-100">
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

        {/* Contenu */}
        <div className="p-4">
          {mainTab === 'orders' && <PurchaseOrderList projectId={projectId} view={orderView} />}
          {mainTab === 'deliveries' && <DeliveryTracker projectId={projectId} view={deliveryView} />}
        </div>
      </div>
    </div>
  );
}
