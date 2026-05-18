// Collision Detection Service Tests

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import CollisionDetectionService from '../services/collisionDetection.service';
import type { WorkerScheduleDB as WorkerSchedule } from '../types/schedule.types';

// Mock Supabase client
const mockSupabase = {
  from: jest.fn(),
};

describe('CollisionDetectionService', () => {
  let service: CollisionDetectionService;
  let mockQuery: any;

  beforeEach(() => {
    service = new CollisionDetectionService(mockSupabase as any);
    mockQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      lt: jest.fn().mockReturnThis(),
      gt: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
      upsert: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
    };

    mockSupabase.from.mockReturnValue(mockQuery);
  });

  describe('detectCollisions', () => {
    it('should detect location overlap collisions', async () => {
      const newSchedule: WorkerSchedule = {
        id: 'schedule-1',
        project_id: 'project-1',
        worker_id: 'worker-1',
        location: 'Site A',
        start_time: '2026-05-20T09:00:00Z',
        end_time: '2026-05-20T17:00:00Z',
        equipment_ids: [],
        is_tentative: false,
        created_by: 'user-1',
        created_at: '2026-05-20T09:00:00Z',
        updated_at: '2026-05-20T09:00:00Z',
      };

      const existingSchedule: WorkerSchedule = {
        id: 'schedule-2',
        project_id: 'project-1',
        worker_id: 'worker-2',
        location: 'Site A',
        start_time: '2026-05-20T13:00:00Z',
        end_time: '2026-05-20T21:00:00Z',
        equipment_ids: [],
        is_tentative: false,
        created_by: 'user-2',
        created_at: '2026-05-20T13:00:00Z',
        updated_at: '2026-05-20T13:00:00Z',
      };

      mockQuery.gt.mockResolvedValue({
        data: [existingSchedule],
        error: null,
      });

      const collisions = await service.detectCollisions(newSchedule);

      expect(collisions).toHaveLength(1);
      expect(collisions[0]).toMatchObject({
        collision_type: 'LOCATION_OVERLAP',
        severity: 'CRITICAL',
        overlap_minutes: 240, // 4 hours
        conflicting_schedule: existingSchedule,
      });
    });

    it('should detect equipment conflict collisions', async () => {
      const equipment1 = '00000000-0000-0000-0000-000000000001';
      const equipment2 = '00000000-0000-0000-0000-000000000002';

      const newSchedule: WorkerSchedule = {
        id: 'schedule-1',
        project_id: 'project-1',
        worker_id: 'worker-1',
        location: 'Site A',
        start_time: '2026-05-20T09:00:00Z',
        end_time: '2026-05-20T17:00:00Z',
        equipment_ids: [equipment1, equipment2],
        is_tentative: false,
        created_by: 'user-1',
        created_at: '2026-05-20T09:00:00Z',
        updated_at: '2026-05-20T09:00:00Z',
      };

      const existingSchedule: WorkerSchedule = {
        id: 'schedule-2',
        project_id: 'project-1',
        worker_id: 'worker-2',
        location: 'Site B',
        start_time: '2026-05-20T13:00:00Z',
        end_time: '2026-05-20T21:00:00Z',
        equipment_ids: [equipment1], // Shares equipment1
        is_tentative: false,
        created_by: 'user-2',
        created_at: '2026-05-20T13:00:00Z',
        updated_at: '2026-05-20T13:00:00Z',
      };

      mockQuery.gt.mockResolvedValue({
        data: [existingSchedule],
        error: null,
      });

      const collisions = await service.detectCollisions(newSchedule);

      expect(collisions).toHaveLength(1);
      expect(collisions[0]).toMatchObject({
        collision_type: 'EQUIPMENT_CONFLICT',
        severity: 'HIGH',
        equipment_conflict: [equipment1],
      });
    });

    it('should not detect collisions for non-overlapping schedules', async () => {
      const newSchedule: WorkerSchedule = {
        id: 'schedule-1',
        project_id: 'project-1',
        worker_id: 'worker-1',
        location: 'Site A',
        start_time: '2026-05-20T09:00:00Z',
        end_time: '2026-05-20T12:00:00Z',
        equipment_ids: [],
        is_tentative: false,
        created_by: 'user-1',
        created_at: '2026-05-20T09:00:00Z',
        updated_at: '2026-05-20T09:00:00Z',
      };

      const existingSchedule: WorkerSchedule = {
        id: 'schedule-2',
        project_id: 'project-1',
        worker_id: 'worker-2',
        location: 'Site A',
        start_time: '2026-05-20T13:00:00Z',
        end_time: '2026-05-20T17:00:00Z',
        equipment_ids: [],
        is_tentative: false,
        created_by: 'user-2',
        created_at: '2026-05-20T13:00:00Z',
        updated_at: '2026-05-20T13:00:00Z',
      };

      mockQuery.gt.mockResolvedValue({
        data: [existingSchedule],
        error: null,
      });

      const collisions = await service.detectCollisions(newSchedule);

      expect(collisions).toHaveLength(0);
    });

    it('should calculate correct overlap minutes', async () => {
      const newSchedule: WorkerSchedule = {
        id: 'schedule-1',
        project_id: 'project-1',
        worker_id: 'worker-1',
        location: 'Site A',
        start_time: '2026-05-20T10:00:00Z',
        end_time: '2026-05-20T15:00:00Z',
        equipment_ids: [],
        is_tentative: false,
        created_by: 'user-1',
        created_at: '2026-05-20T09:00:00Z',
        updated_at: '2026-05-20T09:00:00Z',
      };

      const existingSchedule: WorkerSchedule = {
        id: 'schedule-2',
        project_id: 'project-1',
        worker_id: 'worker-2',
        location: 'Site A',
        start_time: '2026-05-20T12:00:00Z',
        end_time: '2026-05-20T18:00:00Z',
        equipment_ids: [],
        is_tentative: false,
        created_by: 'user-2',
        created_at: '2026-05-20T13:00:00Z',
        updated_at: '2026-05-20T13:00:00Z',
      };

      mockQuery.gt.mockResolvedValue({
        data: [existingSchedule],
        error: null,
      });

      const collisions = await service.detectCollisions(newSchedule);

      expect(collisions[0].overlap_minutes).toBe(180); // 3 hours = 180 minutes
    });

    it('should calculate severity based on overlap duration', async () => {
      // Test LOW severity (30 min overlap)
      const newSchedule: WorkerSchedule = {
        id: 'schedule-1',
        project_id: 'project-1',
        worker_id: 'worker-1',
        location: 'Site A',
        start_time: '2026-05-20T10:00:00Z',
        end_time: '2026-05-20T10:30:00Z',
        equipment_ids: [],
        is_tentative: false,
        created_by: 'user-1',
        created_at: '2026-05-20T09:00:00Z',
        updated_at: '2026-05-20T09:00:00Z',
      };

      const existingSchedule: WorkerSchedule = {
        id: 'schedule-2',
        project_id: 'project-1',
        worker_id: 'worker-2',
        location: 'Site A',
        start_time: '2026-05-20T10:15:00Z',
        end_time: '2026-05-20T11:00:00Z',
        equipment_ids: [],
        is_tentative: false,
        created_by: 'user-2',
        created_at: '2026-05-20T13:00:00Z',
        updated_at: '2026-05-20T13:00:00Z',
      };

      mockQuery.gt.mockResolvedValue({
        data: [existingSchedule],
        error: null,
      });

      const collisions = await service.detectCollisions(newSchedule);
      expect(collisions[0].severity).toBe('LOW');
    });

    it('should detect multiple collisions for one schedule', async () => {
      const newSchedule: WorkerSchedule = {
        id: 'schedule-1',
        project_id: 'project-1',
        worker_id: 'worker-1',
        location: 'Site A',
        start_time: '2026-05-20T09:00:00Z',
        end_time: '2026-05-20T17:00:00Z',
        equipment_ids: ['equipment-1'],
        is_tentative: false,
        created_by: 'user-1',
        created_at: '2026-05-20T09:00:00Z',
        updated_at: '2026-05-20T09:00:00Z',
      };

      const schedule2: WorkerSchedule = {
        id: 'schedule-2',
        project_id: 'project-1',
        worker_id: 'worker-2',
        location: 'Site A',
        start_time: '2026-05-20T13:00:00Z',
        end_time: '2026-05-20T18:00:00Z',
        equipment_ids: [],
        is_tentative: false,
        created_by: 'user-2',
        created_at: '2026-05-20T13:00:00Z',
        updated_at: '2026-05-20T13:00:00Z',
      };

      const schedule3: WorkerSchedule = {
        id: 'schedule-3',
        project_id: 'project-1',
        worker_id: 'worker-3',
        location: 'Site B',
        start_time: '2026-05-20T10:00:00Z',
        end_time: '2026-05-20T14:00:00Z',
        equipment_ids: ['equipment-1'],
        is_tentative: false,
        created_by: 'user-3',
        created_at: '2026-05-20T10:00:00Z',
        updated_at: '2026-05-20T10:00:00Z',
      };

      mockQuery.gt.mockResolvedValue({
        data: [schedule2, schedule3],
        error: null,
      });

      const collisions = await service.detectCollisions(newSchedule);

      expect(collisions).toHaveLength(2); // Location + Equipment conflicts
      expect(
        collisions.some((c) => c.collision_type === 'LOCATION_OVERLAP')
      ).toBe(true);
      expect(
        collisions.some((c) => c.collision_type === 'EQUIPMENT_CONFLICT')
      ).toBe(true);
    });
  });

  describe('recordCollisions', () => {
    it('should insert collision records to database', async () => {
      const collisionData = {
        primary_schedule_id: 'schedule-1',
        conflicting_schedule_id: 'schedule-2',
        collision_type: 'LOCATION_OVERLAP' as const,
        severity: 'HIGH' as const,
        overlap_minutes: 240,
        suggested_resolution: 'Reschedule one worker',
      };

      jest
        .spyOn(service as any, 'createAlerts')
        .mockResolvedValue(undefined);
      mockQuery.upsert.mockReturnValue(mockQuery);
      mockQuery.select.mockResolvedValue({
        data: [collisionData],
        error: null,
      });

      const result = await service.recordCollisions('schedule-1', [
        {
          collision_type: 'LOCATION_OVERLAP',
          severity: 'HIGH',
          conflicting_schedule: {} as any,
          overlap_minutes: 240,
        },
      ]);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject(collisionData);
    });
  });

  describe('resolveCollision', () => {
    it('should mark collision as resolved', async () => {
      const resolvedData = {
        id: 'collision-1',
        resolved_at: new Date().toISOString(),
        resolution_notes: 'Rescheduled worker to different time',
      };

      mockQuery.update.mockReturnValue(mockQuery);
      mockQuery.eq.mockReturnValue(mockQuery);
      mockQuery.select.mockReturnValue(mockQuery);
      mockQuery.single.mockResolvedValue({
        data: resolvedData,
        error: null,
      });

      const result = await service.resolveCollision(
        'collision-1',
        'Rescheduled worker to different time'
      );

      expect(result.resolved_at).toBeDefined();
      expect(result.resolution_notes).toBe(
        'Rescheduled worker to different time'
      );
    });
  });

  describe('getWorkerConflicts', () => {
    it('should return unique unresolved conflicts from primary and conflicting sides', async () => {
      const schedulesQuery: any = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };
      const primaryQuery: any = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        is: jest.fn(),
      };
      const conflictingQuery: any = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        is: jest.fn(),
      };

      (primaryQuery.is as any).mockResolvedValue({
        data: [
          { id: 'collision-1', primary_schedule_id: 'schedule-1' },
          { id: 'collision-2', primary_schedule_id: 'schedule-2' },
        ],
        error: null,
      });

      (conflictingQuery.is as any).mockResolvedValue({
        data: [
          { id: 'collision-2', conflicting_schedule_id: 'schedule-2' },
          { id: 'collision-3', conflicting_schedule_id: 'schedule-3' },
        ],
        error: null,
      });

      schedulesQuery.eq
        .mockReturnValueOnce(schedulesQuery)
        .mockResolvedValueOnce({
          data: [{ id: 'schedule-1' }, { id: 'schedule-2' }],
          error: null,
        });

      mockSupabase.from
        .mockImplementationOnce(() => schedulesQuery)
        .mockImplementationOnce(() => primaryQuery)
        .mockImplementationOnce(() => conflictingQuery);

      const result = await service.getWorkerConflicts('worker-1', 'project-1');

      expect(result).toHaveLength(3);
      expect(result.map((collision) => collision.id).sort()).toEqual([
        'collision-1',
        'collision-2',
        'collision-3',
      ]);
    });

    it('should return empty array when worker has no schedules in project', async () => {
      const schedulesQuery: any = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };

      schedulesQuery.eq
        .mockReturnValueOnce(schedulesQuery)
        .mockResolvedValueOnce({ data: [], error: null });

      mockSupabase.from.mockImplementationOnce(() => schedulesQuery);

      const result = await service.getWorkerConflicts('worker-1', 'project-1');

      expect(result).toEqual([]);
      expect(mockSupabase.from).toHaveBeenCalledTimes(1);
    });

    it('should throw when schedule lookup fails', async () => {
      const schedulesQuery: any = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };

      schedulesQuery.eq
        .mockReturnValueOnce(schedulesQuery)
        .mockResolvedValueOnce({
          data: null,
          error: new Error('database failure'),
        });

      mockSupabase.from.mockImplementationOnce(() => schedulesQuery);

      await expect(
        service.getWorkerConflicts('worker-1', 'project-1')
      ).rejects.toThrow('database failure');
    });
  });
});
