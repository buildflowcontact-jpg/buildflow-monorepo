// Schedule Resolvers - GraphQL mutation and query handlers
// Integrates collision detection into the GraphQL API

import { SupabaseClient } from '@supabase/supabase-js';
import { CollisionDetectionService } from '../services/collisionDetection.service';
import {
  scheduleTypeDefs,
  CreateScheduleInputSchema,
  UpdateScheduleInputSchema,
  ResolveCollisionInputSchema,
  CreateSchedulePayload,
} from '../types/schedule.types';

export class ScheduleResolver {
  private collisionService: CollisionDetectionService;

  constructor(private supabase: SupabaseClient) {
    this.collisionService = new CollisionDetectionService(supabase);
  }

  /**
   * Query: Get single worker schedule
   */
  async getWorkerSchedule(
    _: any,
    { id }: { id: string },
    context: any
  ): Promise<any> {
    if (!context.userId) {
      throw new Error('Unauthorized');
    }

    const { data, error } = await this.supabase
      .from('worker_schedules')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Schedule not found: ${error.message}`);
    }

    // Check access via RLS
    if (!data) {
      throw new Error('Schedule not found');
    }

    return data;
  }

  /**
   * Query: List schedules for a project within date range
   */
  async listProjectSchedules(
    _: any,
    {
      project_id,
      start_date,
      end_date,
    }: { project_id: string; start_date: Date; end_date: Date },
    context: any
  ): Promise<any[]> {
    if (!context.userId) {
      throw new Error('Unauthorized');
    }

    const { data, error } = await this.supabase
      .from('worker_schedules')
      .select('*')
      .eq('project_id', project_id)
      .gte('end_time', start_date.toISOString())
      .lte('start_time', end_date.toISOString())
      .order('start_time', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch schedules: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Query: List schedules for a specific user in a project
   */
  async listUserSchedules(
    _: any,
    { user_id, project_id }: { user_id: string; project_id: string },
    context: any
  ): Promise<any[]> {
    if (!context.userId) {
      throw new Error('Unauthorized');
    }

    const { data, error } = await this.supabase
      .from('worker_schedules')
      .select('*')
      .eq('worker_id', user_id)
      .eq('project_id', project_id)
      .order('start_time', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch user schedules: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Query: List collisions for a project
   */
  async listCollisions(
    _: any,
    { project_id, resolved }: { project_id: string; resolved?: boolean },
    context: any
  ): Promise<any[]> {
    if (!context.userId) {
      throw new Error('Unauthorized');
    }

    try {
      const collisions = await this.collisionService.getProjectCollisions(
        project_id,
        resolved !== undefined ? !resolved : true
      );
      return collisions;
    } catch (error) {
      throw new Error(
        `Failed to fetch collisions: ${(error as Error).message}`
      );
    }
  }

  /**
   * Query: Get worker conflicts
   */
  async getWorkerConflicts(
    _: any,
    { worker_id, project_id }: { worker_id: string; project_id: string },
    context: any
  ): Promise<any[]> {
    if (!context.userId) {
      throw new Error('Unauthorized');
    }

    try {
      const conflicts = await this.collisionService.getWorkerConflicts(
        worker_id,
        project_id
      );
      return conflicts;
    } catch (error) {
      throw new Error(`Failed to fetch conflicts: ${(error as Error).message}`);
    }
  }

  /**
   * Query: Get collision alerts for current user
   */
  async getCollisionAlerts(
    _: any,
    { limit = 50 }: { limit?: number },
    context: any
  ): Promise<any[]> {
    if (!context.userId) {
      throw new Error('Unauthorized');
    }

    const { data, error } = await this.supabase
      .from('collision_alerts')
      .select(
        `
        id,
        collision_id,
        recipient_id,
        acknowledged_at,
        dismissal_reason,
        created_at,
        schedule_collisions:collision_id(*)
      `
      )
      .eq('recipient_id', context.userId)
      .is('acknowledged_at', null)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch alerts: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Mutation: Create a new worker schedule with collision detection
   */
  async createWorkerSchedule(
    _: any,
    { input }: { input: any },
    context: any
  ): Promise<CreateSchedulePayload> {
    if (!context.userId) {
      throw new Error('Unauthorized');
    }

    // Validate input
    const validatedInput = CreateScheduleInputSchema.parse(input);

    // Check user can create schedule in this project
    const { data: member } = await this.supabase
      .from('project_members')
      .select('role')
      .eq('project_id', validatedInput.project_id)
      .eq('user_id', context.userId)
      .single();

    if (!member) {
      throw new Error('Unauthorized: Not a member of this project');
    }

    // If user is not manager, can only create for themselves
    if (
      member.role !== 'owner' &&
      member.role !== 'manager' &&
      validatedInput.worker_id !== context.userId
    ) {
      throw new Error('Unauthorized: Can only create schedules for yourself');
    }

    // Insert the schedule
    const scheduleData = {
      ...validatedInput,
      created_by: context.userId,
      start_time: new Date(validatedInput.start_time).toISOString(),
      end_time: new Date(validatedInput.end_time).toISOString(),
    };

    const { data: schedule, error: insertError } = await this.supabase
      .from('worker_schedules')
      .insert([scheduleData])
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to create schedule: ${insertError.message}`);
    }

    // Detect collisions
    let collisions: any[] = [];
    let alertsCreated = 0;

    try {
      const detectedCollisions =
        await this.collisionService.detectCollisions(schedule);

      if (detectedCollisions.length > 0) {
        collisions = await this.collisionService.recordCollisions(
          schedule.id,
          detectedCollisions
        );
        alertsCreated = collisions.length * 2; // Rough estimate for now
      }
    } catch (error) {
      console.error('Collision detection failed:', error);
      // Don't fail the mutation, collision detection is non-critical
    }

    return {
      schedule,
      collisions,
      alerts_created: alertsCreated,
    };
  }

  /**
   * Mutation: Update a worker schedule with collision recalculation
   */
  async updateWorkerSchedule(
    _: any,
    { input }: { input: any },
    context: any
  ): Promise<CreateSchedulePayload> {
    if (!context.userId) {
      throw new Error('Unauthorized');
    }

    // Validate input
    const validatedInput = UpdateScheduleInputSchema.parse(input);

    // Get current schedule
    const { data: currentSchedule } = await this.supabase
      .from('worker_schedules')
      .select('*')
      .eq('id', validatedInput.id)
      .single();

    if (!currentSchedule) {
      throw new Error('Schedule not found');
    }

    // Check permissions
    if (
      currentSchedule.worker_id !== context.userId &&
      currentSchedule.created_by !== context.userId
    ) {
      throw new Error('Unauthorized: Can only update own schedules');
    }

    // Update the schedule
    const updateData: any = {};
    if (validatedInput.location) updateData.location = validatedInput.location;
    if (validatedInput.start_time)
      updateData.start_time = new Date(
        validatedInput.start_time
      ).toISOString();
    if (validatedInput.end_time)
      updateData.end_time = new Date(validatedInput.end_time).toISOString();
    if (validatedInput.equipment_ids)
      updateData.equipment_ids = validatedInput.equipment_ids;
    if (validatedInput.is_tentative !== undefined)
      updateData.is_tentative = validatedInput.is_tentative;
    if (validatedInput.notes !== undefined)
      updateData.notes = validatedInput.notes;

    updateData.updated_at = new Date().toISOString();

    const { data: schedule, error: updateError } = await this.supabase
      .from('worker_schedules')
      .update(updateData)
      .eq('id', validatedInput.id)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update schedule: ${updateError.message}`);
    }

    // Re-detect collisions (delete old, create new)
    await this.supabase
      .from('schedule_collisions')
      .delete()
      .or(
        `primary_schedule_id.eq.${validatedInput.id},conflicting_schedule_id.eq.${validatedInput.id}`
      );

    // Detect new collisions
    let collisions: any[] = [];
    let alertsCreated = 0;

    try {
      const detectedCollisions =
        await this.collisionService.detectCollisions(schedule);

      if (detectedCollisions.length > 0) {
        collisions = await this.collisionService.recordCollisions(
          schedule.id,
          detectedCollisions
        );
        alertsCreated = collisions.length * 2;
      }
    } catch (error) {
      console.error('Collision detection failed:', error);
    }

    return {
      schedule,
      collisions,
      alerts_created: alertsCreated,
    };
  }

  /**
   * Mutation: Delete a schedule
   */
  async deleteWorkerSchedule(
    _: any,
    { id }: { id: string },
    context: any
  ): Promise<boolean> {
    if (!context.userId) {
      throw new Error('Unauthorized');
    }

    // Get schedule to check permissions
    const { data: schedule } = await this.supabase
      .from('worker_schedules')
      .select('*')
      .eq('id', id)
      .single();

    if (!schedule) {
      throw new Error('Schedule not found');
    }

    if (
      schedule.worker_id !== context.userId &&
      schedule.created_by !== context.userId
    ) {
      throw new Error('Unauthorized');
    }

    const { error } = await this.supabase
      .from('worker_schedules')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete schedule: ${error.message}`);
    }

    return true;
  }

  /**
   * Mutation: Resolve a collision
   */
  async resolveCollision(
    _: any,
    { collision_id, resolution_notes }: any,
    context: any
  ): Promise<any> {
    if (!context.userId) {
      throw new Error('Unauthorized');
    }

    // Validate input
    const validatedInput = ResolveCollisionInputSchema.parse({
      collision_id,
      resolution_notes,
    });

    try {
      const resolved =
        await this.collisionService.resolveCollision(
          validatedInput.collision_id,
          validatedInput.resolution_notes
        );
      return resolved;
    } catch (error) {
      throw new Error(
        `Failed to resolve collision: ${(error as Error).message}`
      );
    }
  }

  /**
   * Mutation: Acknowledge an alert
   */
  async acknowledgeAlert(
    _: any,
    { alert_id }: { alert_id: string },
    context: any
  ): Promise<any> {
    if (!context.userId) {
      throw new Error('Unauthorized');
    }

    // Verify alert belongs to user
    const { data: alert } = await this.supabase
      .from('collision_alerts')
      .select('*')
      .eq('id', alert_id)
      .eq('recipient_id', context.userId)
      .single();

    if (!alert) {
      throw new Error('Alert not found');
    }

    const { data, error } = await this.supabase
      .from('collision_alerts')
      .update({ acknowledged_at: new Date().toISOString() })
      .eq('id', alert_id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to acknowledge alert: ${error.message}`);
    }

    return data;
  }
}

// Export resolver map for Apollo
export function createScheduleResolvers(supabase: SupabaseClient) {
  const resolver = new ScheduleResolver(supabase);

  return {
    Query: {
      getWorkerSchedule: (_: unknown, args: { id: string }, context: any) =>
        resolver.getWorkerSchedule(_, args, context),
      listProjectSchedules: (
        _: unknown,
        args: { project_id: string; start_date: Date; end_date: Date },
        context: any
      ) =>
        resolver.listProjectSchedules(_, args, context),
      listUserSchedules: (
        _: unknown,
        args: { user_id: string; project_id: string },
        context: any
      ) =>
        resolver.listUserSchedules(_, args, context),
      listCollisions: (
        _: unknown,
        args: { project_id: string; resolved?: boolean },
        context: any
      ) =>
        resolver.listCollisions(_, args, context),
      getWorkerConflicts: (
        _: unknown,
        args: { worker_id: string; project_id: string },
        context: any
      ) =>
        resolver.getWorkerConflicts(_, args, context),
      getCollisionAlerts: (_: unknown, args: { limit?: number }, context: any) =>
        resolver.getCollisionAlerts(_, args, context),
    },
    Mutation: {
      createWorkerSchedule: (_: unknown, args: { input: any }, context: any) =>
        resolver.createWorkerSchedule(_, args, context),
      updateWorkerSchedule: (_: unknown, args: { input: any }, context: any) =>
        resolver.updateWorkerSchedule(_, args, context),
      deleteWorkerSchedule: (_: unknown, args: { id: string }, context: any) =>
        resolver.deleteWorkerSchedule(_, args, context),
      resolveCollision: (
        _: unknown,
        args: { collision_id: string; resolution_notes: string },
        context: any
      ) =>
        resolver.resolveCollision(_, args, context),
      acknowledgeAlert: (_: unknown, args: { alert_id: string }, context: any) =>
        resolver.acknowledgeAlert(_, args, context),
    },
  };
}

export { scheduleTypeDefs };
