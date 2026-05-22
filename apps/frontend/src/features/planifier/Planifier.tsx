import React, { useMemo } from 'react';
import { Gantt } from './Gantt';
import { usePurchaseOrders } from '@/modules/approvisionnement/hooks/useProcurement';

interface PlanifierProps {
  projectId: string;
}

export function Planifier({ projectId }: PlanifierProps) {
  const { data: purchaseOrders = [] } = usePurchaseOrders(projectId);

  const plannedDeliveries = useMemo(
    () => purchaseOrders
      .filter((order) => Boolean(order.expected_delivery_at))
      .map((order) => ({
        id: `delivery-${order.id}`,
        name: `Livraison prevue - ${order.reference}`,
        date: String(order.expected_delivery_at).slice(0, 10),
      })),
    [purchaseOrders]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="bf-text-primary font-black text-2xl mb-1">Planning</h2>
          <p className="bf-text-muted">Diagramme de Gantt unique: taches du projet et livraisons prevues.</p>
        </div>
      </div>

      <div className="bf-card-soft p-4 md:p-5">
        <h3 className="bf-text-primary font-black tracking-tight mb-2">Diagramme de Gantt</h3>
        <Gantt mode="simplifie" readOnly plannedDeliveries={plannedDeliveries} />
      </div>
    </div>
  );
}
