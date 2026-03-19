import { useState } from "react";
import { X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";

function formatPhone(phone) {
  const digits = phone.replace(/\D/g, "");
  const local = digits.startsWith("0") ? digits.slice(1) : digits;
  return `972${local}`;
}

export default function MeetingModal({ client, onClose, onScheduled }) {
  const today = new Date().toISOString().split("T")[0];
  const [subject, setSubject] = useState(`פגישה עם ${client.full_name}`);
  const [date, setDate] = useState(today);
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("11:00");
  const [location, setLocation] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  function buildMessage() {
    return `שלום ${client.full_name},\nאשמח להזמינך לפגישה בנושא ${subject}.\nתאריך: ${date}\nשעה: ${startTime}\nמיקום: ${location || "יוגדר בהמשך"}\nמחכה לאישורך.`;
  }

  async function handleSend() {
    setSaving(true);
    const startDT = new Date(`${date}T${startTime}`);
    const endDT = endTime ? new Date(`${date}T${endTime}`) : new Date(startDT.getTime() + 60 * 60 * 1000);

    await base44.entities.ScheduleEvent.create({
      title: subject,
      category: "client",
      start_time: startDT.toISOString(),
      end_time: endDT.toISOString(),
      all_day: false,
      source_type: "client",
      source_id: client.id,
      notes: location,
    });

    if (client.phone) {
      const wa = formatPhone(client.phone);
      window.open(`https://wa.me/${wa}?text=${encodeURIComponent(buildMessage())}`, "_blank");
    }

    setSaving(false);
    setDone(true);
    if (onScheduled) onScheduled();
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 text-lg">הזמנה לפגישה עם {client.full_name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        {done ? (
          <div className="px-6 py-10 text-center">
            <p className="text-2xl mb-2">✅</p>
            <p className="font-semibold text-gray-800">הפגישה נקבעה ביומן והזמנה נשלחה בוואטסאפ ✓</p>
            <button onClick={onClose} className="mt-4 px-4 py-2 rounded-lg text-white text-sm font-medium" style={{ backgroundColor: "#1E5FA8" }}>סגור</button>
          </div>
        ) : (
          <div className="px-6 py-5 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">נושא הפגישה *</label>
              <input type="text" value={subject} onChange={e => setSubject(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400" dir="rtl" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">תאריך *</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">שעת התחלה *</label>
                <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">שעת סיום</label>
                <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">מיקום</label>
              <input type="text" value={location} onChange={e => setLocation(e.target.value)}
                placeholder="כתובת או קישור לזום"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400" dir="rtl" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">הודעה ללקוח</label>
              <textarea value={buildMessage()} readOnly rows={6}
                className="w-full border border-gray-100 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-600 resize-none" dir="rtl" />
            </div>

            <div className="flex gap-3 pt-1">
              <button onClick={handleSend} disabled={saving || !subject || !date || !startTime}
                className="flex-1 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50"
                style={{ backgroundColor: "#1E5FA8" }}>
                {saving ? "שומר..." : "שלח הזמנה וקבע ביומן"}
              </button>
              <button onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50">ביטול</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}