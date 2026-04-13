import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";

const ITEMS = [
  { key: "profile", label: "השלם את הפרופיל שלך", link: "/profile" },
  { key: "document", label: "העלה את המסמך הראשון שלך", link: "/documents/upload" },
  { key: "client", label: "הוסף לקוח ראשון", link: "/clients" },
  { key: "vision", label: "הגדר את החזון שלך", link: "/vision" },
  { key: "business", label: "השלם שלב אחד בפתיחת העסק", link: "/business-opening" },
];

export default function OnboardingChecklist() {
  const navigate = useNavigate();
  const [checks, setChecks] = useState({});
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    async function load() {
      const user = await base44.auth.me();
      const profiles = await base44.entities.UserProfile.filter({ created_by: user.email });
      const docs = await base44.entities.Document.filter({ created_by: user.email });
      const clients = await base44.entities.Client.filter({ created_by: user.email });
      const milestones = await base44.entities.Milestone.filter({ created_by: user.email, type: "vision" });
      const steps = await base44.entities.BusinessOpeningStep.filter({ created_by: user.email, status: "completed" });
      setChecks({
        profile: !!(profiles[0]?.first_name),
        document: docs.length > 0,
        client: clients.length > 0,
        vision: milestones.length > 0,
        business: steps.length > 0,
      });
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return null;

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
              return (
                <div
                  key={item.key}
                  onClick={() => !done && navigate(item.link)}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${done ? "" : "cursor-pointer hover:bg-blue-50"}`}
                >
                  {done ? (
                    <span className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">✓</span>
                  ) : (
                    <span className="w-6 h-6 rounded-full border-2 border-gray-300 flex-shrink-0" />
                  )}
                  <span className={`text-sm ${done ? "line-through text-gray-400" : "text-gray-800 font-medium"}`}>
                    {item.label}
                  </span>
                  {!done && <span className="text-xs text-blue-600 mr-auto">←</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}