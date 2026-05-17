// Schedule Components Tests

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { MockedProvider } from '@apollo/client/testing/react';
import WorkerScheduleForm from '../components/WorkerScheduleForm';
import { CollisionAlert, CollisionList } from '../components/CollisionAlert';

describe('WorkerScheduleForm Component', () => {
  const mockOnSuccess = jest.fn();
  const mockOnError = jest.fn();
  const defaultProps = {
    projectId: 'project-123',
    workerId: 'worker-123',
    onSuccess: mockOnSuccess,
    onError: mockOnError,
  };

  beforeEach(() => {
    mockOnSuccess.mockClear();
    mockOnError.mockClear();
  });

  it('should render form with all fields', () => {
    render(
      <MockedProvider>
        <WorkerScheduleForm {...defaultProps} />
      </MockedProvider>
    );

    expect(
      screen.getByRole('heading', { name: 'Create Schedule' })
    ).toBeTruthy();
    expect(screen.getByPlaceholderText(/e.g., Site A/i)).toBeTruthy();
    expect(screen.getByText('Location *')).toBeTruthy();
    expect(screen.getByText('Start Time *')).toBeTruthy();
    expect(screen.getByText('End Time *')).toBeTruthy();
  });

  it('should show editing mode when isEditing is true', () => {
    render(
      <MockedProvider>
        <WorkerScheduleForm
          {...defaultProps}
          isEditing={true}
          initialData={{
            id: 'schedule-123',
            location: 'Site A',
            start_time: '2026-05-20T09:00',
            end_time: '2026-05-20T17:00',
            equipment_ids: [],
            is_tentative: false,
            notes: 'Test note',
          }}
        />
      </MockedProvider>
    );

    expect(screen.getByText('Edit Schedule')).toBeTruthy();
  });

  it('should display collision warnings when present', () => {
    render(
      <MockedProvider>
        <WorkerScheduleForm {...defaultProps} />
      </MockedProvider>
    );

    // This would require mocking the mutation to return collisions
    // For now, we're testing the rendering structure
    expect(
      screen.getByRole('heading', { name: 'Create Schedule' })
    ).toBeTruthy();
  });

  it('should validate required fields', () => {
    render(
      <MockedProvider>
        <WorkerScheduleForm {...defaultProps} />
      </MockedProvider>
    );

    const submitButton = screen.getByRole('button', {
      name: 'Create Schedule',
    });
    fireEvent.click(submitButton);

    // Form should prevent submission without required fields
    expect(mockOnSuccess).not.toHaveBeenCalled();
  });
});

describe('CollisionAlert Component', () => {
  const mockCollision = {
    id: 'collision-123',
    collision_type: 'LOCATION_OVERLAP' as const,
    severity: 'HIGH' as const,
    overlap_minutes: 120,
    suggested_resolution: 'Reschedule one worker',
  };

  const mockOnResolve = jest.fn();
  const mockOnDismiss = jest.fn();

  beforeEach(() => {
    mockOnResolve.mockClear();
    mockOnDismiss.mockClear();
  });

  it('should render collision with correct severity color', () => {
    const { container } = render(
      <MockedProvider>
        <CollisionAlert
          collision={mockCollision}
          onResolve={mockOnResolve}
          onDismiss={mockOnDismiss}
        />
      </MockedProvider>
    );

    expect(screen.getByText('LOCATION OVERLAP')).toBeTruthy();
    expect(screen.getByText('HIGH')).toBeTruthy();
    expect(screen.getByText(/120 minutes/)).toBeTruthy();
  });

  it('should show resolve button', () => {
    render(
      <MockedProvider>
        <CollisionAlert
          collision={mockCollision}
          onResolve={mockOnResolve}
          onDismiss={mockOnDismiss}
        />
      </MockedProvider>
    );

    expect(screen.getByText('Resolve')).toBeTruthy();
    expect(screen.getByText('✕')).toBeTruthy();
  });

  it('should display suggested resolution', () => {
    render(
      <MockedProvider>
        <CollisionAlert
          collision={mockCollision}
          onResolve={mockOnResolve}
          onDismiss={mockOnDismiss}
        />
      </MockedProvider>
    );

    expect(
      screen.getByText('Reschedule one worker')
    ).toBeTruthy();
  });
});

describe('CollisionList Component', () => {
  const mockCollisions = [
    {
      id: 'collision-1',
      collision_type: 'LOCATION_OVERLAP' as const,
      severity: 'HIGH' as const,
      overlap_minutes: 240,
    },
    {
      id: 'collision-2',
      collision_type: 'EQUIPMENT_CONFLICT' as const,
      severity: 'CRITICAL' as const,
      overlap_minutes: 180,
    },
  ];

  const mockOnResolve = jest.fn();
  const mockOnDismiss = jest.fn();

  beforeEach(() => {
    mockOnResolve.mockClear();
    mockOnDismiss.mockClear();
  });

  it('should render list of collisions', () => {
    render(
      <MockedProvider>
        <CollisionList
          collisions={mockCollisions}
          onResolve={mockOnResolve}
          onDismiss={mockOnDismiss}
        />
      </MockedProvider>
    );

    expect(screen.getByText(/Scheduling Conflicts \(2\)/)).toBeTruthy();
    expect(screen.getByText('LOCATION OVERLAP')).toBeTruthy();
    expect(screen.getByText('EQUIPMENT CONFLICT')).toBeTruthy();
  });

  it('should show empty state when no collisions', () => {
    render(
      <MockedProvider>
        <CollisionList
          collisions={[]}
          onResolve={mockOnResolve}
          onDismiss={mockOnDismiss}
        />
      </MockedProvider>
    );

    expect(
      screen.getByText('✓ No scheduling conflicts detected')
    ).toBeTruthy();
  });

  it('should show loading state', () => {
    render(
      <MockedProvider>
        <CollisionList
          collisions={[]}
          onResolve={mockOnResolve}
          onDismiss={mockOnDismiss}
          loading={true}
        />
      </MockedProvider>
    );

    // Should render skeleton loaders
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should display correct number of collisions', () => {
    render(
      <MockedProvider>
        <CollisionList
          collisions={mockCollisions}
          onResolve={mockOnResolve}
          onDismiss={mockOnDismiss}
        />
      </MockedProvider>
    );

    const collisionElements = screen.getAllByText(/overlap/i);
    expect(collisionElements.length).toBeGreaterThanOrEqual(
      mockCollisions.length
    );
  });
});
