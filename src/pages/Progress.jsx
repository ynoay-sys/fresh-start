import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BackButton from "../components/BackButton";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import BusinessProgressMap from "../components/BusinessProgressMap";
import { ACHIEVEMENT_DEFS } from "../lib/achievements";

function StatCard({ emoji, label, value }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col items-center">
      <span className="text-2xl mb-1">{emoji}</span>
      <p className="text-3xl font-bold mb-0.5" style={{ color: "#1E5FA8" }}>{value ?? "—"}</p>
      <p className="text-xs text-gray-500 text-center">{label}</p>
    </div>
  );
}

function QuickActionCard({ emoji, label, path }) {
  const navigate = useNavigate();
  return (
    <button onClick={() => navigate(path)}
      className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col items-center gap-2 hover:shadow-md hover:border-gray-200 transition-all">
      <span className="text-3xl">{emoji}</span>
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </button>
  );
}

function AchievementBadge({ def, unlocked, unlockedAt }) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center text-3xl flex-shrink-0 transition-all"
        style={
          unlocked
            ? {
                background: "linear-gradient(135deg, #1E5FA8, #5C1A8A)",
                boxShadow: "0 0 16px rgba(30,95,168,0.35)",
              }
            : { backgroundColor: "#E5E7EB" }
        }
      >
        {unlocked ? def.icon : "🔒"}
      </div>
      <div>
        <p className={`text-xs font-semibold leading-tight ${unlocked ? "text-gray-800" : "text-gray-400"}`}>
          {def.title}
        </p>
        {unlocked && unlockedAt ? (
          <p className="text-[10px] text-gray-400 mt-0.5">
            נפתח: {format(new Date(unlockedAt), "dd/MM")}
          </p>
        ) : (
          <p className="text-[10px] text-gray-400 mt-0.5">
            {def.description.split(" ").slice(0, 2).join(" ")}...
          </p>
        )}
      </div>
    </div>
  );
}

export default function Progress() {
  const navigate = useNavigate();
  const [steps, setSteps] = useState([]);
  const [stats, setStats] = useState({});
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { document.title = 'ההתקדמות שלי | Fresh Start'; }, []);

  useEffect(() => {
    async function load() {
      const user = await base44.auth.me();
      const [stepRes, docsRes, signedRes, clientsRes, activeGoalsRes, achievementsRes] = await Promise.all([
        base44.entities.BusinessOpeningStep.filter({ created_by: user.email }),
        base44.entities.Document.filter({ created_by: user.email, status: "active" }),
        base44.entities.Document.filter({ created_by: user.email, is_signed: true }),
        base44.entities.Client.filter({ created_by: user.email }),
        base44.entities.Milestone.filter({ created_by: user.email, type: "goal", status: "active" }),
        base44.entities.Achievement.filter({ created_by: user.email }),
      ]);
      setSteps(stepRes);
      setStats({
        docs: docsRes.length,
        signed: signedRes.length,
        clients: clientsRes.length,
        activeGoals: activeGoalsRes.length,
      });
      setAchievements(achievementsRes);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  const unlockedMap = {};
  for (const a of achievements) {
    unlockedMap[a.achievement_key] = a.unlocked_at;
  }
  const unlockedCount = achievements.length;
  const pct = Math.round((unlockedCount / ACHIEVEMENT_DEFS.length) * 100);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8" dir="rtl">
      <BackButton />
      <h1 className="text-2xl font-bold text-gray-900 mb-8">ההתקדמות שלי</h1>

      {/* SECTION 1: Business Opening Journey */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-base font-bold text-gray-800 mb-5">מפת המסע לפתיחת עסק</h2>
        <BusinessProgressMap steps={steps} />
      </div>

      {/* SECTION 2: Achievements */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-base font-bold text-gray-800">ההישגים שלי 🏆</h2>
          <span className="text-sm text-gray-500">{unlockedCount} מתוך {ACHIEVEMENT_DEFS.length} פוּתחו</span>
        </div>

        {/* Overall progress bar */}
        <div className="mb-5">
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, background: "linear-gradient(90deg, #1E5FA8, #5C1A8A)" }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">{unlockedCount}/{ACHIEVEMENT_DEFS.length} הישגים</p>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-4 gap-4">
          {ACHIEVEMENT_DEFS.map(def => (
            <AchievementBadge
              key={def.key}
              def={def}
              unlocked={!!unlockedMap[def.key]}
              unlockedAt={unlockedMap[def.key]}
            />
          ))}
        </div>
      </div>

      {/* SECTION 3: Stats */}
      <div className="mb-6">
        <h2 className="text-base font-bold text-gray-800 mb-3">הפלטפורמה שלי</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard emoji="📁" label="מסמכים שהועלו" value={stats.docs} />
          <StatCard emoji="✍️" label="מסמכים חתומים" value={stats.signed} />
          <StatCard emoji="👥" label="לקוחות" value={stats.clients} />
          <StatCard emoji="🎯" label="מטרות פעילות" value={stats.activeGoals} />
        </div>
      </div>

      {/* SECTION 4: Quick Actions */}
      <div>
        <h2 className="text-base font-bold text-gray-800 mb-3">פעולות מהירות</h2>
        <div className="grid grid-cols-3 gap-3">
          <QuickActionCard emoji="📄" label="העלה מסמך" path="/documents/upload" />
          <QuickActionCard emoji="👥" label="הוסף לקוח" path="/clients" />
          <QuickActionCard emoji="🌟" label="הגדר מטרה" path="/vision" />
        </div>
      </div>
    </div>
  );
}