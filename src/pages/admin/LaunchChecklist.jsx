import { useState, useEffect } from "react";

const CHECKLIST = {
  "טכני": [
    { key: "modules_working", label: "כל 9 המודולים עובדים ✓" },
    { key: "pdf_lib", label: "חתימה דיגיטלית — pdf-lib עובד" },
    { key: "ai_chatbot", label: "AI chatbot מגיב" },
    { key: "notifications_auto", label: "התראות נוצרות אוטומטית" },
    { key: "analytics_works", label: "מסך אנליטיקה עובד" },
    { key: "automation_test", label: "/admin/automation-test הורץ" },
  ],
  "תוכן": [
    { key: "all_hebrew", label: "כל הטקסט בעברית" },
    { key: "12_forms", label: "12 טפסי ממשלה נטענים" },
    { key: "help_page", label: "דף עזרה מלא" },
    { key: "legal_pages", label: "תנאי שימוש ומדיניות פרטיות" },
  ],
  "מובייל": [
    { key: "mobile_loads", label: "כל המסכים נטענים בטלפון" },
    { key: "bottom_bar", label: "סרגל תחתון תמיד מוצג" },
    { key: "button_size", label: "כפתורים בגודל מינימלי 44px" },
  ],
  "תשלומים": [
    { key: "pricing_screen", label: "מסך תמחור מוצג נכון" },
    { key: "paywall_works", label: "PaywallModal עובד" },
    { key: "billing_history", label: "היסטוריית תשלומים מוצגת" },
  ],
};

const ALL_KEYS = Object.values(CHECKLIST).flat().map(i => i.key);

export default function LaunchChecklist() {
  const [checked, setChecked] = useState(() => {
    try {
      const saved = localStorage.getItem("launch_checklist");
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  function toggle(key) {
    const next = { ...checked, [key]: !checked[key] };
    setChecked(next);
    localStorage.setItem("launch_checklist", JSON.stringify(next));
  }

  const total = ALL_KEYS.length;
  const done = ALL_KEYS.filter(k => checked[k]).length;
  const pct = Math.round((done / total) * 100);
  const scoreColor = pct >= 80 ? "#1A7A4A" : pct >= 50 ? "#C25A00" : "#AA1111";

  return (
    <div className="max-w-2xl mx-auto px-4 py-8" dir="rtl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">רשימת בדיקות לשחרור 🚀</h1>

      {/* Score */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 text-center">
        <p className="text-5xl font-bold mb-1" style={{ color: scoreColor }}>{pct}%</p>
        <p className="text-sm text-gray-500 mb-3">מוכנות: {done}/{total} פריטים</p>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden mx-auto max-w-sm">
          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: scoreColor }} />
        </div>
        {pct === 100 && (
          <p className="text-green-700 font-bold text-lg mt-4">הפלטפורמה מוכנה לשחרור! 🚀</p>
        )}
      </div>

      {/* Categories */}
      {Object.entries(CHECKLIST).map(([category, items]) => (
        <div key={category} className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
          <h2 className="font-bold text-gray-900 mb-3">{category}</h2>
          <div className="space-y-2">
            {items.map(item => (
              <label key={item.key} className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 rounded-lg p-1.5 transition-colors">
                <input
                  type="checkbox"
                  checked={!!checked[item.key]}
                  onChange={() => toggle(item.key)}
                  className="w-4 h-4 accent-blue-600 flex-shrink-0"
                />
                <span className={`text-sm ${checked[item.key] ? "line-through text-gray-400" : "text-gray-800"}`}>
                  {item.label}
                </span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}