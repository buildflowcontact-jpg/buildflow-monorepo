import React, { useState, useMemo } from 'react';
import { TimeEntryForm } from './TimeEntryForm';
import { useTimeEntries } from '../hooks/useTimeTracking';

interface TimeTrackingDashboardProps {
  projectId: string;
}

export const TimeTrackingDashboard: React.FC<TimeTrackingDashboardProps> = ({ projectId }) => {
  const [filterMonth, setFilterMonth] = useState(
    new Date().toISOString().split('T')[0].slice(0, 7)
  );

  const startDate = `${filterMonth}-01`;
  const [year, month] = filterMonth.split('-');
  const endDate = `${year}-${month}-31`;

  const { data: entries = [] } = useTimeEntries(projectId, startDate, endDate);

  const stats = useMemo(() => {
    const totalHours = entries.reduce((sum, e) => sum + e.hours, 0);
    const byWorker: Record<string, number> = {};
    
    entries.forEach((entry) => {
      if (entry.worker_id) {
        byWorker[entry.worker_id] = (byWorker[entry.worker_id] || 0) + entry.hours;
      }
    });

    return {
      totalHours,
      totalEntries: entries.length,
      averageHoursPerDay: entries.length > 0 ? (totalHours / entries.length).toFixed(1) : 0,
      byWorker,
    };
  }, [entries]);

  const monthName = new Date(`${filterMonth}-01`).toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-3xl font-bold text-gray-900">Suivi du temps</h1>
        <p className="text-gray-600 mt-1">
          Enregistrez et consultez les heures travaillées
        </p>
      </div>

      {/* Month Filter */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mois</label>
            <input
              type="month"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 capitalize">{monthName}</h3>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-600">Total heures</p>
          <div className="mt-2 text-3xl font-bold text-blue-600">{stats.totalHours}h</div>
          <p className="text-xs text-gray-500 mt-1">{stats.totalEntries} entrées</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-600">Moyenne/jour</p>
          <div className="mt-2 text-3xl font-bold text-green-600">{stats.averageHoursPerDay}h</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-600">Jours travaillés</p>
          <div className="mt-2 text-3xl font-bold text-purple-600">{entries.length}</div>
        </div>
      </div>

      {/* Time Entry Form */}
      <TimeEntryForm projectId={projectId} />

      {/* Worker Summary */}
      {Object.keys(stats.byWorker).length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Heures par collaborateur</h3>
          <div className="space-y-3">
            {Object.entries(stats.byWorker).map(([workerId, hours]) => (
              <div key={workerId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">{workerId}</span>
                <span className="font-semibold text-gray-900">{hours}h</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
