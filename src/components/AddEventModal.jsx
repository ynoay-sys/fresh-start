import { useState } from "react";
import { X } from "lucide-react";
import { base44 } from "@/api/base44Client";

const CATEGORIES = [
  { value: "client", label: "לקוח" },
  { value: "delivery", label: "משלוח" },
  { value: "order", label: "הזמנה" },
  { value: "milestone", label: "אבן דרך" },
  { value: "government", label: "ממשלתי" },
  { value: "personal", label: "אישי" },
];

export default function AddEventModal({ initialDate, event, onClose, onSaved }) {
  const defaultDate = initialDate || new Date().toISOString().split("T")[0];
  const [title, setTitle] = useState(event?.title || "");
  const [category, setCategory] = useState(event?.category || "personal");
  const [date, setDate] = useState(event ? event.start_time?.split("T")[0] : defaultDate);
  const [allDay, setAllDay] = useState(event?.all_day || false);
  const [startTime, setStartTime] = useState(event?.start_time ? event.start_time.slice(11, 16) : "10:00");
  const [endTime, setEndTime] = useState(event?.end_time ? event.end_time.slice(11, 16) : "11:00");
  const [notes, setNotes] = useState(event?.notes || "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!title.trim() || !date) return;
    setSaving(true);
    const startDT = allDay ? `${date}T00:00:00` : `${date}T${startTime}:00`;
    const endDT = allDay ? `${date}T23:59:00` : `${date}T${endTime}:00`;
    const data = {
      title, category,
      start_time: new Date(startDT).toISOString(),
      end_time: new Date(endDT).toISOString(),
      all_day: allDay,
      notes,
      source_type: event?.source_type || "manual",
      source_id: event?.source_id || null,
    };
    if (event?.id) {
      await base44.entities.ScheduleEvent.update(event.id, data);
    } else {
      await base44.entities.ScheduleEvent.create(data);
    }
    setSaving(false);
    onSaved();
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 text-lg">{event ? "עריכת אירוע" : "הוספת אירוע"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">כותרת *</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400" dir="rtl" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">קטגוריה</label>
            <select value={category} onChange={e => setCategory(e.target.value)} dir="rtl"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:border-blue-400">
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">תאריך *</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={allDay} onChange={e => setAllDay(e.target.checked)} />
            <span className="text-sm text-gray-700">אירוע כל היום</span>
          </label>
          {!allDay && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">שעת התחלה</label>
                <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">שעת סיום</label>
                <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400" />
              </div>
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">הערות</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} dir="rtl"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 resize-none" />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button onClick={handleSave} disabled={saving || !title.trim() || !date}
            className="px-5 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: "#1E5FA8" }}>
            {saving ? "שומר..." : event ? "שמור שינויים" : "הוסף אירוע"}
          </button>
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50">ביטול</button>
        </div>
      </div>
    </div>
  );
}