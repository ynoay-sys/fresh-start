import { useState } from "react";
import { X } from "lucide-react";

const TABS = [
  { key: "gmail", label: "Gmail" },
  { key: "outlook", label: "Outlook" },
  { key: "whatsapp", label: "WhatsApp עסקי" },
];

const STEPS = {
  gmail: [
    "הורד את תמונת החתימה בלחיצה על 'הורד חתימה'",
    "בגמייל: הגדרות ← חתימה ← הוסף תמונה ← העלה מהמחשב ← בחר את הקובץ שהורדת",
    "לחץ שמור שינויים — זהו!",
  ],
  outlook: [
    "הורד את תמונת החתימה",
    "Outlook: קובץ ← אפשרויות ← דואר ← חתימות ← חדש ← הכנס תמונה ← בחר את הקובץ",
    "לחץ אישור — זהו!",
  ],
  whatsapp: [
    "הורד את תמונת החתימה",
    "שמור אותה בטלפון",
    "השתמש בה כתמונת פרופיל עסקית ב-WhatsApp",
  ],
};

export default function InstallGuideModal({ onClose, onDownload, userEmail }) {
  const [activeTab, setActiveTab] = useState("gmail");

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">כיצד להוסיף את החתימה לאימייל שלך</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-4">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === t.key ? "text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              style={activeTab === t.key ? { backgroundColor: "#1E5FA8" } : {}}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Steps */}
        <div className="px-6 py-4">
          <ol className="space-y-3">
            {STEPS[activeTab].map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: "#1E5FA8" }}>
                  {i + 1}
                </span>
                <span className="text-sm text-gray-700 leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Action buttons */}
        <div className="px-6 pb-6 flex flex-col gap-2">
          <button
            onClick={onDownload}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-medium"
            style={{ backgroundColor: "#1E5FA8" }}
          >
            ⬇️ הורד חתימה כתמונה
          </button>
          <a
            href={`mailto:${userEmail || ""}?subject=${encodeURIComponent("החתימה שלי")}&body=${encodeURIComponent("מצורפת תמונת החתימה שלך מ-Fresh Start")}`}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50"
          >
            📧 שלח לאימייל שלי
          </a>
        </div>
      </div>
    </div>
  );
}