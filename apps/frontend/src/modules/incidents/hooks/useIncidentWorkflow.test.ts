import { useIncidentWorkflow } from '../hooks/useIncidentWorkflow';

// Test du hook pure logic (pas de composant)
describe('useIncidentWorkflow', () => {
  const { transition, availableActions } = useIncidentWorkflow();

  it('retourne la bonne transition pour submitted → review', () => {
    expect(transition('submitted', 'review')).toBe('under_review_site_manager');
  });

  it('retourne undefined pour une transition invalide', () => {
    expect(transition('submitted', 'resolve')).toBeUndefined();
  });

  it('retourne les actions disponibles pour in_progress', () => {
    const actions = availableActions('in_progress');
    expect(actions).toContain('resolve');
    expect(actions).toContain('reject');
  });

  it('retourne close comme action disponible pour resolved', () => {
    const actions = availableActions('resolved');
    expect(actions).toContain('close');
  });

  it('retourne closed après transition resolved → close', () => {
    expect(transition('resolved', 'close')).toBe('closed');
  });

  it('retourne [] pour closed (état terminal)', () => {
    expect(availableActions('closed' as any)).toHaveLength(0);
  });
});
