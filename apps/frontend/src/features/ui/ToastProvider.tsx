import React, { createContext, useContext, useState } from 'react';

const ToastContext = createContext({
  showToast: (_msg: string, _type?: string) => {
    void _msg;
    void _type;
  },
});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => setToast(msg);
  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && <div>{toast}</div>}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
