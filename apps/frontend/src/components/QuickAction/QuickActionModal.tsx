import React from 'react';
import { Button } from '@/components/ui/button';

// Placeholder component kept intentionally minimal until quick actions are wired.
// It compiles safely and avoids broken imports in inactive legacy code.
const QuickActionModal = () => {
  const [open, setOpen] = React.useState(false);

  return (
    <div>
      <Button type="button" variant="ghost" onClick={() => setOpen((value) => !value)}>
        {open ? 'Fermer les actions rapides' : 'Ouvrir les actions rapides'}
      </Button>
      {open ? (
        <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
          Module Quick Action en cours de refonte.
        </div>
      ) : null}
    </div>
  );
};

export default QuickActionModal;
