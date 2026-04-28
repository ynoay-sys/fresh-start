import { useState } from "react";
import { useNavigate } from "react-router-dom";

const ITEMS = [
  { key: "profile", label: "השלם את הפרופיל שלך", link: "/profile" },
  { key: "document", label: "העלה את המסמך הראשון שלך", link: "/documents/upload" },
  { key: "client", label: "הוסף לקוח ראשון", link: "/clients" },
  { key: "vision", label: "הגדר את החזון שלך", link: "/vision" },
  { key: "business", label: "השלם שלב אחד בפתיחת העסק", link: "/business-opening" },
];

// checks: { profile, document, client, vision, business } — profile can be a number (completeness %) or boolean
// profileCompleteness: optional number 0-100
export default function OnboardingChecklist({ checks, profileCompleteness }) {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  if (!checks) return null;

  const doneCount = Object.values(checks).filter(Boolean).length;
  const allDone = doneCount >= 5;
  const pct = Math.round((doneCount / 5) * 100);

  if (allDone) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-xl mb-6 overflow-hidden" dir="rtl">
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50"
        onClick={() => setCollapsed(v => !v)}
      >
        <div>
          <p className="font-bold text-gray-900">צעדים ראשונים 🚀</p>
          <p className="text-xs text-gray-500">השלמת {doneCount} מתוך 5 צעדים</p>
        </div>
        <span className="text-gray-400 text-lg">{collapsed ? "▼" : "▲"}</span>
      </div>

      {!collapsed && (
        <div className="px-5 pb-5">
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: "#1E5FA8" }} />
          </div>
          <div className="space-y-3">
            {ITEMS.map(item => {
              const done = !!checks[item.key];
              // Special handling for profile item with partial completion
              const isProfile = item.key === "profile";
              const pct = isProfile ? (profileCompleteness ?? (done ? 100 : 0)) : null;
              const profilePartial = isProfile && pct >= 50 && pct < 100;
              const profileEmpty = isProfile && pct < 50;
              const effectiveDone = isProfile ? pct === 100 : done;

              return (
                <div
                  key={item.key}
                  onClick={() => !effectiveDone && navigate(item.link)}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${effectiveDone ? "" : "cursor-pointer hover:bg-blue-50"}`}
                >
                  {effectiveDone ? (
                    <span className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">✓</span>
                  ) : profilePartial ? (
                    <span className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ borderColor: "#C25A00", color: "#C25A00" }}>◐</span>
                  ) : (
                    <span className="w-6 h-6 rounded-full border-2 border-gray-300 flex-shrink-0" />
                  )}
                  <span className={`text-sm ${effectiveDone ? "line-through text-gray-400" : profilePartial ? "font-medium" : "text-gray-800 font-medium"}`}
                    style={profilePartial ? { color: "#C25A00" } : {}}>
                    {effectiveDone ? item.label : profilePartial ? `פרופיל הושלם חלקית (${pct}%)` : item.label}
                  </span>
                  {!effectiveDone && <span className="text-xs text-blue-600 mr-auto">←</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}