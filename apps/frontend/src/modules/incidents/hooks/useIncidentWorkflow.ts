// modules/incidents/hooks/useIncidentWorkflow.ts
// Définit les transitions de statut valides pour le workflow incidents.
import type { IncidentStatus, IncidentAction } from '../types';

type TransitionMap = Partial<Record<IncidentStatus, Partial<Record<IncidentAction, IncidentStatus>>>>;

const TRANSITIONS: TransitionMap = {
  submitted: {
    review: 'under_review_site_manager',
  },
  under_review_site_manager: {
    approve:      'approved_for_pm',
    reject:       'rejected',
    request_info: 'needs_more_info',
  },
  approved_for_pm: {
    start:  'in_progress',
    reject: 'rejected',
  },
  needs_more_info: {
    review: 'under_review_site_manager',
  },
  in_progress: {
    resolve: 'resolved',
    reject:  'rejected',
  },
};

export function useIncidentWorkflow() {
  /**
   * Retourne le prochain statut, ou undefined si la transition est invalide.
   */
  const transition = (
    status: IncidentStatus,
    action: IncidentAction
  ): IncidentStatus | undefined => {
    return TRANSITIONS[status]?.[action];
  };

  /**
   * Retourne les actions disponibles pour un statut donné.
   */
  const availableActions = (status: IncidentStatus): IncidentAction[] => {
    return Object.keys(TRANSITIONS[status] ?? {}) as IncidentAction[];
  };

  return { transition, availableActions };
}
