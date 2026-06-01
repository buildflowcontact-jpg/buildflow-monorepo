import React from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

export function Tooltip({ content, children }: TooltipProps) {
  const [visible, setVisible] = React.useState(false);
  return (
    <span className="relative inline-block"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      tabIndex={0}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && (
        <span className="absolute z-50 left-1/2 -translate-x-1/2 mt-2 px-2 py-1 rounded bg-slate-800 text-white text-xs shadow-lg whitespace-nowrap">
          {content}
        </span>
      )}
    </span>
  );
}
