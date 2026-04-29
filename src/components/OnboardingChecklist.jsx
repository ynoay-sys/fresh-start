import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProfileCompleteness } from "../lib/profileCompleteness";

const ITEMS = [
  { key: "profile", label: "השלם את הפרופיל שלך", link: "/profile" },
  { key: "document", label: "העלה את המסמך הראשון שלך", link: "/documents/upload" },
  { key: "client", label: "הוסף לקוח ראשון", link: "/clients" },
  { key: "vision", label: "הגדר את החזון שלך", link: "/vision" },
  { key: "business", label: "השלם שלב אחד בפתיחת העסק", link: "/business-opening" },
];

// checks: { profile, document, client, vision, business }
// userProfile: the raw UserProfile record (for completeness calculation)
export default function OnboardingChecklist({ checks, userProfile }) {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  if (!checks) return null;

  const profilePct = userProfile ? getProfileCompleteness(userProfile) : 0;

  const doneCount = [
    profilePct === 100,
    !!checks.document,
    !!checks.client,
    !!checks.vision,
    !!checks.business,
  ].filter(Boolean).length;
  const allDone = doneCount >= 5;
  const progressPct = Math.round((doneCount / 5) * 100);

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
            <div className="h-full rounded-full transition-all" style={{ width: `${progressPct}%`, backgroundColor: "#1E5FA8" }} />
          </div>
          <div className="space-y-3">
            {ITEMS.map(item => {
              const isProfile = item.key === "profile";

              let effectiveDone, icon, iconStyle, textLabel, textStyle;

              if (isProfile) {
                effectiveDone = profilePct === 100;
                if (profilePct === 100) {
                  icon = "✓"; iconStyle = { backgroundColor: "#1A7A4A", color: "white" };
                  textLabel = "הפרופיל הושלם";
                  textStyle = { textDecoration: "line-through", color: "#9CA3AF" };
                } else if (profilePct > 0) {
                  icon = "◐"; iconStyle = { border: "2px solid #C25A00", color: "#C25A00" };
                  textLabel = `הושלם חלקית — פרופיל (${profilePct}%)`;
                  textStyle = { textDecoration: "line-through", color: "#C25A00" };
                } else {
                  icon = null; iconStyle = { border: "2px solid #D1D5DB" };
                  textLabel = "השלם את הפרופיל שלך";
                  textStyle = { color: "#1A1A2E" };
                }
              } else {
                effectiveDone = !!checks[item.key];
                icon = effectiveDone ? "✓" : null;
                iconStyle = effectiveDone ? { backgroundColor: "#1A7A4A", color: "white" } : { border: "2px solid #D1D5DB" };
                textLabel = item.label;
                textStyle = effectiveDone ? { textDecoration: "line-through", color: "#9CA3AF" } : { color: "#1A1A2E" };
              }

              return (
                <div
                  key={item.key}
                  onClick={() => !effectiveDone && navigate(item.link)}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${effectiveDone ? "" : "cursor-pointer hover:bg-blue-50"}`}
                >
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={iconStyle}>
                    {icon}
                  </span>
                  <span className="text-sm font-medium" style={textStyle}>{textLabel}</span>
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