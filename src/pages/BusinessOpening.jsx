import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import confetti from "canvas-confetti";
import { checkAndUnlockAchievements } from "../lib/achievements";
import BusinessStepWizard from "../components/BusinessStepWizard";
import CompletionSummaryCard from "../components/CompletionSummaryCard";
import PortalDowntimeBanner from "../components/PortalDowntimeBanner";

const STEP_DEFS = [
  { key: "bank_account", icon: "🏦", title: "פתיחת חשבון בנק עסקי", description: "פתח חשבון בנק ייעודי לעסק שלך.", portalUrl: "https://www.bankhapoalim.co.il", authority: "בנקים בישראל" },
  { key: "vat_file",     icon: "📋", title: 'פתיחת תיק מע"מ',        description: 'פתח תיק מע"מ ברשות המיסים.',        portalUrl: "https://www.misim.gov.il/eovhv/Main.aspx", authority: 'רשות המיסים — מע"מ' },
  { key: "tax_file",     icon: "📊", title: "פתיחת תיק מס הכנסה",    description: "רשום את עצמך כעצמאי במס הכנסה.",  portalUrl: "https://www.misim.gov.il", authority: "רשות המיסים — מס הכנסה" },
  { key: "nii",          icon: "🛡️", title: "הצהרה לביטוח לאומי",    description: "הצהר על פתיחת העסק בביטוח לאומי.", portalUrl: "https://www.btl.gov.il/online-services/", authority: "המוסד לביטוח לאומי" },
];

const STATUS_LABELS = {
  not_started:     { label: "טרם התחיל",        cls: "bg-gray-100 text-gray-600" },
  in_progress:     { label: "בתהליך",           cls: "bg-blue-100 text-blue-700 animate-pulse" },
  completed:       { label: "הושלם ✓",          cls: "bg-green-100 text-green-700" },
  partial:         { label: "הושלם חלקית",      cls: "bg-orange-100 text-orange-700" },
  manual_fallback: { label: "ידני",             cls: "bg-orange-100 text-orange-700" },
  skipped:         { label: "דולג",             cls: "bg-gray-100 text-gray-400" },
  queued:          { label: "ממתין",            cls: "bg-gray-100 text-gray-500" },
};

