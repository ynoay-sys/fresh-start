import { useState, useEffect } from "react";
import { getEvents, clearEvents } from "../../lib/trackEvent";
import { format } from "date-fns";

function StatCard({ label, value, color = "#1E5FA8" }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
      <p className="text-3xl font-bold mb-1" style={{ color }}>{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}

const EVENT_COLORS = {
  document_uploaded: "#1E5FA8",
  document_signed: "#5C1A8A",
  template_completed: "#1A7A4A",
  payment_completed: "#C25A00",
  achievement_unlocked: "#B8860B",
  client_added: "#1E5FA8",
  contact_added: "#008080",
  order_created: "#C25A00",
  business_step_completed: "#1A7A4A",
  ai_query_sent: "#5C1A8A",
};

export default function AnalyticsDashboard() {
  const [events, setEvents] = useState([]);
  const [confirmClear, setConfirmClear] = useState(false);
  const [cleared, setCleared] = useState(false);

  useEffect(() => { setEvents(getEvents()); }, []);

  function handleExport() {
    const header = "timestamp,event,properties\n";
    const rows = events.map(e =>
      `"${e.timestamp}","${e.event}","${JSON.stringify(e.properties).replace(/"/g, '""')}"`
    ).join("\n");
    const blob = new Blob(["\uFEFF" + header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fresh-start-analytics-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleClear() {
    clearEvents();
    setEvents([]);
    setConfirmClear(false);
    setCleared(true);
    setTimeout(() => setCleared(false), 3000);
  }

  // Stats
  const uniqueModules = new Set(
    events.filter(e => e.event === "module_visited").map(e => e.properties?.module)
  ).size;
  const docUploaded = events.filter(e => e.event === "document_uploaded").length;
  const paymentsDone = events.filter(e => e.event === "payment_completed").length;

  // Top actions
  const counts = {};
  for (const e of events) counts[e.event] = (counts[e.event] || 0) + 1;
  const topActions = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  const maxCount = topActions[0]?.[1] || 1;

  const recent = [...events].reverse().slice(0, 20);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8" dir="rtl" style={{ fontFamily: 'Rubik, sans-serif' }}>
      <button onClick={() => window.history.back()} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#1E5FA8', cursor: 'pointer', fontSize: '14px', fontFamily: 'Rubik, sans-serif', padding: '8px 0', marginBottom: '16px' }}>
        <span>→</span><span>חזרה</span>
      </button>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">לוח אנליטיקה</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard label='סה"כ אירועים' value={events.length} />
        <StatCard label="מודולים שביקרתי" value={uniqueModules} color="#5C1A8A" />
        <StatCard label="מסמכים שהועלו" value={docUploaded} color="#1A7A4A" />
        <StatCard label="תשלומים" value={paymentsDone} color="#C25A00" />
      </div>

      {/* Top Actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h2 className="font-bold text-gray-800 mb-4">פעולות פופולריות</h2>
        {topActions.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">אין נתונים עדיין</p>
        ) : (
          <div className="space-y-3">
            {topActions.map(([name, count]) => (
              <div key={name} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-40 flex-shrink-0 truncate">{name}</span>
                <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${Math.round((count / maxCount) * 100)}%`, backgroundColor: EVENT_COLORS[name] || "#1E5FA8" }}
                  />
                </div>
                <span className="text-xs font-bold text-gray-700 w-8 text-left">{count}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Event Timeline */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h2 className="font-bold text-gray-800 mb-4">ציר זמן אירועים (20 אחרונים)</h2>
        {recent.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">אין אירועים עדיין</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-500">
                  <th className="text-right pb-2 pr-2">זמן</th>
                  <th className="text-right pb-2 pr-2">אירוע</th>
                  <th className="text-right pb-2">נתונים</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recent.map((e, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="py-2 pr-2 text-xs text-gray-400 whitespace-nowrap">
                      {e.timestamp ? format(new Date(e.timestamp), "dd/MM HH:mm") : "—"}
                    </td>
                    <td className="py-2 pr-2">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full text-white font-medium"
                        style={{ backgroundColor: EVENT_COLORS[e.event] || "#6B7280" }}
                      >{e.event}</span>
                    </td>
                    <td className="py-2 text-xs text-gray-400 font-mono max-w-[200px] truncate">
                      {JSON.stringify(e.properties)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Export / Clear */}
      <div className="flex flex-wrap gap-3 items-center">
        <button
          onClick={handleExport}
          className="px-4 py-2 rounded-lg text-white text-sm font-medium"
          style={{ backgroundColor: "#1E5FA8" }}
        >
          ייצא אירועים CSV 📊
        </button>
        {!confirmClear ? (
          <button
            onClick={() => setConfirmClear(true)}
            className="px-4 py-2 rounded-lg border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50"
          >
            נקה אירועים 🗑️
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm text-red-600 font-medium">האם אתה בטוח?</span>
            <button onClick={handleClear} className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm font-medium">כן, נקה</button>
            <button onClick={() => setConfirmClear(false)} className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-700">ביטול</button>
          </div>
        )}
        {cleared && <span className="text-sm text-green-600 font-medium">האירועים נוחו ✓</span>}
      </div>
    </div>
  );
}