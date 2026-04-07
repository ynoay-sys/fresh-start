import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import VisionModal from "../components/VisionModal";
import GoalModal from "../components/GoalModal";
import GoalCard from "../components/GoalCard";
import { checkAndUnlockAchievements } from "../lib/achievements";

export default function Vision() {
  const [vision, setVision] = useState(null);
  const [goals, setGoals] = useState([]);
  const [completedGoals, setCompletedGoals] = useState([]);
  const [tasksByGoal, setTasksByGoal] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showVisionModal, setShowVisionModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [editGoal, setEditGoal] = useState(null);
  const [deleteGoalTarget, setDeleteGoalTarget] = useState(null);
  const [completedExpanded, setCompletedExpanded] = useState(false);

  async function load() {
    setError(false);
    setLoading(true);
    const user = await base44.auth.me();
    const milestones = await base44.entities.Milestone.filter({ created_by: user.email }).catch(() => null);
    if (milestones === null) { setError(true); setLoading(false); return; }

    const vis = milestones.find(m => m.type === "vision");
    const activeG = milestones.filter(m => m.type === "goal" && m.status !== "completed")
      .sort((a, b) => (a.due_date || "9999") < (b.due_date || "9999") ? -1 : 1);
    const completedG = milestones.filter(m => m.type === "goal" && m.status === "completed");
    const allTasks = milestones.filter(m => m.type === "task");
    const byGoal = {};
    for (const g of [...activeG, ...completedG]) {
      byGoal[g.id] = allTasks.filter(t => t.parent_id === g.id);
    }
    setVision(vis || null);
    setGoals(activeG);
    setCompletedGoals(completedG);
    setTasksByGoal(byGoal);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleDeleteGoal(goal) {
    if (!confirm(`למחוק את המטרה "${goal.title}"?`)) return;
    await base44.entities.Milestone.delete(goal.id);
    load();
  }

  async function handleMilestoneSaved() {
    load();
    checkAndUnlockAchievements().catch(() => {});
  }

  async function handleReactivate(goal) {
    await base44.entities.Milestone.update(goal.id, { status: "active", completed_at: null });
    load();
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4" dir="rtl">
      <p className="text-4xl">⚠️</p>
      <p className="text-gray-600 font-medium">אירעה שגיאה בטעינת הנתונים</p>
      <button onClick={load} className="px-4 py-2 rounded-lg text-white text-sm font-medium" style={{ backgroundColor: "#1E5FA8" }}>נסה שוב</button>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-8" dir="rtl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">חזון ומטרות</h1>

      {/* SECTION 1: Vision */}
      {!vision ? (
        <div className="border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center mb-8">
          <div className="text-5xl mb-3">🌟</div>
          <h2 className="text-lg font-bold text-gray-800 mb-1">הגדר את החזון שלך לעסק</h2>
          <p className="text-sm text-gray-400 mb-5">לאן אתה רוצה להגיע בעוד 3 שנים?</p>
          <button onClick={() => setShowVisionModal(true)}
            className="px-5 py-2.5 rounded-lg text-white text-sm font-medium" style={{ backgroundColor: "#1E5FA8" }}>
            + הגדר חזון
          </button>
        </div>
      ) : (
        <div className="relative rounded-2xl p-6 mb-8 text-white" style={{ background: "linear-gradient(135deg, #1E5FA8, #0D3B6E)" }}>
          <button onClick={() => setShowVisionModal(true)}
            className="absolute top-4 left-4 text-xs px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 transition-colors text-white">
            ערוך
          </button>
          <div className="text-4xl font-serif opacity-30 mb-2">"</div>
          <h2 className="text-2xl font-bold leading-snug mb-2">{vision.title}</h2>
          {vision.description && <p className="text-sm opacity-80">{vision.description}</p>}
        </div>
      )}

      {/* SECTION 2: Goals */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">המטרות שלי</h2>
          {vision ? (
            <button onClick={() => { setEditGoal(null); setShowGoalModal(true); }}
              className="px-4 py-2 rounded-lg text-white text-sm font-medium" style={{ backgroundColor: "#1E5FA8" }}>
              + הוסף מטרה
            </button>
          ) : (
            <span className="text-sm text-gray-400 italic" title="יש להגדיר חזון תחילה">+ הוסף מטרה</span>
          )}
        </div>

        {goals.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            {vision
              ? <><p className="mb-2 text-sm">עדיין אין מטרות.</p><button onClick={() => setShowGoalModal(true)} className="text-sm font-medium underline" style={{ color: "#1E5FA8" }}>הוסף את המטרה הראשונה שלך ←</button></>
              : <p className="text-sm">הגדר תחילה את החזון שלך כדי להתחיל להוסיף מטרות.</p>
            }
          </div>
        ) : (
          <div className="space-y-4">
            {goals.map(goal => (
              <GoalCard
                key={goal.id}
                goal={goal}
                tasks={tasksByGoal[goal.id] || []}
                onEdit={g => { setEditGoal(g); setShowGoalModal(true); }}
                onDelete={handleDeleteGoal}
                onRefresh={load}
              />
            ))}
          </div>
        )}
      </div>

      {/* SECTION 3: Completed goals */}
      {completedGoals.length > 0 && (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <button onClick={() => setCompletedExpanded(v => !v)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
            <span className="font-semibold text-gray-700">מטרות שהושלמו ✓ ({completedGoals.length})</span>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${completedExpanded ? "rotate-180" : ""}`} />
          </button>
          {completedExpanded && (
            <div className="divide-y divide-gray-100">
              {completedGoals.map(g => (
                <div key={g.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700 line-through">{g.title}</p>
                    {g.completed_at && <p className="text-xs text-gray-400">{format(new Date(g.completed_at), "dd/MM/yyyy")}</p>}
                  </div>
                  <button onClick={() => handleReactivate(g)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
                    הפעל מחדש
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showVisionModal && (
        <VisionModal vision={vision} onClose={() => setShowVisionModal(false)} onSaved={() => { setShowVisionModal(false); handleMilestoneSaved(); }} />
      )}
      {showGoalModal && (
        <GoalModal goal={editGoal} onClose={() => { setShowGoalModal(false); setEditGoal(null); }} onSaved={() => { setShowGoalModal(false); setEditGoal(null); handleMilestoneSaved(); }} />
      )}
    </div>
  );
}