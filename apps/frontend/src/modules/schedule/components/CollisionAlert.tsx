// Collision Alert Component
// Real-time alerts for scheduling conflicts

import React, { useState } from 'react';
import { useApolloClient } from '@apollo/client/react';
import { gql } from '@apollo/client/core';

interface Collision {
  id: string;
  collision_type: 'LOCATION_OVERLAP' | 'EQUIPMENT_CONFLICT' | 'TEAM_CONFLICT';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  overlap_minutes: number;
  suggested_resolution?: string;
}

interface CollisionAlertProps {
  collision: Collision;
  onResolve: (collisionId: string, notes: string) => void;
  onDismiss: (collisionId: string) => void;
}

const RESOLVE_COLLISION_MUTATION = gql`
  mutation ResolveCollision(
    $collision_id: ID!
    $resolution_notes: String!
  ) {
    resolveCollision(
      collision_id: $collision_id
      resolution_notes: $resolution_notes
    ) {
      id
      resolved_at
      resolution_notes
    }
  }
`;

const getSeverityColor = (
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
): string => {
  switch (severity) {
    case 'LOW':
      return 'bg-blue-50 border-blue-200 text-blue-800';
    case 'MEDIUM':
      return 'bg-yellow-50 border-yellow-200 text-yellow-800';
    case 'HIGH':
      return 'bg-orange-50 border-orange-200 text-orange-800';
    case 'CRITICAL':
      return 'bg-red-50 border-red-200 text-red-800';
  }
};

const getSeverityBadgeColor = (severity: string): string => {
  switch (severity) {
    case 'LOW':
      return 'bg-blue-100 text-blue-800';
    case 'MEDIUM':
      return 'bg-yellow-100 text-yellow-800';
    case 'HIGH':
      return 'bg-orange-100 text-orange-800';
    case 'CRITICAL':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const CollisionAlert: React.FC<CollisionAlertProps> = ({
  collision,
  onResolve,
  onDismiss,
}) => {
  const client = useApolloClient();
  const [resolving, setResolving] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [showResolveForm, setShowResolveForm] = useState(false);

  const handleResolve = async () => {
    if (!resolutionNotes.trim()) {
      alert('Please provide resolution notes');
      return;
    }

    setResolving(true);
    try {
      const { data, errors } = await client.mutate({
        mutation: RESOLVE_COLLISION_MUTATION,
        variables: {
          collision_id: collision.id,
          resolution_notes: resolutionNotes,
        },
      });

      if (errors) {
        throw new Error(errors[0].message);
      }

      onResolve(collision.id, resolutionNotes);
      setShowResolveForm(false);
      setResolutionNotes('');
    } catch (error) {
      console.error('Failed to resolve collision:', error);
      alert('Failed to resolve collision');
    } finally {
      setResolving(false);
    }
  };

  const getCollisionTypeIcon = (type: string): string => {
    switch (type) {
      case 'LOCATION_OVERLAP':
        return '📍';
      case 'EQUIPMENT_CONFLICT':
        return '⚙️';
      case 'TEAM_CONFLICT':
        return '👥';
      default:
        return '⚠️';
    }
  };

  return (
    <div
      className={`border rounded-lg p-4 ${getSeverityColor(collision.severity)}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          {/* Icon */}
          <span className="text-2xl flex-shrink-0">
            {getCollisionTypeIcon(collision.collision_type)}
          </span>

          {/* Content */}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">
                {collision.collision_type.replace(/_/g, ' ')}
              </h3>
              <span
                className={`px-2 py-1 text-xs font-semibold rounded ${getSeverityBadgeColor(
                  collision.severity
                )}`}
              >
                {collision.severity}
              </span>
            </div>

            {/* Details */}
            <p className="text-sm mt-2">
              Overlap: <strong>{collision.overlap_minutes} minutes</strong>
            </p>

            {collision.suggested_resolution && (
              <p className="text-sm mt-1">
                💡 <em>{collision.suggested_resolution}</em>
              </p>
            )}

            {/* Resolution Form */}
            {showResolveForm && (
              <div className="mt-4 space-y-2">
                <textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Describe how this collision was resolved..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleResolve}
                    disabled={resolving || !resolutionNotes.trim()}
                    className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                  >
                    {resolving ? 'Marking...' : 'Mark Resolved'}
                  </button>
                  <button
                    onClick={() => {
                      setShowResolveForm(false);
                      setResolutionNotes('');
                    }}
                    className="px-3 py-1 text-sm bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 flex-shrink-0 ml-4">
          {!showResolveForm && (
            <>
              <button
                onClick={() => setShowResolveForm(true)}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Resolve
              </button>
              <button
                onClick={() => onDismiss(collision.id)}
                className="px-3 py-1 text-sm bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
              >
                ✕
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

interface CollisionListProps {
  collisions: Collision[];
  onResolve: (collisionId: string, notes: string) => void;
  onDismiss: (collisionId: string) => void;
  loading?: boolean;
}

export const CollisionList: React.FC<CollisionListProps> = ({
  collisions,
  onResolve,
  onDismiss,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 bg-gray-200 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (collisions.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        <p>✓ No scheduling conflicts detected</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-gray-900">
        Scheduling Conflicts ({collisions.length})
      </h2>
      {collisions.map((collision) => (
        <CollisionAlert
          key={collision.id}
          collision={collision}
          onResolve={onResolve}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  );
};

export default CollisionAlert;
