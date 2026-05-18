// Collision Detection Service
// Real-time schedule conflict detection with multi-criteria analysis

import { SupabaseClient } from '@supabase/supabase-js';

export interface WorkerSchedule {
  id: string;
  project_id: string;
  worker_id: string;
  location: string;
  start_time: string;
  end_time: string;
  equipment_ids: string[];
  is_tentative: boolean;
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ScheduleCollision {
  id: string;
  primary_schedule_id: string;
  conflicting_schedule_id: string;
  collision_type: 'LOCATION_OVERLAP' | 'EQUIPMENT_CONFLICT' | 'TEAM_CONFLICT';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  overlap_minutes: number;
  suggested_resolution?: string;
  resolved_at?: string;
  resolution_notes?: string;
}

export interface DetectedCollision {
  collision_type: 'LOCATION_OVERLAP' | 'EQUIPMENT_CONFLICT' | 'TEAM_CONFLICT';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  conflicting_schedule: WorkerSchedule;
  overlap_minutes: number;
  equipment_conflict?: string[];
}

/**
 * Collision Detection Service
 * Detects scheduling conflicts based on:
 * - Location overlaps (same place, same time)
 * - Equipment conflicts (same equipment, same time)
 * - Team conflicts (same team, same time in different locations)
 */
export class CollisionDetectionService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Calculate overlap in minutes between two time ranges
   */
  private calculateOverlapMinutes(
    start1: Date,
    end1: Date,
    start2: Date,
    end2: Date
  ): number {
    const overlapStart = Math.max(start1.getTime(), start2.getTime());
    const overlapEnd = Math.min(end1.getTime(), end2.getTime());

    if (overlapStart >= overlapEnd) {
      return 0;
    }

    return Math.round((overlapEnd - overlapStart) / (1000 * 60));
  }

  /**
   * Determine collision severity based on overlap duration
   */
  private calculateSeverity(
    overlapMinutes: number,
    collisionType: string
  ): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (collisionType === 'EQUIPMENT_CONFLICT') {
      return 'HIGH';
    }

