import { useState, useEffect } from "react";
import { formatDistanceToNow, isToday, isYesterday, format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import BusinessProgressMap from "../components/BusinessProgressMap";


function StatCard({ emoji, label, value, sub, onClick }) {
  return (
    <div onClick={onClick}
      className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col items-center cursor-pointer hover:shadow-md hover:border-gray-200 transition-all">
      <span className="text-3xl mb-2">{emoji}</span>
      <p className="text-4xl font-bold mb-1" style={{ color: "#1E5FA8" }}>{value ?? "—"}</p>
      {sub && <p className="text-xs text-gray-400 mb-0.5">{sub}</p>}
      <p className="text-sm text-gray-500 font-medium">{label}</p>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [docCount, setDocCount] = useState(null);
  const [contactCount, setContactCount] = useState(null);
  const [clientCount, setClientCount] = useState(null);
  const [stepsCompleted, setStepsCompleted] = useState(null);
  const [steps, setSteps] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [recentNotifs, setRecentNotifs] = useState([]);

  useEffect(() => {
    async function load() {
      const user = await base44.auth.me();
      const [docs, contacts, clients, completedSteps, allSteps] = await Promise.all([
        base44.entities.Document.filter({ created_by: user.email, status: "active" }),
        base44.entities.Contact.filter({ created_by: user.email }),
        base44.entities.Client.filter({ created_by: user.email }),
        base44.entities.BusinessOpeningStep.filter({ created_by: user.email, status: "completed" }),
        base44.entities.BusinessOpeningStep.filter({ created_by: user.email }),
      ]);
      setDocCount(docs.length);
      setContactCount(contacts.length);
      setClientCount(clients.length);
      setStepsCompleted(completedSteps.length);
      setSteps(allSteps);
      const eventsRes = await base44.entities.ScheduleEvent.filter({ created_by: user.email });
      const now = new Date();
      const upcoming = eventsRes
        .filter(e => isAfter(new Date(e.start_time), now))
        .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
        .slice(0, 5);
      setUpcomingEvents(upcoming);
      const notifsRes = await base44.entities.Notification.filter({ created_by: user.email });
      const unread = notifsRes.filter(n => !n.is_read)
        .sort((a,b) => new Date(b.scheduled_for || b.created_date) - new Date(a.scheduled_for || a.created_date))
        .slice(0, 3);
      setRecentNotifs(unread);
    }
    load();
  }, []);

  return (
    <div className="px-4 py-8 max-w-4xl mx-auto" dir="rtl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">שלום 👋</h1>
      <p className="text-sm text-gray-500 mb-8">ברוך הבא ל-Fresh Start — הפלטפורמה לעצמאים בישראל</p>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <StatCard emoji="📁" label="מסמכים" value={docCount} onClick={() => navigate("/documents")} />
        <StatCard emoji="🤝" label="לקוחות" value={clientCount} onClick={() => navigate("/clients")} />
        <StatCard emoji="👥" label="אנשי קשר" value={contactCount} onClick={() => navigate("/contacts")} />
        <StatCard emoji="✅" label="שלבי פתיחה" value={stepsCompleted != null ? `${stepsCompleted}/4` : "—"} onClick={() => navigate("/business-opening")} />
        <StatCard emoji="📈" label="התקדמות" value="←" onClick={() => navigate("/progress")} />
      </div>

      {/* Business Opening Widget */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-gray-800">מסע פתיחת העסק</h2>
        </div>
        <BusinessProgressMap steps={steps} mini={true} />
      </div>

      {/* Upcoming Events Widget */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-gray-800">אירועים קרובים</h2>
          <button onClick={() => navigate("/schedule")} className="text-xs font-medium" style={{ color: "#1E5FA8" }}>
            כל האירועים ←
          </button>
        </div>
        {upcomingEvents.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-gray-400 mb-3">אין אירועים קרובים. הוסף את האירוע הראשון שלך.</p>
            <button onClick={() => navigate("/schedule")}
              className="px-3 py-1.5 rounded-lg text-white text-xs font-medium" style={{ backgroundColor: "#1E5FA8" }}>
              + הוסף אירוע
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {upcomingEvents.map(ev => {
              const CAT_COLORS = { client:"#1E5FA8", delivery:"#C25A00", order:"#C25A00", milestone:"#5C1A8A", government:"#AA1111", personal:"#555555" };
              const CAT_LABELS = { client:"לקוח", delivery:"משלוח", order:"הזמנה", milestone:"אבן דרך", government:"ממשלתי", personal:"אישי" };
              const SOURCE_LABELS = { client:"לקוח", order:"הזמנה", milestone:"אבן דרך", manual:"ידני" };
              const color = CAT_COLORS[ev.category] || "#555";
              return (
                <div key={ev.id} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-gray-800 truncate block">{ev.title}</span>
                  </div>
                  <div className="text-xs text-gray-400 text-left flex-shrink-0">
                    {format(new Date(ev.start_time), "dd/MM")}{!ev.all_day ? ` | ${format(new Date(ev.start_time), "HH:mm")}` : ""}
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full text-white flex-shrink-0" style={{ backgroundColor: color }}>
                    {SOURCE_LABELS[ev.source_type] || "ידני"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Notifications Widget */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-gray-800">התראות אחרונות</h2>
          <button onClick={() => navigate("/notifications")} className="text-xs font-medium" style={{ color: "#1E5FA8" }}>כל ההתראות ←</button>
        </div>
        {recentNotifs.length === 0 ? (
          <p className="text-sm text-center text-green-600 py-3">אין התראות חדשות ✓</p>
        ) : (
          <div className="space-y-2">
            {recentNotifs.map(n => {
              const TIER_ICONS = { personal:"👤", national:"🇮🇱", system:"⚙️" };
              const d = n.scheduled_for || n.created_date;
              let timeLabel = d ? format(new Date(d), "dd/MM") : "";
              return (
                <div key={n.id} className="flex items-center gap-2.5" onClick={() => navigate("/notifications")} style={{cursor:"pointer"}}>
                  <span className="text-base">{TIER_ICONS[n.tier] || "🔔"}</span>
                  <span className="flex-1 text-sm font-medium text-gray-800 truncate">{n.title}</span>
                  <span className="text-xs text-gray-400">{timeLabel}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <h2 className="text-base font-semibold text-gray-800 mb-3">פעולות מהירות</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { emoji: "📄", label: "העלאת מסמך", path: "/documents/upload" },
          { emoji: "✍️", label: "צור חתימה", path: "/documents/sign/create" },
          { emoji: "👤", label: "הוסף איש קשר", path: "/contacts" },
          { emoji: "📁", label: "הארכיון שלי", path: "/documents" },
        ].map(({ emoji, label, path }) => (
          <button key={path} onClick={() => navigate(path)}
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col items-center gap-2 hover:shadow-md hover:border-gray-200 transition-all text-center">
            <span className="text-2xl">{emoji}</span>
            <span className="text-xs font-medium text-gray-700">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}