import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface BodyPortalProps {
  children: React.ReactNode;
}

export function BodyPortal({ children }: BodyPortalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  return createPortal(children, document.body);
}
