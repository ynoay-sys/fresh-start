import { useState } from "react";
import { X } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function TaskModal({ task, parentGoalId, onClose, onSaved }) {
  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [dueDate, setDueDate] = useState(task?.due_date || "");
  const [isSmart, setIsSmart] = useState(task?.is_smart || false);
  const [addToCalendar, setAddToCalendar] = useState(true);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true);
    const data = {
      title, description,
      due_date: dueDate || null,
      type: "task",
      parent_id: task?.parent_id || parentGoalId,
      is_smart: isSmart,
      status: "active",
    };

    let milestone;
    if (task?.id) {
      await base44.entities.Milestone.update(task.id, data);
      milestone = { ...task, ...data };
    } else {
      milestone = await base44.entities.Milestone.create(data);
    }

    if (!task?.id && addToCalendar && dueDate) {
      const event = await base44.entities.ScheduleEvent.create({
        title: `משימה: ${title}`,
        category: "milestone",
        start_time: new Date(`${dueDate}T09:00:00`).toISOString(),
        end_time: new Date(`${dueDate}T10:00:00`).toISOString(),
        all_day: false,
        source_type: "milestone",
        source_id: milestone.id,
        notes: description,
      });
      await base44.entities.Milestone.update(milestone.id, { schedule_event_id: event.id });
    }

    setSaving(false);
    onSaved();
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 text-lg">{task ? "עריכת משימה" : "הוספת משימה"}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">כותרת משימה *</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} dir="rtl"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">תיאור</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} dir="rtl"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 resize-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">תאריך יעד</label>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400" />
          </div>

          {/* SMART toggle */}
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <div onClick={() => setIsSmart(v => !v)}
                className={`w-10 h-5 rounded-full transition-colors relative ${isSmart ? "bg-blue-600" : "bg-gray-300"}`}>
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${isSmart ? "translate-x-5" : "translate-x-0.5"}`} />
              </div>
              <span className="text-sm text-gray-700">האם זוהי משימה SMART?</span>
            </label>
            {isSmart && (
              <div className="mt-2 p-3 bg-blue-50 rounded-lg text-xs text-blue-800 space-y-1">
                <p className="font-semibold mb-1">משימה SMART היא:</p>
                <p>✓ ספציפית (Specific)</p>
                <p>✓ מדידה (Measurable)</p>
                <p>✓ ניתנת להשגה (Achievable)</p>
                <p>✓ רלוונטית (Relevant)</p>
                <p>✓ מוגדרת בזמן (Time-bound)</p>
              </div>
            )}
          </div>

          {/* Calendar sync */}
          {!task && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={addToCalendar} onChange={e => setAddToCalendar(e.target.checked)} />
              <span className="text-sm text-gray-700">הוסף אוטומטית ללוח הזמנים</span>
            </label>
          )}
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button onClick={handleSave} disabled={saving || !title.trim()}
            className="px-5 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: "#1E5FA8" }}>
            {saving ? "שומר..." : "שמור משימה"}
          </button>
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50">ביטול</button>
        </div>
      </div>
    </div>
  );
}