// GraphQL Types and Resolvers for Scheduling
// Supports worker schedule management with real-time collision detection

export const scheduleTypeDefs = `#graphql
  enum CollisionType {
    LOCATION_OVERLAP
    EQUIPMENT_CONFLICT
    TEAM_CONFLICT
  }

  enum CollisionSeverity {
    LOW
    MEDIUM
    HIGH
    CRITICAL
  }

  type WorkerSchedule {
    id: ID!
    project_id: ID!
    worker_id: ID!
    location: String!
    start_time: DateTime!
    end_time: DateTime!
    equipment_ids: [ID!]!
    is_tentative: Boolean!
    notes: String
    created_by: ID!
    created_at: DateTime!
    updated_at: DateTime!
  }

  type ScheduleCollision {
    id: ID!
    primary_schedule_id: ID!
    conflicting_schedule_id: ID!
    collision_type: CollisionType!
    severity: CollisionSeverity!
    overlap_minutes: Int!
    suggested_resolution: String
    resolved_at: DateTime
    resolution_notes: String
    created_at: DateTime!
    updated_at: DateTime!
  }

  type CollisionAlert {
    id: ID!
    collision_id: ID!
    recipient_id: ID!
    acknowledged_at: DateTime
    dismissal_reason: String
    created_at: DateTime!
  }

  input CreateScheduleInput {
    project_id: ID!
    worker_id: ID!
    location: String!
    start_time: DateTime!
    end_time: DateTime!
    equipment_ids: [ID!]
    is_tentative: Boolean
    notes: String
  }

  input UpdateScheduleInput {
    id: ID!
    location: String
    start_time: DateTime
    end_time: DateTime
    equipment_ids: [ID!]
    is_tentative: Boolean
    notes: String
  }

  type CreateSchedulePayload {
    schedule: WorkerSchedule!
    collisions: [ScheduleCollision!]!
    alerts_created: Int!
  }

  type Query {
    getWorkerSchedule(id: ID!): WorkerSchedule
    listProjectSchedules(
      project_id: ID!
      start_date: DateTime!
      end_date: DateTime!
    ): [WorkerSchedule!]!
    listUserSchedules(
      user_id: ID!
      project_id: ID!
    ): [WorkerSchedule!]!
    listCollisions(
      project_id: ID!
      resolved: Boolean
    ): [ScheduleCollision!]!
    getWorkerConflicts(
      worker_id: ID!
      project_id: ID!
    ): [ScheduleCollision!]!
    getCollisionAlerts(limit: Int): [CollisionAlert!]!
  }

  type Mutation {
    createWorkerSchedule(input: CreateScheduleInput!): CreateSchedulePayload!
    updateWorkerSchedule(input: UpdateScheduleInput!): CreateSchedulePayload!
    deleteWorkerSchedule(id: ID!): Boolean!
    resolveCollision(
      collision_id: ID!
      resolution_notes: String!
    ): ScheduleCollision!
    acknowledgeAlert(alert_id: ID!): CollisionAlert!
  }

  type Subscription {
    onCollisionDetected(project_id: ID!): ScheduleCollision!
    onScheduleChanged(worker_id: ID!): WorkerSchedule!
  }
`;

// Type definitions for the database schema
export interface WorkerScheduleDB {
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

export interface ScheduleCollisionDB {
  id: string;
  primary_schedule_id: string;
  conflicting_schedule_id: string;
  collision_type: string;
  severity: string;
  overlap_minutes: number;
  suggested_resolution?: string;
  resolved_at?: string;
  resolution_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateScheduleInput {
  project_id: string;
  worker_id: string;
  location: string;
  start_time: Date;
  end_time: Date;
  equipment_ids?: string[];
  is_tentative?: boolean;
  notes?: string;
}

export interface UpdateScheduleInput {
  id: string;
  location?: string;
  start_time?: Date;
  end_time?: Date;
  equipment_ids?: string[];
  is_tentative?: boolean;
  notes?: string;
}

export interface CreateSchedulePayload {
  schedule: WorkerScheduleDB;
  collisions: ScheduleCollisionDB[];
  alerts_created: number;
}

// Zod validation schemas
import { z } from 'zod';

export const CreateScheduleInputSchema = z.object({
  project_id: z.string().uuid('Invalid project ID'),
  worker_id: z.string().uuid('Invalid worker ID'),
  location: z
    .string()
    .min(1, 'Location is required')
    .max(255, 'Location too long'),
  start_time: z.coerce.date().or(z.string().datetime()),
  end_time: z.coerce.date().or(z.string().datetime()),
  equipment_ids: z.array(z.string().uuid()).optional(),
  is_tentative: z.boolean().optional().default(false),
  notes: z.string().max(500).optional(),
});

export const UpdateScheduleInputSchema = z.object({
  id: z.string().uuid('Invalid schedule ID'),
  location: z.string().min(1).max(255).optional(),
  start_time: z.coerce.date().or(z.string().datetime()).optional(),
  end_time: z.coerce.date().or(z.string().datetime()).optional(),
  equipment_ids: z.array(z.string().uuid()).optional(),
  is_tentative: z.boolean().optional(),
  notes: z.string().max(500).optional(),
});

export const ResolveCollisionInputSchema = z.object({
  collision_id: z.string().uuid('Invalid collision ID'),
  resolution_notes: z
    .string()
    .min(10, 'Resolution notes must be at least 10 characters')
    .max(1000, 'Resolution notes too long'),
});
