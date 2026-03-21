import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import NotificationItem from "./NotificationItem";

export default function NotificationBellPanel({ notifications, onClose, onMarkAllRead, onNotifClick }) {
  const navigate = useNavigate();
  const latest = [...notifications].sort((a,b) => new Date(b.scheduled_for || b.created_date) - new Date(a.scheduled_for || a.created_date)).slice(0, 8);

  return (
    <>
      <div className="fixed inset-0 z-30" onClick={onClose} />
      <div className="absolute left-0 top-10 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 z-40 overflow-hidden" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <span className="font-bold text-gray-800 text-sm">התראות</span>
          <button onClick={onMarkAllRead} className="text-xs font-medium" style={{ color: "#1E5FA8" }}>
            סמן הכל כנקרא
          </button>
        </div>

        {/* Notification list */}
        <div className="overflow-y-auto max-h-80 divide-y divide-gray-50">
          {latest.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">אין התראות</p>
          ) : (
            latest.map(n => (
              <NotificationItem key={n.id} notification={n} compact onClick={notif => { onNotifClick(notif); onClose(); }} />
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-4 py-3">
          <button onClick={() => { navigate("/notifications"); onClose(); }}
            className="text-sm font-medium w-full text-center" style={{ color: "#1E5FA8" }}>
            ראה את כל ההתראות ←
          </button>
        </div>
      </div>
    </>
  );
}