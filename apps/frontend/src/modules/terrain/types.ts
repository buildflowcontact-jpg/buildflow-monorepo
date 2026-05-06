// modules/terrain/types.ts

export interface TerrainAlert {
  id: string;
  label: string;
  type: 'danger' | 'warning' | 'info';
  source: 'incident' | 'delivery' | 'task';
}

export interface TerrainTask {
  id: string;
  title: string;
  status: string;
  priority: string | null;
}

export interface TerrainFeedItem {
  id: string;
  label: string;
  icon: string;
  time: string;
}

export interface TerrainStats {
  incidentCount: number;
  lateDeliveryCount: number;
  progressPercent: number;
}
