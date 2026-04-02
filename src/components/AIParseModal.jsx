import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { format, addDays } from "date-fns";
import { X } from "lucide-react";

function randomNum(digits) {
  const min = Math.pow(10, digits - 1);
  return Math.floor(min + Math.random() * min * 9);
}

function generateSamples() {
  const today = new Date();
  return [
    {
      carrier: "DHL",
      order_number: `DHL-2026-${randomNum(6)}`,
      contents: "ציוד משרדי",
      expected_date: addDays(today, 3),
      confidence: 94,
    },
    {
      carrier: "דואר ישראל",
      order_number: `IL${randomNum(8)}`,
      contents: "חבילה נכנסת",
      expected_date: addDays(today, 5),
      confidence: 87,
    },
    {
      carrier: "UPS",
      order_number: `UPS-${randomNum(6)}`,
      contents: "מוצרים שהוזמנו",
      expected_date: addDays(today, 7),
      confidence: 79,
    },
  ];
}

export default function AIParseModal({ user, onClose, onImported }) {
  const [samples] = useState(() => generateSamples());
  const [checked, setChecked] = useState([true, true, true]);
  const [importing, setImporting] = useState(false);

  function toggle(i) {
    setChecked(prev => prev.map((v, idx) => idx === i ? !v : v));
  }

  async function handleImport() {
    setImporting(true);
    const selected = samples.filter((_, i) => checked[i]);
    for (const s of selected) {
      const expDate = s.expected_date;
      const expStr = format(expDate, "yyyy-MM-dd");
      const daysUntil = Math.round((expDate - new Date()) / 86400000);
      const order = await base44.entities.Order.create({
        carrier: s.carrier,
        order_number: s.order_number,
        contents: s.contents,
        expected_date: expStr,
        status: "in_transit",
        delivery_days: daysUntil,
      });
      const start = new Date(expDate);
      start.setHours(12, 0, 0, 0);
      await base44.entities.ScheduleEvent.create({
        title: `משלוח צפוי: ${s.contents} מ${s.carrier}`,
        category: "delivery",
        start_time: start.toISOString(),
        all_day: false,
        source_type: "order",
        source_id: order.id,
      });
    }
    setImporting(false);
    onImported(selected.length);
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 text-lg">נמצאו הזמנות באימייל 📧</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-3">
          {samples.map((s, i) => (
            <div
              key={i}
              onClick={() => toggle(i)}
              className={`border rounded-xl p-4 cursor-pointer transition-colors ${checked[i] ? "border-blue-300 bg-blue-50" : "border-gray-200 bg-white"}`}
            >
              <div className="flex items-start gap-3">
                <input type="checkbox" checked={checked[i]} onChange={() => toggle(i)}
                  className="mt-1 accent-blue-600 w-4 h-4 flex-shrink-0" onClick={e => e.stopPropagation()} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-gray-900">{s.carrier}</span>
                    <span className="text-xs font-mono text-gray-400">{s.order_number}</span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium text-white flex-shrink-0"
                      style={{ backgroundColor: s.confidence > 85 ? "#1A7A4A" : "#C25A00" }}
                    >
                      {s.confidence}% ביטחון
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{s.contents}</p>
                  <p className="text-xs text-gray-500 mt-1">📅 צפוי: {format(s.expected_date, "dd/MM/yyyy")}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="p-5 pt-0 flex gap-2">
          <button onClick={handleImport} disabled={importing || !checked.some(Boolean)}
            className="flex-1 py-2.5 rounded-lg text-white font-medium text-sm disabled:opacity-60"
            style={{ backgroundColor: "#1E5FA8" }}>
            {importing ? "מייבא..." : `ייבא הזמנות נבחרות ✓`}
          </button>
          <button onClick={onClose} className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50">
            ביטול
          </button>
        </div>
      </div>
    </div>
  );
}