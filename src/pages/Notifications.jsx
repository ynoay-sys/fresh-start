import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Plus } from "lucide-react";
import NotificationItem from "../components/NotificationItem";
import AddReminderModal from "../components/AddReminderModal";

const FILTERS = [
  { key: "all", label: "הכל" },
  { key: "personal", label: "👤 אישי" },
  { key: "national", label: "🇮🇱 לאומי" },
  { key: "system", label: "⚙️ מערכת" },
];

const EMPTY_LABELS = {
  all: "אין התראות עדיין",
  personal: "אין התראות אישיות",
  national: "אין התראות לאומיות",
  system: "אין התראות מערכת",
};

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);

  async function load() {
    setError(false);
    setLoading(true);
    const user = await base44.auth.me();
    const results = await base44.entities.Notification.filter({ created_by: user.email }, "-created_date").catch(() => null);
    if (results === null) { setError(true); setLoading(false); return; }
    setNotifications(results);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleMarkAllRead() {
    const unread = notifications.filter(n => !n.is_read);
    await Promise.all(unread.map(n => base44.entities.Notification.update(n.id, { is_read: true })));
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  }

  async function handleNotifClick(notif) {
    if (!notif.is_read) {
      await base44.entities.Notification.update(notif.id, { is_read: true });
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
    }
    if (notif.action_url) navigate(notif.action_url);
  }

  const filtered = notifications
    .filter(n => filter === "all" || n.tier === filter)
    .sort((a, b) => new Date(b.scheduled_for || b.created_date) - new Date(a.scheduled_for || a.created_date));

  return (
    <div className="max-w-2xl mx-auto px-4 py-8" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">התראות</h1>
        <div className="flex items-center gap-2">
          <button onClick={handleMarkAllRead}
            className="text-sm font-medium px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700">
            סמן הכל כנקרא
          </button>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg text-white"
            style={{ backgroundColor: "#1E5FA8" }}>
            <Plus className="w-4 h-4" /> הוסף תזכורת
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-4 overflow-x-auto">
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${filter === f.key ? "border-blue-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}
            style={filter === f.key ? { borderColor: "#1E5FA8", color: "#1E5FA8" } : {}}>
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">⚠️</p>
          <p className="text-gray-600 font-medium mb-4">אירעה שגיאה בטעינת הנתונים</p>
          <button onClick={load} className="px-4 py-2 rounded-lg text-white text-sm font-medium" style={{ backgroundColor: "#1E5FA8" }}>נסה שוב</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <span className="text-5xl block mb-4">🔔</span>
          <p className="text-gray-500 font-medium">{EMPTY_LABELS[filter]}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden divide-y divide-gray-50">
          {filtered.map(n => (
            <NotificationItem key={n.id} notification={n} onClick={handleNotifClick} />
          ))}
        </div>
      )}

      {showModal && (
        <AddReminderModal
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); load(); }}
        />
      )}
    </div>
  );
}