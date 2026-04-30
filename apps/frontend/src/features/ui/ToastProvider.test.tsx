import React from 'react';
import { render, screen } from '@testing-library/react';
import { ToastProvider, useToast } from './ToastProvider';

describe('ToastProvider', () => {
  it('affiche un toast', () => {
    function TestComponent() {
      const { showToast } = useToast();
      React.useEffect(() => {
        showToast('Ceci est un toast');
      }, [showToast]);
      return <div>Test</div>;
    }
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
    expect(screen.getByText(/Ceci est un toast/i)).toBeInTheDocument();
  });
});
