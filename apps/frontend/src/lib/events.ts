import { supabase } from './supabase';

export type AppEvent =
  | { type: 'INCIDENT_CREATED'; payload: { eventId: string; projectId: string; documentId?: string; zoneId?: string } }
  | { type: 'DOCUMENT_APPROVED'; payload: { documentId: string; revisionId: string; projectId: string } }
  | { type: 'TASK_COMPLETED'; payload: { taskId: string; projectId: string } }
  | { type: 'DELIVERY_RECEIVED'; payload: { eventId: string; projectId: string } };

export async function emit(event: AppEvent): Promise<void> {
  switch (event.type) {
    case 'INCIDENT_CREATED':
      await handleIncidentCreated(event.payload);
      break;
    case 'DOCUMENT_APPROVED':
      await handleDocumentApproved(event.payload);
      break;
    case 'TASK_COMPLETED':
      await handleTaskCompleted(event.payload);
      break;
  }
}

async function handleIncidentCreated(payload: { eventId: string; projectId: string; documentId?: string; zoneId?: string }) {
  if (payload.documentId) {
    await supabase
      .from('documents')
      .update({ metadata: { has_active_incident: true } })
      .eq('id', payload.documentId);
  }
  await createNotification({
    project_id: payload.projectId,
    type: 'incident_created',
    target_role: 'be',
    reference_id: payload.eventId
  });
}

async function handleDocumentApproved(payload: { documentId: string; revisionId: string; projectId: string }) {
  await createNotification({
    project_id: payload.projectId,
    type: 'bpe_updated',
    target_role: 'chantier',
    reference_id: payload.documentId
  });
}

async function handleTaskCompleted(payload: { taskId: string; projectId: string }) {
  await recalculateProjectProgress(payload.projectId);
}

async function createNotification(data: {
  project_id: string;
  type: string;
  target_role: string;
  reference_id: string;
}) {
  await supabase.from('notifications').insert(data);
}

async function recalculateProjectProgress(projectId: string) {
  const { data: tasks } = await supabase
    .from('tasks')
    .select('status')
    .eq('project_id', projectId);
  if (!tasks) return;
  const done = tasks.filter((t: any) => t.status === 'done').length;
  const pct = Math.round((done / tasks.length) * 100);
  await supabase
    .from('projects')
    .update({ completion_pct: pct })
    .eq('id', projectId);
}
