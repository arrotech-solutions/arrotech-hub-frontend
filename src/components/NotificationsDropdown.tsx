import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Bell,
  Check,
  CheckCheck,
  CreditCard,
  Download,
  ExternalLink,
  Gift,
  Info,
  MessageSquare,
  RefreshCw,
  Settings,
  Shield,
  Star,
  Trash2,
  UserPlus,
  Workflow,
  Zap,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';
import { useWebSocket } from '../hooks/useWebSocket';
import { AppNotification } from '../types';

const NotificationsDropdown: React.FC = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { lastEvent } = useWebSocket();
  // Avoid re-applying the same WS event when the dropdown opens/closes
  const handledEventRef = useRef<string | null>(null);
  const isOpenRef = useRef(isOpen);
  isOpenRef.current = isOpen;

  useEffect(() => {
    fetchUnreadCount();
    // Poll fallback every 60s (live updates via WebSocket when connected)
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
      // Resync badge from server when opening (heals any optimistic drift)
      fetchUnreadCount();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!lastEvent || lastEvent.type !== 'notification.created') return;

    const incoming = lastEvent.data?.notification as AppNotification | undefined;
    const eventKey = incoming?.id
      ? `id:${incoming.id}`
      : `raw:${JSON.stringify(lastEvent.data ?? {})}`;

    // lastEvent stays sticky in useWebSocket — toggling UI must not re-count it
    if (handledEventRef.current === eventKey) return;
    handledEventRef.current = eventKey;

    if (!incoming?.id) {
      fetchUnreadCount();
      if (isOpenRef.current) fetchNotifications();
      return;
    }

    setNotifications((prev) => {
      if (prev.some((n) => n.id === incoming.id)) return prev;
      if (!incoming.is_read) {
        setUnreadCount((count) => count + 1);
      }
      return [incoming, ...prev].slice(0, 20);
    });
  }, [lastEvent]);

  const fetchUnreadCount = async () => {
    if (!localStorage.getItem('auth_token')) return;

    try {
      const response = await apiService.getUnreadNotificationCount();
      if (response.success) {
        setUnreadCount(response.data?.unread_count || 0);
      }
    } catch (error: any) {
      if (error?.response?.status === 401) {
        return;
      }
      console.error('Failed to fetch unread count:', error);
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await apiService.getNotifications(false, 10);
      if (response.success) {
        setNotifications(response.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await apiService.markNotificationAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await apiService.markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      await apiService.deleteNotification(notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const handleNotificationClick = (notification: AppNotification) => {
    if (!notification.is_read) {
      handleMarkAsRead(notification.id);
    }
    if (notification.action_url) {
      navigate(notification.action_url);
      setIsOpen(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    if (type.startsWith('payment') || type.startsWith('withdrawal') || type.startsWith('subscription') || type === 'order_received' || type === 'stk_result') {
      return <CreditCard className="w-4 h-4 text-emerald-500" />;
    }
    if (type.includes('password') || type.includes('email_changed') || type.includes('login') || type.includes('2fa') || type.includes('api_key') || type === 'suspicious_activity') {
      return <Shield className="w-4 h-4 text-red-500" />;
    }
    if (type.startsWith('workflow_run') || type === 'quota_exceeded') {
      return <Workflow className="w-4 h-4 text-indigo-500" />;
    }
    if (type.startsWith('agent_') || type === 'sla_breach') {
      return <AlertTriangle className="w-4 h-4 text-orange-500" />;
    }
    if (type.startsWith('connection_') || type === 'conversation_assigned') {
      return <MessageSquare className="w-4 h-4 text-sky-500" />;
    }
    switch (type) {
      case 'workflow_imported':
        return <Download className="w-4 h-4 text-green-500" />;
      case 'workflow_reviewed':
      case 'workflow_rated':
        return <Star className="w-4 h-4 text-yellow-500" />;
      case 'new_follower':
        return <UserPlus className="w-4 h-4 text-blue-500" />;
      case 'milestone_reached':
        return <Zap className="w-4 h-4 text-purple-500" />;
      case 'earnings_received':
        return <Gift className="w-4 h-4 text-pink-500" />;
      case 'system_announcement':
      case 'maintenance':
      default:
        return <Info className="w-4 h-4 text-gray-500 dark:text-slate-400" />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          <div className="fixed sm:absolute top-16 sm:top-auto right-4 sm:right-0 left-4 sm:left-auto sm:mt-2 w-auto sm:w-96 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-gray-200 dark:border-slate-700 z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700/80 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 flex items-center space-x-1"
                  >
                    <CheckCheck className="w-3 h-3" />
                    <span>Mark all read</span>
                  </button>
                )}
                <button
                  onClick={fetchNotifications}
                  className="p-1 text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-200"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {loading && notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                  <p>Loading...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-slate-400">
                  <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-slate-600" />
                  <p>No notifications yet</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`px-4 py-3 border-b border-gray-50 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/80 cursor-pointer transition-colors ${
                      !notification.is_read
                        ? 'bg-purple-50/50 dark:bg-purple-950/40'
                        : 'bg-transparent'
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.notification_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <p
                            className={`text-sm font-medium ${
                              !notification.is_read
                                ? 'text-gray-900 dark:text-white'
                                : 'text-gray-700 dark:text-slate-200'
                            }`}
                          >
                            {notification.title}
                          </p>
                          <div className="flex items-center space-x-1 ml-2">
                            {!notification.is_read && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkAsRead(notification.id);
                                }}
                                className="p-1 text-gray-400 dark:text-slate-500 hover:text-green-500"
                                title="Mark as read"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(notification.id);
                              }}
                              className="p-1 text-gray-400 dark:text-slate-500 hover:text-red-500"
                              title="Delete"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-slate-400 mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs text-gray-400 dark:text-slate-500">
                            {formatTimeAgo(notification.created_at)}
                          </span>
                          {notification.action_url && (
                            <ExternalLink className="w-3 h-3 text-gray-400 dark:text-slate-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="px-4 py-2 border-t border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-950/60 flex items-center justify-between">
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate('/settings?tab=notifications');
                }}
                className="text-sm text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white font-medium flex items-center gap-1"
              >
                <Settings className="w-3.5 h-3.5" />
                Notification settings
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationsDropdown;