function StepCard({ def, step, onUpdate, onOpenWizard }) {
  const [expanded, setExpanded] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [updating, setUpdating] = useState(false);
  const status = step.status || "not_started";
  const isPartial = status === "partial";
  const isDone = status === "completed" || isPartial;
  const statusInfo = STATUS_LABELS[status] || STATUS_LABELS.not_started;
  const confirmNum = step.draft_data?.confirmationNumber;
  const screenshotUrl = step.draft_data?.screenshotUrl;
  const wizardStep = step.draft_data?.wizardStep ?? 0;

  async function setStatus(s) {
    setUpdating(true);
    const data = { status: s };
    if (s === "completed") data.submitted_at = new Date().toISOString();
    if (s === "not_started") { data.draft_data = {}; data.submitted_at = null; }
    await base44.entities.BusinessOpeningStep.update(step.id, data);
    onUpdate(step.id, data);
    setUpdating(false);
    checkAndUnlockAchievements().catch(() => {});
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4" id={`step-${def.key}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{def.icon}</span>
          <div>
            <h3 className="font-bold text-gray-900 text-base">{def.title}</h3>
            <p className="text-sm text-gray-500">{def.description}</p>
            {status === "in_progress" && wizardStep > 0 && (
              <p className="text-xs text-blue-600 mt-0.5">שלב {wizardStep + 1} הושלם במדריך</p>
            )}
          </div>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 mr-2 ${statusInfo.cls}`}>
          {statusInfo.label}
        </span>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-gray-100">
        {(status === "not_started" || status === "queued") && (
          <>
            <button onClick={() => onOpenWizard(def.key)}
              className="px-4 py-2 rounded-lg text-white text-sm font-medium"
              style={{ backgroundColor: "#1E5FA8" }}>
              התחל מדריך ←
            </button>
            <button onClick={() => setStatus("skipped")} disabled={updating}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50">
              דלג
            </button>
          </>
        )}

        {status === "in_progress" && (
          <>
            <button onClick={() => onOpenWizard(def.key)}
              className="px-4 py-2 rounded-lg text-white text-sm font-medium"
              style={{ backgroundColor: "#1E5FA8" }}>
              המשך מדריך ←
            </button>
          </>
        )}

        {isDone && (
          <div className="flex flex-1 items-center justify-between flex-wrap gap-2">
            <div className={`text-sm font-medium flex items-center gap-2 ${isPartial ? "text-orange-700" : "text-green-700"}`}>
              <span className="text-base">{isPartial ? "⚠️" : "✅"}</span>
              {isPartial ? "הושלם חלקית" : "הושלם"}{step.submitted_at ? ` ב-${format(new Date(step.submitted_at), "dd/MM/yyyy")}` : ""}
              {confirmNum && <span className="text-gray-500 font-normal text-xs">| מספר תיק: {confirmNum}</span>}
            </div>
            <div className="flex items-center gap-2">
              {screenshotUrl && (
                <a href={screenshotUrl} target="_blank" rel="noopener noreferrer">
                  <img src={screenshotUrl} className="w-10 h-10 object-cover rounded border border-gray-200" alt="screenshot" />
                </a>
              )}
              <button onClick={() => setExpanded(v => !v)}
                className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
                {expanded ? "סגור" : "צפה בפרטים"}
              </button>
              {isPartial && (
                <button onClick={() => onOpenWizard(def.key)}
                  className="text-xs px-3 py-1.5 rounded-lg text-white font-medium" style={{ backgroundColor: "#C25A00" }}>
                  השלם פרטים ←
                </button>
              )}
              <button onClick={() => setConfirmReset(true)} disabled={updating}
                className="text-xs text-gray-400 hover:text-gray-600 underline disabled:opacity-50">
                בטל סימון
              </button>
            </div>
          </div>
        )}

        {status === "skipped" && (
          <>
            <span className="text-sm text-gray-400">השלב דולג</span>
            <button onClick={() => setStatus("not_started")} disabled={updating}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50">
              חזור לשלב
            </button>
          </>
        )}

        {status === "manual_fallback" && (
          <button onClick={() => onOpenWizard(def.key)}
            className="px-4 py-2 rounded-lg text-white text-sm font-medium"
            style={{ backgroundColor: "#1E5FA8" }}>
            התחל מדריך ←
          </button>
        )}
      </div>

      {/* Confirm reset modal */}
      {confirmReset && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <p className="text-3xl mb-3">⚠️</p>
            <h2 className="text-lg font-bold text-gray-900 mb-2">ביטול סימון שלב</h2>
            <p className="text-sm text-gray-600 mb-5">האם אתה בטוח שברצונך לבטל את סימון השלב?<br />יש לציין כי פרטים שנמחקו לא ניתן לשחזר.</p>
            <div className="flex gap-3">
              <button onClick={async () => { setConfirmReset(false); await setStatus("not_started"); }}
                className="flex-1 py-2.5 rounded-xl text-white font-medium bg-red-500 hover:bg-red-600">
                כן, למחוק
              </button>
              <button onClick={() => setConfirmReset(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50">
                לא למחוק
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details modal */}
      {expanded && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-5">פרטי השלב — {def.title}</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">תאריך השלמה:</span>
                <span className="font-semibold text-gray-800">
                  {step.submitted_at ? format(new Date(step.submitted_at), "dd/MM/yyyy") : "לא ידוע"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">מספר תיק/אישור:</span>
                <span className="font-semibold text-gray-800">{confirmNum || "לא הוזן"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">סטאטוס:</span>
                <span className={`font-semibold ${isPartial ? "text-orange-600" : "text-green-700"}`}>
                  {isPartial ? "הושלם חלקית" : "הושלם ✓"}
                </span>
              </div>
              {screenshotUrl && (
                <div className="mt-3">
                  <p className="text-gray-500 mb-2">צילום מסך אישור:</p>
                  <a href={screenshotUrl} target="_blank" rel="noopener noreferrer">
                    <img src={screenshotUrl} className="w-full rounded-lg border border-gray-200 object-cover" alt="screenshot" style={{ maxHeight: 200 }} />
                  </a>
                </div>
              )}
            </div>
            <button onClick={() => setExpanded(false)}
              className="mt-6 w-full py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50">
              סגור
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BusinessOpening() {
  const navigate = useNavigate();
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [user, setUser] = useState(null);
  const [celebrated, setCelebrated] = useState(false);
  const [activeWizard, setActiveWizard] = useState(null);
  const [portalStatus, setPortalStatus] = useState({});

  useEffect(() => { document.title = 'פתיחת עסק | Fresh Start'; }, []);

  useEffect(() => {
    async function load(attempt = 0) {
      try {
        const u = await base44.auth.me();
        setUser(u);
        let existing = await base44.entities.BusinessOpeningStep.filter({ created_by: u.email });
        if (existing.length === 0) {
          const keys = ["bank_account", "vat_file", "tax_file", "nii"];
          existing = await Promise.all(keys.map(k => base44.entities.BusinessOpeningStep.create({ step_key: k, status: "not_started" })));
        }
        setSteps(existing);
        const profiles = await base44.entities.UserProfile.filter({ created_by: u.email });
        setProfile(profiles[0] || null);
        setLoading(false);
      } catch (err) {
        if (attempt < 3) {
          setTimeout(() => load(attempt + 1), 1000 * (attempt + 1));
        } else {
          setLoading(false);
        }
      }
    }
    const delay = setTimeout(() => load(), 300);
    return () => clearTimeout(delay);
  }, []);

  useEffect(() => {
    if (!steps.length) return;
    STEP_DEFS.forEach(async def => {
      try {
        await fetch(def.portalUrl, { method: "HEAD", mode: "no-cors" });
        setPortalStatus(p => ({ ...p, [def.key]: "ok" }));
      } catch {
        setPortalStatus(p => ({ ...p, [def.key]: "error" }));
      }
    });
  }, [steps.length]);

  function handleUpdate(id, data) {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
  }

  const completedCount = steps.filter(s => s.status === "completed").length;
  const partialSteps = steps.filter(s => s.status === "partial");
  const allDone = completedCount === 4 && steps.length === 4;

  useEffect(() => {
    if (allDone && !celebrated) {
      setCelebrated(true);
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.4 } });
    }
  }, [allDone]);

  const getStep = (key) => steps.find(s => s.step_key === key);

  const notStartedSteps = STEP_DEFS.filter(d => {
    const s = getStep(d.key);
    return !s || s.status === "not_started" || s.status === "queued";
  });
  const estimatedMinutes = notStartedSteps.length * 30;
  const nextStep = notStartedSteps[0];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8" dir="rtl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">פתיחת עסק</h1>

      {allDone && <CompletionSummaryCard steps={steps} profile={profile} />}

      {/* Progress Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-700">השלמת {completedCount} מתוך 4 שלבים</span>
          <span className="text-sm font-bold" style={{ color: "#1E5FA8" }}>{Math.round((completedCount / 4) * 100)}%</span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-3">
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${(completedCount / 4) * 100}%`, backgroundColor: "#1E5FA8" }} />
        </div>

        {allDone ? (
          <p className="text-sm text-green-700 font-medium">כל השלבים הושלמו! 🎉</p>
        ) : (
          <div className="flex flex-col gap-2 text-sm">
            {estimatedMinutes > 0 && (
              <span className="text-gray-500">⏱ זמן משוער להשלמה: {estimatedMinutes} דקות</span>
            )}
            {nextStep && (
              <div className="flex items-center gap-2">
                <span className="text-gray-500">השלב הבא: <strong className="text-gray-800">{nextStep.title}</strong></span>
                <button onClick={() => setActiveWizard(nextStep.key)}
                  className="text-xs px-3 py-1.5 rounded-lg text-white font-medium"
                  style={{ backgroundColor: "#1E5FA8" }}>
                  התחל עכשיו ←
                </button>
              </div>
            )}
            {/* Partial steps warning */}
            {partialSteps.length > 0 && (
              <div className="text-xs font-medium flex flex-wrap gap-x-3 gap-y-1" style={{ color: "#C25A00" }}>
                <span>שלבים שהושלמו חלקית:</span>
                {partialSteps.map((s) => {
                  const def = STEP_DEFS.find(d => d.key === s.step_key);
                  return (
                    <button
                      key={s.step_key}
                      onClick={() => setActiveWizard(s.step_key)}
                      className="underline cursor-pointer hover:opacity-80">
                      {def?.title} ← לחץ להשלמה
                    </button>
                  );
                })}
              </div>
            )}
            {/* Incomplete steps */}
            {(() => {
              const incomplete = STEP_DEFS.filter(d => {
                const s = getStep(d.key);
                return !s || (s.status !== "completed" && s.status !== "partial");
              });
              if (incomplete.length === 0) return null;
              return (
                <p className="text-xs text-gray-500">
                  שלבים שטרם הושלמו:{" "}
                  {incomplete.map((d, i) => (
                    <span key={d.key}>
                      <button
                        onClick={() => document.getElementById(`step-${d.key}`)?.scrollIntoView({ behavior: "smooth", block: "center" })}
                        className="underline text-blue-600 hover:text-blue-800">
                        {d.title}
                      </button>
                      {i < incomplete.length - 1 ? ", " : ""}
                    </span>
                  ))}
                </p>
              );
            })()}
          </div>
        )}
      </div>

      {/* Step Cards */}
      {STEP_DEFS.map(def => {
        const step = getStep(def.key);
        if (!step) return null;
        return (
          <div key={def.key}>
            {portalStatus[def.key] === "error" && step.status !== "completed" && step.status !== "partial" && (
              <div className="mb-2">
                <PortalDowntimeBanner authority={def.authority} portalUrl={def.portalUrl} />
              </div>
            )}
            <StepCard
              def={def}
              step={step}
              onUpdate={handleUpdate}
              onOpenWizard={setActiveWizard}
            />
          </div>
        );
      })}

      {/* Wizard overlay */}
      {activeWizard && (
        <BusinessStepWizard
          stepKey={activeWizard}
          stepRecord={getStep(activeWizard) || { status: "not_started" }}
          profile={profile}
          user={user}
          startConfirmed={getStep(activeWizard)?.status === "partial"}
          onComplete={() => {
            setActiveWizard(null);
            base44.auth.me().then(u =>
              base44.entities.BusinessOpeningStep.filter({ created_by: u.email })
                .then(setSteps)
            );
            base44.auth.me().then(u =>
              base44.entities.UserProfile.filter({ created_by: u.email })
                .then(r => setProfile(r[0] || null))
            );
          }}
          onClose={() => setActiveWizard(null)}
        />
      )}
    </div>
  );
}