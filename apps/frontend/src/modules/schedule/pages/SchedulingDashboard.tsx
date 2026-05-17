// Scheduling Dashboard Page
// Main interface for managing worker schedules and collision detection

import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import WorkerScheduleForm from '../components/WorkerScheduleForm';
import { CollisionList } from '../components/CollisionAlert';
import { useSchedules } from '../hooks/useSchedules';

interface TabType {
  id: 'schedules' | 'conflicts' | 'create';
  label: string;
}

const TABS: TabType[] = [
  { id: 'schedules', label: '📅 Schedules' },
  { id: 'conflicts', label: '⚠️ Conflicts' },
  { id: 'create', label: '➕ Create Schedule' },
];

interface SchedulingDashboardProps {
  projectId?: string;
  currentUserId?: string;
}

export const SchedulingDashboard: React.FC<SchedulingDashboardProps> = ({
  projectId: projectIdFromProps,
  currentUserId,
}) => {
  const { projectId: projectIdFromRoute } = useParams<{ projectId: string }>();
  const projectId = projectIdFromProps ?? projectIdFromRoute;
  const [activeTab, setActiveTab] = useState<TabType['id']>('schedules');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  if (!projectId) {
    return <div className="p-4 text-red-600">Project ID not found</div>;
  }

  const {
    schedules,
    collisions,
    loading,
    error,
    refreshSchedules,
    deleteSchedule,
    resolveCollision,
  } = useSchedules(projectId);

  const handleScheduleCreated = async (schedule: any) => {
    setSuccessMessage(
      `Schedule created successfully for ${schedule.location}`
    );
    await refreshSchedules();
    setActiveTab('conflicts'); // Show any conflicts
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  const handleScheduleError = (error: Error) => {
    setErrorMessage(error.message);
    setTimeout(() => setErrorMessage(''), 5000);
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!window.confirm('Are you sure you want to delete this schedule?')) {
      return;
    }

    try {
      await deleteSchedule(scheduleId);
      setSuccessMessage('Schedule deleted successfully');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      setErrorMessage((error as Error).message);
      setTimeout(() => setErrorMessage(''), 5000);
    }
  };

  const handleResolveCollision = async (
    collisionId: string,
    notes: string
  ) => {
    try {
      await resolveCollision(collisionId, notes);
      setSuccessMessage('Collision marked as resolved');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      setErrorMessage((error as Error).message);
      setTimeout(() => setErrorMessage(''), 5000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            📋 Scheduling & Collision Detection
          </h1>
          <p className="mt-2 text-gray-600">
            Manage worker schedules and resolve conflicts automatically
          </p>
        </div>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="max-w-7xl mx-auto px-4 mt-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
            ✓ {successMessage}
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="max-w-7xl mx-auto px-4 mt-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            ✕ {errorMessage}
          </div>
        </div>
      )}

      {error && (
        <div className="max-w-7xl mx-auto px-4 mt-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            Error loading data: {error.message}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-200">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {activeTab === 'schedules' && (
            <div>
              <h2 className="text-xl font-bold mb-6">Active Schedules</h2>

              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-20 bg-gray-200 rounded animate-pulse"
                    />
                  ))}
                </div>
              ) : schedules.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <p>No schedules yet. Create one to get started!</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                          Worker
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                          Location
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                          Time
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {schedules.map((schedule) => (
                        <tr key={schedule.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {schedule.worker_id.substring(0, 8)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {schedule.location}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {new Date(schedule.start_time).toLocaleString()} -
                            {new Date(schedule.end_time).toLocaleTimeString()}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span
                              className={`px-2 py-1 rounded text-xs font-semibold ${
                                schedule.is_tentative
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-green-100 text-green-800'
                              }`}
                            >
                              {schedule.is_tentative ? 'Draft' : 'Confirmed'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <button
                              onClick={() =>
                                handleDeleteSchedule(schedule.id)
                              }
                              className="text-red-600 hover:text-red-800 font-medium"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'conflicts' && (
            <div>
              <CollisionList
                collisions={collisions}
                onResolve={handleResolveCollision}
                onDismiss={() => refreshSchedules()}
                loading={loading}
              />
            </div>
          )}

          {activeTab === 'create' && (
            <div>
              <WorkerScheduleForm
                projectId={projectId}
                workerId={currentUserId ?? ''}
                onSuccess={handleScheduleCreated}
                onError={handleScheduleError}
              />
            </div>
          )}
        </div>

        {/* Statistics */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-3xl font-bold text-blue-600">
              {schedules.length}
            </div>
            <div className="text-gray-600 text-sm mt-2">Total Schedules</div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-3xl font-bold text-yellow-600">
              {collisions.length}
            </div>
            <div className="text-gray-600 text-sm mt-2">
              Unresolved Conflicts
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-3xl font-bold text-green-600">
              {schedules.filter((s) => !s.is_tentative).length}
            </div>
            <div className="text-gray-600 text-sm mt-2">Confirmed Schedules</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchedulingDashboard;