    if (overlapMinutes > 120) {
      return 'CRITICAL';
    }
    if (overlapMinutes > 60) {
      return 'HIGH';
    }
    if (overlapMinutes > 30) {
      return 'MEDIUM';
    }
    return 'LOW';
  }

  /**
   * Detect collisions for a new or updated schedule
   */
  async detectCollisions(
    schedule: WorkerSchedule
  ): Promise<DetectedCollision[]> {
    const collisions: DetectedCollision[] = [];
    const startTime = new Date(schedule.start_time);
    const endTime = new Date(schedule.end_time);

    // Query: Get overlapping schedules in same project
    const { data: overlappingSchedules, error } = await this.supabase
      .from('worker_schedules')
      .select('*')
      .eq('project_id', schedule.project_id)
      .eq('is_tentative', false)
      .neq('id', schedule.id)
      .lt('start_time', endTime.toISOString())
      .gt('end_time', startTime.toISOString());

    if (error) {
      console.error('Error fetching overlapping schedules:', error);
      throw error;
    }

    for (const existing of overlappingSchedules || []) {
      const existingStart = new Date(existing.start_time);
      const existingEnd = new Date(existing.end_time);
      const overlapMinutes = this.calculateOverlapMinutes(
        startTime,
        endTime,
        existingStart,
        existingEnd
      );

      // Check location conflict
      if (
        existing.location === schedule.location &&
        overlapMinutes > 0
      ) {
        collisions.push({
          collision_type: 'LOCATION_OVERLAP',
          severity: this.calculateSeverity(
            overlapMinutes,
            'LOCATION_OVERLAP'
          ),
          conflicting_schedule: existing,
          overlap_minutes: overlapMinutes,
        });
      }

      // Check equipment conflict
      const commonEquipment = (schedule.equipment_ids || []).filter((eq) =>
        (existing.equipment_ids || []).includes(eq)
      );

      if (commonEquipment.length > 0) {
        collisions.push({
          collision_type: 'EQUIPMENT_CONFLICT',
          severity: this.calculateSeverity(overlapMinutes, 'EQUIPMENT_CONFLICT'),
          conflicting_schedule: existing,
          overlap_minutes: overlapMinutes,
          equipment_conflict: commonEquipment,
        });
      }
    }

    return collisions;
  }

  /**
   * Create collision records in database
   */
  async recordCollisions(
    scheduleId: string,
    detectedCollisions: DetectedCollision[]
  ): Promise<ScheduleCollision[]> {
    if (detectedCollisions.length === 0) {
      return [];
    }

    const collisionRecords = detectedCollisions.map((collision) => ({
      primary_schedule_id: scheduleId,
      conflicting_schedule_id: collision.conflicting_schedule.id,
      collision_type: collision.collision_type,
      severity: collision.severity,
      overlap_minutes: collision.overlap_minutes,
      suggested_resolution: this.suggestResolution(collision),
    }));

    const { data, error } = await this.supabase
      .from('schedule_collisions')
      .upsert(collisionRecords, {
        onConflict:
          'primary_schedule_id,conflicting_schedule_id,collision_type',
      })
      .select();

    if (error) {
      console.error('Error recording collisions:', error);
      throw error;
    }

    // Create alerts for project managers
    if (data && data.length > 0) {
      await this.createAlerts(scheduleId, data);
    }

    return data || [];
  }

  /**
   * Generate suggested resolution for a collision
   */
  private suggestResolution(collision: DetectedCollision): string {
    if (collision.collision_type === 'LOCATION_OVERLAP') {
      return `Reschedule one worker to different time or location. Overlap: ${collision.overlap_minutes} minutes`;
    }

    if (collision.collision_type === 'EQUIPMENT_CONFLICT') {
      return `Equipment in conflict: ${collision.equipment_conflict?.join(', ')}. Use alternative equipment or reschedule.`;
    }

    return 'Resolve scheduling conflict between workers';
  }

  /**
   * Create alerts for relevant users (project managers)
   */
  private async createAlerts(
    scheduleId: string,
    collisions: ScheduleCollision[]
  ): Promise<void> {
    // Get the schedule to find project managers
    const { data: schedule } = await this.supabase
      .from('worker_schedules')
      .select('project_id')
      .eq('id', scheduleId)
      .single();

    if (!schedule) {
      return;
    }

    // Get project managers
    const { data: managers } = await this.supabase
      .from('project_members')
      .select('user_id')
      .eq('project_id', schedule.project_id)
      .in('role', ['owner', 'manager']);

    if (!managers || managers.length === 0) {
      return;
    }

    // Create alerts for each collision and each manager
    const alerts = collisions.flatMap((collision) =>
      managers.map((manager) => ({
        collision_id: collision.id,
        recipient_id: manager.user_id,
      }))
    );

    const { error } = await this.supabase
      .from('collision_alerts')
      .insert(alerts)
      .select();

    if (error) {
      console.error('Error creating collision alerts:', error);
      // Don't throw - alerts are nice-to-have, not critical
    }
  }

  /**
   * Get all unresolved collisions for a project
   */
  async getProjectCollisions(
    projectId: string,
    onlyUnresolved: boolean = true
  ): Promise<ScheduleCollision[]> {
    const { data: schedules, error: schedulesError } = await this.supabase
      .from('worker_schedules')
      .select('id')
      .eq('project_id', projectId);

    if (schedulesError) {
      console.error('Error fetching project schedules:', schedulesError);
      throw schedulesError;
    }

    const scheduleIds = (schedules || []).map((schedule) => schedule.id);
    if (scheduleIds.length === 0) {
      return [];
    }

    let query = this.supabase
      .from('schedule_collisions')
      .select(
        `
        *,
        primary_schedule:primary_schedule_id(id, worker_id, location, start_time, end_time),
        conflicting_schedule:conflicting_schedule_id(id, worker_id, location, start_time, end_time)
      `
      )
      .in('primary_schedule_id', scheduleIds);

    if (onlyUnresolved) {
      query = query.is('resolved_at', null);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching project collisions:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get worker's schedule conflicts
   */
  async getWorkerConflicts(
    workerId: string,
    projectId: string
  ): Promise<ScheduleCollision[]> {
    const { data: schedules, error: schedulesError } = await this.supabase
      .from('worker_schedules')
      .select('id')
      .eq('worker_id', workerId)
      .eq('project_id', projectId);

    if (schedulesError) {
      console.error('Error fetching worker schedules for conflicts:', schedulesError);
      throw schedulesError;
    }

    const scheduleIds = (schedules || []).map((schedule) => schedule.id);
    if (scheduleIds.length === 0) {
      return [];
    }

    const [primaryResult, conflictingResult] = await Promise.all([
      this.supabase
        .from('schedule_collisions')
        .select('*')
        .in('primary_schedule_id', scheduleIds)
        .is('resolved_at', null),
      this.supabase
        .from('schedule_collisions')
        .select('*')
        .in('conflicting_schedule_id', scheduleIds)
        .is('resolved_at', null),
    ]);

    if (primaryResult.error) {
      console.error('Error fetching primary worker conflicts:', primaryResult.error);
      throw primaryResult.error;
    }

    if (conflictingResult.error) {
      console.error('Error fetching secondary worker conflicts:', conflictingResult.error);
      throw conflictingResult.error;
    }

    const merged = [
      ...(primaryResult.data || []),
      ...(conflictingResult.data || []),
    ];

    const uniqueById = new Map(merged.map((collision) => [collision.id, collision]));
    return Array.from(uniqueById.values());
  }

  /**
   * Resolve a collision
   */
  async resolveCollision(
    collisionId: string,
    resolutionNotes: string
  ): Promise<ScheduleCollision> {
    const { data, error } = await this.supabase
      .from('schedule_collisions')
      .update({
        resolved_at: new Date().toISOString(),
        resolution_notes: resolutionNotes,
      })
      .eq('id', collisionId)
      .select()
      .single();

    if (error) {
      console.error('Error resolving collision:', error);
      throw error;
    }

    return data;
  }
}

export default CollisionDetectionService;
