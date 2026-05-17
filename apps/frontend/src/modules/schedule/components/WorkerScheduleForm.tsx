// Worker Schedule Form Component
// Create and edit worker schedules with real-time collision preview

import React, { useState, useEffect } from 'react';
import { useApolloClient } from '@apollo/client/react';
import { gql } from '@apollo/client/core';

interface ScheduleFormProps {
  projectId: string;
  workerId: string;
  onSuccess: (schedule: WorkerSchedulePayload) => void;
  onError: (error: Error) => void;
  initialData?: any;
  isEditing?: boolean;
}

interface WorkerSchedulePayload {
  id: string;
  project_id: string;
  worker_id: string;
  location: string;
  start_time: string;
  end_time: string;
  equipment_ids: string[];
  is_tentative: boolean;
  notes?: string;
}

interface CollisionPayload {
  id: string;
  collision_type: string;
  severity: string;
  overlap_minutes: number;
  suggested_resolution?: string;
}

interface ScheduleMutationResult {
  schedule: WorkerSchedulePayload;
  collisions: CollisionPayload[];
  alerts_created: number;
}

interface CreateScheduleData {
  createWorkerSchedule: ScheduleMutationResult;
}

interface UpdateScheduleData {
  updateWorkerSchedule: ScheduleMutationResult;
}

interface FormData {
  location: string;
  start_time: string;
  end_time: string;
  equipment_ids: string[];
  is_tentative: boolean;
  notes: string;
}

const CREATE_SCHEDULE_MUTATION = gql`
  mutation CreateWorkerSchedule($input: CreateScheduleInput!) {
    createWorkerSchedule(input: $input) {
      schedule {
        id
        project_id
        worker_id
        location
        start_time
        end_time
        equipment_ids
        is_tentative
        notes
      }
      collisions {
        id
        collision_type
        severity
        overlap_minutes
        suggested_resolution
      }
      alerts_created
    }
  }
`;

const UPDATE_SCHEDULE_MUTATION = gql`
  mutation UpdateWorkerSchedule($input: UpdateScheduleInput!) {
    updateWorkerSchedule(input: $input) {
      schedule {
        id
        project_id
        worker_id
        location
        start_time
        end_time
        equipment_ids
        is_tentative
        notes
      }
      collisions {
        id
        collision_type
        severity
        overlap_minutes
      }
      alerts_created
    }
  }
`;

export const WorkerScheduleForm: React.FC<ScheduleFormProps> = ({
  projectId,
  workerId,
  onSuccess,
  onError,
  initialData,
  isEditing = false,
}) => {
  const client = useApolloClient();
  const [loading, setLoading] = useState(false);
  const [collisions, setCollisions] = useState<any[]>([]);
  const [formData, setFormData] = useState<FormData>({
    location: initialData?.location || '',
    start_time: initialData?.start_time || '',
    end_time: initialData?.end_time || '',
    equipment_ids: (initialData?.equipment_ids as string[]) || [],
    is_tentative: initialData?.is_tentative || false,
    notes: initialData?.notes || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === 'checkbox'
          ? (e.target as HTMLInputElement).checked
          : value,
    }));
  };

  const handleAddEquipment = (equipmentId: string) => {
    setFormData((prev) => ({
      ...prev,
      equipment_ids: [...prev.equipment_ids, equipmentId],
    }));
  };

  const handleRemoveEquipment = (equipmentId: string) => {
    setFormData((prev) => ({
      ...prev,
      equipment_ids: prev.equipment_ids.filter((id) => id !== equipmentId),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const input = {
        ...(isEditing && { id: initialData?.id }),
        project_id: projectId,
        ...(isEditing ? {} : { worker_id: workerId }),
        ...formData,
        start_time: new Date(formData.start_time).toISOString(),
        end_time: new Date(formData.end_time).toISOString(),
      };

      const mutation = isEditing
        ? UPDATE_SCHEDULE_MUTATION
        : CREATE_SCHEDULE_MUTATION;

      const result = await client.mutate<CreateScheduleData | UpdateScheduleData>({
        mutation,
        variables: { input },
      });

      if (result.error) {
        throw result.error;
      }

      const payload = isEditing
        ? (result.data as UpdateScheduleData | undefined)?.updateWorkerSchedule
        : (result.data as CreateScheduleData | undefined)?.createWorkerSchedule;

      if (!payload) {
        throw new Error('No response payload returned by schedule mutation');
      }

      setCollisions(payload.collisions || []);

      if (payload.collisions && payload.collisions.length > 0) {
        // Show warnings but allow submission
        console.warn(
          `${payload.collisions.length} scheduling conflicts detected`
        );
      }

      onSuccess(payload.schedule);
    } catch (error) {
      onError(error as Error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">
        {isEditing ? 'Edit Schedule' : 'Create Schedule'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Location *
          </label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            required
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., Site A, Office B"
          />
        </div>

        {/* Start Time */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Start Time *
          </label>
          <input
            type="datetime-local"
            name="start_time"
            value={formData.start_time}
            onChange={handleChange}
            required
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* End Time */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            End Time *
          </label>
          <input
            type="datetime-local"
            name="end_time"
            value={formData.end_time}
            onChange={handleChange}
            required
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Equipment */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Equipment
          </label>
          <div className="mt-2 space-y-2">
            {formData.equipment_ids.map((id) => (
              <div
                key={id}
                className="flex items-center justify-between bg-blue-50 p-2 rounded"
              >
                <span className="text-sm">{id}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveEquipment(id)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Tentative */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="is_tentative"
            name="is_tentative"
            checked={formData.is_tentative}
            onChange={handleChange}
            className="h-4 w-4 text-blue-600 rounded"
          />
          <label htmlFor="is_tentative" className="ml-2 text-sm text-gray-700">
            Tentative (draft, not confirmed)
          </label>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Notes
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-transparent"
            placeholder="Add any notes about this schedule..."
          />
        </div>

        {/* Collisions Warning */}
        {collisions.length > 0 && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <h3 className="text-sm font-medium text-yellow-800">
              ⚠️ {collisions.length} Scheduling Conflict
              {collisions.length !== 1 ? 's' : ''} Detected
            </h3>
            <ul className="mt-2 space-y-1">
              {collisions.map((collision, idx) => (
                <li key={idx} className="text-sm text-yellow-700">
                  <strong>{collision.collision_type}</strong> (
                  {collision.severity}) - {collision.overlap_minutes} minutes
                  overlap
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            {loading ? 'Saving...' : isEditing ? 'Update Schedule' : 'Create Schedule'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default WorkerScheduleForm;
