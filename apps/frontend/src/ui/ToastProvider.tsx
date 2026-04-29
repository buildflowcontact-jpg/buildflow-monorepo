import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext<any>(null);

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Array<{ id: number; message: string; type: 'success' | 'error' }>>([]);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts(ts => [...ts, { id, message, type }]);
    setTimeout(() => setToasts(ts => ts.filter(t => t.id !== id)), 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50 flex flex-col gap-2 items-center">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`px-4 py-2 rounded shadow text-white font-bold ${t.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}
            style={{ minWidth: 200, textAlign: 'center' }}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
