import React, { useState } from 'react';
import { useNotifications, useSubscribeNotifications } from '../hooks/useNotifications';
import { NotificationCenter } from './NotificationCenter';

interface NotificationBellProps {
  projectId: string;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ projectId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { data: notifications = [] } = useNotifications(projectId);
  useSubscribeNotifications(projectId);

  const unreadCount = notifications.filter((notification) => !notification.is_read).length;
  const criticalCount = notifications.filter((notification) => notification.priority === 'critical').length;
  const notificationCount = unreadCount;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Notifications"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {notificationCount > 0 && (
          <span className={`absolute top-0 right-0 w-5 h-5 text-white text-xs font-bold rounded-full flex items-center justify-center ${criticalCount > 0 ? 'bg-red-600' : 'bg-amber-500'}`}>
            {notificationCount > 9 ? '9+' : notificationCount}
          </span>
        )}
      </button>
      {isOpen && <NotificationCenter projectId={projectId} onClose={() => setIsOpen(false)} />}
    </>
  );
};
