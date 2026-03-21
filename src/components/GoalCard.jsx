import { useState } from "react";
import { MoreVertical, Trash2, Edit, Check, Plus, ChevronDown } from "lucide-react";
import { format, isPast, addDays } from "date-fns";
import { base44 } from "@/api/base44Client";
import TaskModal from "./TaskModal";

const SMART_TOOLTIP = "ספציפי, מדיד, ניתן להשגה, רלוונטי, מוגדר בזמן";

function formatDate(d) {
  if (!d) return null;
  return format(new Date(d), "dd/MM/yyyy");
}

function DueBadge({ dueDate }) {
  if (!dueDate) return null;
  const d = new Date(dueDate);
  const overdue = isPast(d);
  const soon = !overdue && new Date(dueDate) <= addDays(new Date(), 7);
  if (overdue) return <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">באיחור!</span>;
  if (soon) return <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium">בקרוב</span>;
  return <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">יעד: {formatDate(dueDate)}</span>;
}

export default function GoalCard({ goal, tasks, onEdit, onDelete, onRefresh }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [completing, setCompleting] = useState(false);
  const [celebration, setCelebration] = useState(false);
  const [goalCompletePrompt, setGoalCompletePrompt] = useState(false);

  const activeTasks = tasks.filter(t => t.status !== "completed");
  const completedTasks = tasks.filter(t => t.status === "completed");
  const totalTasks = tasks.length;
  const doneCount = completedTasks.length;
  const pct = totalTasks > 0 ? Math.round((doneCount / totalTasks) * 100) : 0;

  async function handleTaskCheck(task) {
    if (task.status === "completed") return;
    await base44.entities.Milestone.update(task.id, { status: "completed", completed_at: new Date().toISOString() });

    // Check if all sibling tasks done
    const updated = tasks.map(t => t.id === task.id ? { ...t, status: "completed" } : t);
    const allDone = updated.length > 0 && updated.every(t => t.status === "completed");
    if (allDone) {
      setGoalCompletePrompt(true);
    } else {
      onRefresh();
    }
  }

  async function handleCompleteGoal() {
    setGoalCompletePrompt(false);
    await base44.entities.Milestone.update(goal.id, { status: "completed", completed_at: new Date().toISOString() });
    await base44.entities.Notification.create({
      tier: "system", type: "milestone_due",
      title: "מטרה הושלמה! 🏆",
      body: `השלמת את המטרה: ${goal.title}`,
      action_url: "/vision", is_read: false,
    });
    setCelebration(true);
    const confetti = (await import("canvas-confetti")).default;
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    setTimeout(() => { setCelebration(false); onRefresh(); }, 3500);
  }

  async function handleDeleteTask(taskId) {
    await base44.entities.Milestone.delete(taskId);
    onRefresh();
  }

  async function handleMarkGoalComplete() {
    setMenuOpen(false);
    await base44.entities.Milestone.update(goal.id, { status: "completed", completed_at: new Date().toISOString() });
    onRefresh();
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden" style={{ borderRightWidth: "4px", borderRightColor: "#1E5FA8" }}>
        {/* Goal header */}
        <div className="px-5 pt-4 pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h3 className="font-bold text-gray-900 text-base">{goal.title}</h3>
                <DueBadge dueDate={goal.due_date} />
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">פעיל</span>
              </div>
              {/* Progress */}
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: "#1E5FA8" }} />
                </div>
                <span className="text-xs text-gray-500 flex-shrink-0">{doneCount} מתוך {totalTasks} משימות</span>
              </div>
            </div>
            {/* Menu */}
            <div className="relative flex-shrink-0">
              <button onClick={() => setMenuOpen(v => !v)} className="p-1 rounded hover:bg-gray-100">
                <MoreVertical className="w-4 h-4 text-gray-400" />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute left-0 top-6 w-40 bg-white rounded-lg shadow-lg border border-gray-100 z-20 overflow-hidden">
                    <button onClick={() => { setMenuOpen(false); onEdit(goal); }}
                      className="flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 w-full">
                      <Edit className="w-3.5 h-3.5" /> ערוך מטרה
                    </button>
                    <button onClick={handleMarkGoalComplete}
                      className="flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 w-full">
                      <Check className="w-3.5 h-3.5" /> סמן כהושלם
                    </button>
                    <button onClick={() => { setMenuOpen(false); onDelete(goal); }}
                      className="flex items-center gap-2 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full">
                      <Trash2 className="w-3.5 h-3.5" /> מחק מטרה
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tasks */}
        <div className="px-5 pb-4 border-t border-gray-50">
          <div className="mt-3 space-y-1.5">
            {activeTasks.map(task => (
              <div key={task.id} className="flex items-center gap-2 group">
                <button onClick={() => handleTaskCheck(task)}
                  className="w-4 h-4 rounded border border-gray-300 flex-shrink-0 hover:border-blue-500 flex items-center justify-center">
                </button>
                <span className="flex-1 text-sm text-gray-800">{task.title}</span>
                {task.due_date && <span className="text-[10px] text-gray-400">{formatDate(task.due_date)}</span>}
                {task.is_smart && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 font-medium" title={SMART_TOOLTIP}>SMART ✓</span>}
                {task.schedule_event_id && <span className="text-[10px] text-gray-400">📅</span>}
                <button onClick={() => handleDeleteTask(task.id)}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity text-xs">×</button>
              </div>
            ))}
          </div>

          {completedTasks.length > 0 && (
            <button onClick={() => setShowCompleted(v => !v)}
              className="flex items-center gap-1 text-xs text-gray-400 mt-2 hover:text-gray-600">
              <ChevronDown className={`w-3 h-3 transition-transform ${showCompleted ? "rotate-180" : ""}`} />
              הצג משימות שהושלמו ({completedTasks.length})
            </button>
          )}
          {showCompleted && completedTasks.map(task => (
            <div key={task.id} className="flex items-center gap-2 mt-1.5 opacity-60">
              <div className="w-4 h-4 rounded border border-green-400 bg-green-100 flex-shrink-0 flex items-center justify-center">
                <Check className="w-2.5 h-2.5 text-green-600" />
              </div>
              <span className="flex-1 text-sm text-gray-500 line-through">{task.title}</span>
            </div>
          ))}

          <button onClick={() => setShowTaskModal(true)}
            className="flex items-center gap-1.5 mt-3 text-sm font-medium hover:underline" style={{ color: "#1E5FA8" }}>
            <Plus className="w-3.5 h-3.5" /> הוסף משימה
          </button>
        </div>
      </div>

      {/* Task modal */}
      {(showTaskModal || editTask) && (
        <TaskModal
          task={editTask || null}
          parentGoalId={goal.id}
          onClose={() => { setShowTaskModal(false); setEditTask(null); }}
          onSaved={() => { setShowTaskModal(false); setEditTask(null); onRefresh(); }}
        />
      )}

      {/* Goal complete prompt */}
      {goalCompletePrompt && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full text-center">
            <div className="text-4xl mb-3">🎯</div>
            <h3 className="font-bold text-gray-900 mb-2">כל המשימות הושלמו!</h3>
            <p className="text-sm text-gray-600 mb-5">כל המשימות של "{goal.title}" הושלמו! האם לסמן את המטרה כהושלמה?</p>
            <div className="flex gap-3 justify-center">
              <button onClick={handleCompleteGoal}
                className="px-4 py-2 rounded-lg text-white text-sm font-medium" style={{ backgroundColor: "#1E5FA8" }}>
                כן, סמן כהושלם 🎉
              </button>
              <button onClick={() => { setGoalCompletePrompt(false); onRefresh(); }}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700">לא עדיין</button>
            </div>
          </div>
        </div>
      )}

      {/* Celebration overlay */}
      {celebration && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" dir="rtl">
          <div className="text-center text-white">
            <div className="text-8xl mb-4">🏆</div>
            <h2 className="text-3xl font-bold mb-2">כל הכבוד!</h2>
            <p className="text-lg opacity-80">השלמת את המטרה: "{goal.title}"</p>
            <button onClick={() => { setCelebration(false); onRefresh(); }}
              className="mt-6 px-6 py-3 rounded-xl text-white border border-white/40 hover:bg-white/10">
              המשך ←
            </button>
          </div>
        </div>
      )}
    </>
  );
}