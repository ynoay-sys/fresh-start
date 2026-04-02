import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X } from "lucide-react";

export default function AddOrderModal({ user, onClose, onSaved }) {
  const [form, setForm] = useState({
    carrier: "",
    order_number: "",
    contents: "",
    expected_date: "",
    status: "pending",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  function set(field, val) {
    setForm(f => ({ ...f, [field]: val }));
  }

  async function handleSave() {
    setSaving(true);
    const order = await base44.entities.Order.create({
      ...form,
      delivery_days: form.expected_date
        ? Math.max(0, Math.round((new Date(form.expected_date) - new Date()) / 86400000))
        : undefined,
    });
    if (form.expected_date) {
      const start = new Date(form.expected_date);
      start.setHours(12, 0, 0, 0);
      await base44.entities.ScheduleEvent.create({
        title: `משלוח: ${form.contents || form.carrier}`,
        category: "delivery",
        start_time: start.toISOString(),
        all_day: false,
        source_type: "order",
        source_id: order.id,
      });
    }
    setSaving(false);
    onSaved();
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 text-lg">הוספת הזמנה ידנית</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">ספק / שולח</label>
            <input type="text" value={form.carrier} onChange={e => set("carrier", e.target.value)}
              placeholder="DHL, דואר ישראל, UPS..."
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400" dir="rtl" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">מספר הזמנה</label>
            <input type="text" value={form.order_number} onChange={e => set("order_number", e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400" dir="rtl" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">תוכן ההזמנה</label>
            <textarea rows={2} value={form.contents} onChange={e => set("contents", e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 resize-none" dir="rtl" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">תאריך אספקה צפוי</label>
            <input type="date" value={form.expected_date} onChange={e => set("expected_date", e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">סטטוס</label>
            <select value={form.status} onChange={e => set("status", e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 bg-white" dir="rtl">
              <option value="pending">ממתין</option>
              <option value="in_transit">בדרך</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">הערות (אופציונלי)</label>
            <textarea rows={2} value={form.notes} onChange={e => set("notes", e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 resize-none" dir="rtl" />
          </div>
        </div>
        <div className="p-5 pt-0 flex gap-2">
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2.5 rounded-lg text-white font-medium text-sm disabled:opacity-60"
            style={{ backgroundColor: "#1E5FA8" }}>
            {saving ? "שומר..." : "הוסף הזמנה"}
          </button>
          <button onClick={onClose} className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50">
            ביטול
          </button>
        </div>
      </div>
    </div>
  );
}