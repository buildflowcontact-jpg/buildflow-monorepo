import React from 'react';
import {
  useGroupedNotifications,
  useDeleteNotification,
  useClearAllNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '../hooks/useNotifications';
import { motion, AnimatePresence } from 'framer-motion';
import { BodyPortal } from '@/components/ui/BodyPortal';

interface NotificationCenterProps {
  projectId: string;
  onClose: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ projectId, onClose }) => {
  const { data: notifications = [], groups, isLoading } = useGroupedNotifications(projectId);
  const deleteNotification = useDeleteNotification();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const clearAll = useClearAllNotifications();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-50 border-red-200 text-red-900';
      case 'high':
        return 'bg-amber-50 border-amber-200 text-amber-900';
      case 'low':
        return 'bg-slate-50 border-slate-200 text-slate-900';
      case 'medium':
      default:
        return 'bg-blue-50 border-blue-200 text-blue-900';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical':
        return '⚠';
      case 'high':
        return '⬆';
      case 'low':
        return '…';
      case 'medium':
      default:
        return 'ⓘ';
    }
  };

  const orderedGroups = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const;

  return (
    <BodyPortal>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-[1100] flex items-start justify-end"
        onClick={onClose}
      >
        <motion.div
          initial={{ x: 400 }}
          animate={{ x: 0 }}
          exit={{ x: 400 }}
          transition={{ duration: 0.22 }}
          className="h-full w-96 bg-white shadow-lg overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
            <p className="text-xs text-gray-600 mt-1">{notifications.length} notification{notifications.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        {/* Toolbar */}
        {notifications.length > 0 && (
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex gap-2">
            <button
              onClick={() => markAllRead.mutate(projectId)}
              disabled={markAllRead.isPending}
              className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
            >
              Tout marquer lu
            </button>
            <button
              onClick={() => clearAll.mutate(projectId)}
              disabled={clearAll.isPending}
              className="text-xs px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50"
            >
              Tout effacer
            </button>
          </div>
        )}

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              Chargement...
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 py-8">
              <div className="text-3xl mb-2">🔔</div>
              <p>Pas de notifications</p>
            </div>
          ) : (
            <AnimatePresence>
              {orderedGroups.map((groupKey) => (
                <div key={groupKey}>
                  {(groups[groupKey] ?? []).length > 0 && (
                    <div className="px-4 pt-4 pb-1 text-[11px] font-bold tracking-[0.18em] text-gray-500 uppercase">
                      {groupKey}
                    </div>
                  )}
                  {(groups[groupKey] ?? []).map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.15 }}
                      className="border-b border-gray-100 p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className={`p-3 rounded-lg border ${getPriorityColor(notification.priority)}`}>
                        <div className="flex items-start gap-3">
                          <div className="text-xl flex-shrink-0">{getPriorityIcon(notification.priority)}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-sm truncate">{notification.title}</h4>
                              {!notification.is_read && <span className="w-2 h-2 rounded-full bg-current opacity-70" />}
                            </div>
                            <p className="text-xs mt-1 opacity-90">Type: {notification.type}</p>
                            {notification.target_role && (
                              <p className="text-xs mt-1 opacity-90">Cible: {notification.target_role}</p>
                            )}
                            {notification.reference_id && (
                              <p className="text-xs mt-1 opacity-75 text-gray-600">Ref: {notification.reference_id}</p>
                            )}
                            <p className="text-xs mt-2 opacity-60">
                              {new Date(notification.created_at).toLocaleString('fr-FR')}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markRead.mutate({
                                notificationId: notification.id,
                                isRead: !notification.is_read,
                              });
                            }}
                            className="text-[11px] text-slate-500 hover:text-slate-800 flex-shrink-0"
                          >
                            {notification.is_read ? 'Marquer non lu' : 'Marquer lu'}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification.mutate(notification.id);
                            }}
                            className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ))}
            </AnimatePresence>
          )}
        </div>
        </motion.div>
      </motion.div>
    </BodyPortal>
  );
};
