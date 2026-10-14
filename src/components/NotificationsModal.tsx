import React from 'react';
import { X, Bell, CheckCheck, Package, Store, Tag, Sparkles } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateOrder?: (orderId: string) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  onNavigateOrder,
}) => {
  if (!isOpen) return null;

  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fadeIn">
      <div onClick={onClose} className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs" />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-sm bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-orange-600 text-white flex items-center justify-center font-bold">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Notifications</h3>
                <p className="text-[11px] text-slate-500">{unreadCount} unread alerts</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark All</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-200/70 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {notifications.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <Bell className="w-10 h-10 mb-2 opacity-40" />
                <p className="text-xs font-semibold text-slate-600">No notifications yet</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  You'll be alerted whenever your orders are confirmed, dispatched, or delivered.
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => {
                    if (!n.read) markAsRead(n.id);
                  }}
                  className={`p-3 rounded-2xl border text-xs transition cursor-pointer ${
                    n.read
                      ? 'bg-white border-slate-200/70 opacity-80'
                      : 'bg-blue-50/50 border-blue-200 shadow-xs ring-1 ring-blue-100'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-white ${
                        n.type === 'order'
                          ? 'bg-blue-600'
                          : n.type === 'seller'
                          ? 'bg-emerald-600'
                          : n.type === 'promo'
                          ? 'bg-orange-600'
                          : 'bg-slate-700'
                      }`}
                    >
                      {n.type === 'order' && <Package className="w-3.5 h-3.5" />}
                      {n.type === 'seller' && <Store className="w-3.5 h-3.5" />}
                      {n.type === 'promo' && <Tag className="w-3.5 h-3.5" />}
                      {n.type === 'system' && <Sparkles className="w-3.5 h-3.5" />}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-bold text-slate-900 line-clamp-1">{n.title}</span>
                        {!n.read && (
                          <span className="w-2 h-2 rounded-full bg-orange-600 shrink-0" />
                        )}
                      </div>
                      <p className="text-slate-600 leading-relaxed text-[11px]">{n.message}</p>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
