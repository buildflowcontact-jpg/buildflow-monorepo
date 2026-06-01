import React, { useEffect, useState } from 'react';
import { PackageSearch, Truck } from 'lucide-react';
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
      <div className="rounded-[24px] border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="bf-text-primary flex items-center gap-2 text-2xl font-black">
              <PackageSearch size={18} className="text-blue-600" />
              Approvisionnements
            </h2>
            <p className="bf-text-muted mt-1 text-sm">Commandes · {orders.length} &nbsp;|&nbsp; Livraisons · {deliveries.length}</p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
            <Truck size={12} />
            Suivi en temps reel
          </span>
        </div>
      </div>

      {/* Intercalaires principaux */}
      <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
        {/* Barre d'onglets */}
        <div className="flex border-b border-slate-200 bg-slate-50/50">
          <button
            type="button"
            onClick={() => setMainTab('orders')}
            className={`-mb-px border-b-2 px-6 py-3 text-sm font-semibold transition-colors ${
              mainTab === 'orders'
                ? 'border-blue-600 bg-white text-blue-700'
                : 'border-transparent bg-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Commandes
          </button>
          <button
            type="button"
            onClick={() => setMainTab('deliveries')}
            className={`-mb-px border-b-2 px-6 py-3 text-sm font-semibold transition-colors ${
              mainTab === 'deliveries'
                ? 'border-blue-600 bg-white text-blue-700'
                : 'border-transparent bg-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Livraisons
          </button>
        </div>

        {/* Sous-filtres */}
        <div className="flex items-center gap-1.5 border-b border-slate-100 bg-white px-4 py-2">
          {mainTab === 'orders' ? (
            <>
              <Button className="rounded-xl" type="button" variant={orderView === 'to_order' ? 'default' : 'ghost'} size="sm" onClick={() => setOrderView('to_order')}>A passer</Button>
              <Button className="rounded-xl" type="button" variant={orderView === 'in_progress' ? 'default' : 'ghost'} size="sm" onClick={() => setOrderView('in_progress')}>En cours</Button>
              <Button className="rounded-xl" type="button" variant={orderView === 'delivered' ? 'default' : 'ghost'} size="sm" onClick={() => setOrderView('delivered')}>Livrees</Button>
            </>
          ) : (
            <>
              <Button className="rounded-xl" type="button" variant={deliveryView === 'pending' ? 'default' : 'ghost'} size="sm" onClick={() => setDeliveryView('pending')}>En attente</Button>
              <Button className="rounded-xl" type="button" variant={deliveryView === 'done' ? 'default' : 'ghost'} size="sm" onClick={() => setDeliveryView('done')}>Effectuees</Button>
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
