import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Search, Plus, Edit, MessageCircle, Calendar } from "lucide-react";
import { format, isAfter } from "date-fns";
import ClientModal from "../components/ClientModal";
import ReminderModal from "../components/ReminderModal";
import MeetingModal from "../components/MeetingModal";
import ImportContactsModal from "../components/ImportContactsModal";
import { checkAndUnlockAchievements } from "../lib/achievements";

function SkeletonItem() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse flex items-center gap-4">
      <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-1/3" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
      </div>
    </div>
  );
}

function ClientCard({ client, upcomingMeeting, onEdit, onReminder, onMeeting }) {
  const initials = client.full_name?.split(" ").map(w => w[0]).slice(0, 2).join("") || "?";

  return (
    <div className="bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all p-5 flex items-start gap-4">
      {/* Avatar */}
      <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold flex-shrink-0"
        style={{ backgroundColor: "#1E5FA8" }}>
        {initials}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-gray-900 text-base break-words">{client.full_name}</p>
        {client.phone && (
          <a href={`tel:${client.phone}`} className="text-sm text-gray-500 hover:text-blue-600 block break-words">
            📞 {client.phone}
          </a>
        )}
        {client.email && (
          <a href={`mailto:${client.email}`} className="text-sm text-gray-500 hover:text-blue-600 block break-all">
            ✉️ {client.email}
          </a>
        )}
        {client.notes && (
          <p className="text-xs text-gray-400 mt-1 break-words">{client.notes.slice(0, 60)}{client.notes.length > 60 ? "..." : ""}</p>
        )}
        {upcomingMeeting && (
          <p className="text-xs mt-1.5 font-medium" style={{ color: "#1E5FA8" }}>
            📅 פגישה קרובה: {format(new Date(upcomingMeeting.start_time), "EEEE, dd/MM בשעה HH:mm")}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 flex-shrink-0">
        <button onClick={() => onReminder(client)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 whitespace-nowrap">
          <MessageCircle className="w-3.5 h-3.5" /> הודעה
        </button>
        <button onClick={() => onMeeting(client)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 whitespace-nowrap">
          <Calendar className="w-3.5 h-3.5" /> פגישה
        </button>
        <button onClick={() => onEdit(client)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 whitespace-nowrap">
          <Edit className="w-3.5 h-3.5" /> ערוך
        </button>
      </div>
    </div>
  );
}

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalClient, setModalClient] = useState(undefined); // undefined=closed, null=add
  const [reminderClient, setReminderClient] = useState(null);
  const [meetingClient, setMeetingClient] = useState(null);
  const [showImport, setShowImport] = useState(false);

  async function load() {
    const user = await base44.auth.me();
    const [clientRes, meetingRes] = await Promise.all([
      base44.entities.Client.filter({ created_by: user.email }, "full_name"),
      base44.entities.ScheduleEvent.filter({ created_by: user.email, source_type: "client" }),
    ]);
    setClients(clientRes);
    setMeetings(meetingRes);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function getUpcomingMeeting(clientId) {
    const now = new Date();
    return meetings
      .filter(m => m.source_id === clientId && isAfter(new Date(m.start_time), now))
      .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))[0] || null;
  }

  const filtered = clients.filter(c => {
    const q = search.toLowerCase();
    return !q || [c.full_name, c.phone, c.email].some(f => f?.toLowerCase().includes(q));
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-8" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">לקוחות</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowImport(true)}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">
            ייבא מאנשי קשר
          </button>
          <button onClick={() => setModalClient(null)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium"
            style={{ backgroundColor: "#1E5FA8" }}>
            <Plus className="w-4 h-4" /> הוסף לקוח
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="חפש לקוח לפי שם, טלפון או אימייל..."
          className="w-full pr-10 pl-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400 bg-white" dir="rtl" />
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[1,2,3].map(i => <SkeletonItem key={i} />)}
        </div>
      )}

      {/* List */}
      {!loading && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map(c => (
            <ClientCard
              key={c.id}
              client={c}
              upcomingMeeting={getUpcomingMeeting(c.id)}
              onEdit={setModalClient}
              onReminder={setReminderClient}
              onMeeting={setMeetingClient}
            />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <span className="text-6xl mb-4">🤝</span>
          <p className="text-lg font-semibold text-gray-700 mb-1">עדיין אין לקוחות</p>
          <p className="text-sm text-gray-400 mb-6">
            {search ? "לא נמצאו לקוחות התואמים לחיפוש" : "הוסף את הלקוח הראשון שלך או ייבא מאנשי קשר"}
          </p>
          {!search && (
            <button onClick={() => setModalClient(null)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-white text-sm font-medium"
              style={{ backgroundColor: "#1E5FA8" }}>
              <Plus className="w-4 h-4" /> הוסף לקוח
            </button>
          )}
        </div>
      )}

      {/* Modals */}
      {modalClient !== undefined && (
        <ClientModal client={modalClient} onClose={() => setModalClient(undefined)}
          onSaved={() => { setModalClient(undefined); setLoading(true); load(); checkAndUnlockAchievements().catch(() => {}); }} />
      )}
      {reminderClient && <ReminderModal client={reminderClient} onClose={() => setReminderClient(null)} />}
      {meetingClient && <MeetingModal client={meetingClient} onClose={() => setMeetingClient(null)} onScheduled={load} />}
      {showImport && <ImportContactsModal onClose={() => setShowImport(false)} onImported={() => { setShowImport(false); setLoading(true); load(); }} />}
    </div>
  );
}