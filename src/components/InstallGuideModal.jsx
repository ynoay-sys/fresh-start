import { useState } from "react";
import { X, Copy } from "lucide-react";

const TABS = [
  { key: "gmail", label: "Gmail" },
  { key: "outlook", label: "Outlook" },
  { key: "apple", label: "Apple Mail" },
];

const STEPS = {
  gmail: [
    'פתח את Gmail ועבור להגדרות (⚙️)',
    "לחץ על 'ראה את כל ההגדרות'",
    "גלול למטה ל'חתימה' ולחץ '+ צור חתימה חדשה'",
    "בתיבה שנפתחת, לחץ על הכפתור '<>' (HTML)",
    "הדבק את קוד ה-HTML שהעתקת",
    "לחץ 'שמור שינויים' בתחתית הדף",
  ],
  outlook: [
    "פתח Outlook ועבור לקובץ → אפשרויות",
    "בחר 'דואר' → 'חתימות'",
    "לחץ 'חדש' וצור חתימה",
    "לחץ על כפתור HTML בעורך",
    "הדבק את קוד ה-HTML",
    "לחץ 'אישור'",
  ],
  apple: [
    "פתח Mail → העדפות → חתימות",
    "הוסף חתימה חדשה (+)",
    "בטל את הסימון 'צור חתימה כטקסט בלבד'",
    "גרור את קובץ ה-HTML לחלון החתימה",
    "או: פתח את קוד ה-HTML בדפדפן, בחר הכל והעתק, הדבק ב-Apple Mail",
  ],
};

export default function InstallGuideModal({ onClose, html }) {
  const [activeTab, setActiveTab] = useState("gmail");
  const [copied, setCopied] = useState(false);

  function copyHtml() {
    navigator.clipboard.writeText(html || "").then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

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

        {/* Copy button */}
        <div className="px-6 pb-6">
          <button
            onClick={copyHtml}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-medium"
            style={{ backgroundColor: copied ? "#1A7A4A" : "#1E5FA8" }}
          >
            <Copy className="w-4 h-4" />
            {copied ? "HTML הועתק ✓" : "העתק את קוד ה-HTML"}
          </button>
        </div>
      </div>
    </div>
  );
}