import { useState } from "react";
import { Check, X, ExternalLink, Upload } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { checkAndUnlockAchievements } from "../lib/achievements";

export default function GuidedSubmissionWizard({
  stepKey,
  stepTitle,
  authority,
  portalUrl,
  instructions,
  prefillData,
  onComplete,
  onClose,
  stepRecord,
  isPartial = false,
  stepValidation = {},
}) {
  const savedStep = stepRecord?.draft_data?.wizardStep ?? 0;
  const [activeStep, setActiveStep] = useState(savedStep);
  const [confirmed, setConfirmed] = useState(false);
  const [confirmNum, setConfirmNum] = useState("");
  const [screenshotUrl, setScreenshotUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [portalUnreachable, setPortalUnreachable] = useState(false);

  const total = instructions.length;

  async function saveProgress(stepIdx) {
    if (!stepRecord?.id) return;
    await base44.entities.BusinessOpeningStep.update(stepRecord.id, {
      draft_data: { ...(stepRecord.draft_data || {}), wizardStep: stepIdx },
      status: "in_progress",
    });
  }

  function goNext() {
    // Validate current step if a validator exists
    const validator = stepValidation[activeStep];
    if (validator && !validator.check()) {
      setValidationError(validator.message);
      return;
    }
    setValidationError("");
    const next = Math.min(activeStep + 1, total - 1);
    setActiveStep(next);
    saveProgress(next);
  }

  function goPrev() {
    setValidationError("");
    const prev = Math.max(activeStep - 1, 0);
    setActiveStep(prev);
    saveProgress(prev);
  }

  async function handleScreenshotUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const today = new Date().toISOString().slice(0, 10);
    await base44.entities.Document.create({
      file_name: `אישור_${stepKey}_${today}`,
      file_type: "jpg",
      file_size_kb: Math.round(file.size / 1024),
      storage_path: file_url,
      category: "form",
      status: "active",
    });
    setScreenshotUrl(file_url);
    setUploading(false);
  }

  async function handleMarkComplete() {
    setSaving(true);
    await base44.entities.BusinessOpeningStep.update(stepRecord.id, {
      status: "completed",
      submitted_at: new Date().toISOString(),
      draft_data: {
        ...(stepRecord.draft_data || {}),
        confirmationNumber: confirmNum,
        screenshotUrl,
        partial: isPartial,
      },
    });
    await checkAndUnlockAchievements().catch(() => {});
    setSaving(false);
    setSuccess(true);
    setTimeout(() => onComplete(), 1500);
  }

  async function openPortal() {
    window.open(portalUrl, "_blank");
    try {
      await fetch(portalUrl, { method: "HEAD", mode: "no-cors" });
    } catch {
      setPortalUnreachable(true);
    }
  }

  // ── Instruction step list (shared between desktop/mobile) ──────────────
  function InstructionList() {
    return (
      <div className="space-y-3">
        {instructions.map((inst, i) => {
          const isActive = i === activeStep;
          const isDone = i < activeStep;
          return (
            <div
              key={i}
              onClick={() => { setValidationError(""); setActiveStep(i); saveProgress(i); }}
              className={`rounded-xl p-3 cursor-pointer transition-all border ${
                isActive
                  ? "bg-white border-blue-300 shadow-sm"
                  : isDone
                  ? "bg-green-50 border-green-200 opacity-70"
                  : "bg-white border-gray-200 hover:border-gray-300"
              }`}
              style={isActive ? { borderRightColor: "#1E5FA8", borderRightWidth: "4px" } : {}}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                  style={{
                    backgroundColor: isDone ? "#1A7A4A" : isActive ? "#1E5FA8" : "#E5E7EB",
                    color: isDone || isActive ? "white" : "#6B7280",
                  }}
                >
                  {isDone ? <Check className="w-3.5 h-3.5" /> : i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${isDone ? "text-green-700" : isActive ? "text-gray-900" : "text-gray-500"}`}>
                    {inst.title}
                  </p>
                  {isActive && (
                    <>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">{inst.description}</p>
                      {inst.tip && (
                        <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 text-xs text-yellow-800">
                          💡 טיפ: {inst.tip}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Validation error */}
        {validationError && (
          <p className="text-sm text-red-600 font-medium px-1">{validationError}</p>
        )}

        {/* Nav buttons — inline, scroll with content */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={goPrev}
            disabled={activeStep === 0}
            className="flex items-center justify-center gap-1 px-4 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-40 transition-colors"
            style={{ minHeight: "52px", flex: "0 0 auto", paddingInline: "20px" }}
          >
            הקודם
          </button>
          <button
            onClick={goNext}
            disabled={activeStep === total - 1}
            className="flex-1 flex items-center justify-center gap-1 rounded-xl text-white font-bold disabled:opacity-40 transition-colors"
            style={{ minHeight: "52px", fontSize: "18px", backgroundColor: "#1E5FA8" }}
          >
            הבא ←
          </button>
        </div>
        <p className="text-xs text-center text-gray-400">שלב {activeStep + 1} מתוך {total}</p>
      </div>
    );
  }

  // ── Right / bottom action area (shared) ───────────────────────────────
  function ActionArea() {
    return (
      <div className="flex flex-col gap-5">
        {/* Prefill card */}
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm font-bold text-blue-900 mb-3">הנתונים שיוגשו</p>
          <div className="space-y-2">
            {prefillData.map(({ label, value }) => (
              <div key={label} className="flex items-start gap-2">
                <span className="text-xs text-gray-500 w-36 flex-shrink-0 mt-0.5">{label}:</span>
                {value ? (
                  <span className="text-sm font-semibold text-gray-800">{value}</span>
                ) : (
                  <span className="text-sm text-red-500 font-medium">
                    חסר —{" "}
                    <a href="/profile" className="underline text-red-600">עדכן פרופיל ←</a>
                  </span>
                )}
              </div>
            ))}
          </div>
          <p className="text-[10px] text-blue-600 mt-3">הנתונים נשמרים בפרופיל שלך ומעודכנים אוטומטית</p>
        </div>

        {/* Portal downtime */}
        {portalUnreachable && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800">
            <p className="font-semibold">הפורטל {authority} אינו זמין כרגע.</p>
            <p className="text-xs mt-0.5">המידע שלך נשמר. נסה שוב מאוחר יותר.</p>
          </div>
        )}

        {/* Open portal */}
        <button
          onClick={openPortal}
          className="w-full py-4 rounded-xl text-white text-base font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          style={{ backgroundColor: "#1E5FA8" }}
        >
          <ExternalLink className="w-5 h-5" />
          פתח פורטל {authority} ←
        </button>
        <p className="text-xs text-gray-400 text-center -mt-3">
          הפורטל יפתח בחלון חדש. בצע את השלבים המפורטים.
        </p>

        {/* Completion */}
        <div className="border border-gray-200 rounded-xl p-5">
          <label className="flex items-center gap-3 cursor-pointer mb-4">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={e => setConfirmed(e.target.checked)}
              className="w-4 h-4 rounded accent-blue-600"
            />
            <span className="text-sm font-semibold text-gray-800">סיימתי את כל השלבים בפורטל</span>
          </label>

          {confirmed && !success && (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-600 block mb-1">מספר אישור / מספר תיק (אופציונלי)</label>
                <input
                  type="text"
                  value={confirmNum}
                  onChange={e => setConfirmNum(e.target.value)}
                  placeholder="לדוגמה: 123456789"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
                  dir="rtl"
                />
                <p className="text-[11px] text-gray-400 mt-1">מספר האישור מופיע באימייל או בדף האישור של הפורטל</p>
              </div>

              <div>
                <label className="text-xs text-gray-600 block mb-1">העלה צילום מסך של האישור (אופציונלי)</label>
                {screenshotUrl ? (
                  <div className="flex items-center gap-2 text-sm text-green-700">
                    <Check className="w-4 h-4" />
                    צילום מסך הועלה בהצלחה ✓
                  </div>
                ) : (
                  <label className="flex items-center gap-2 cursor-pointer px-4 py-2 rounded-lg border border-dashed border-gray-300 hover:border-blue-400 text-sm text-gray-500 hover:text-blue-600 transition-colors w-fit">
                    <Upload className="w-4 h-4" />
                    {uploading ? "מעלה..." : "בחר תמונה"}
                    <input type="file" accept="image/*" className="hidden" onChange={handleScreenshotUpload} disabled={uploading} />
                  </label>
                )}
              </div>

              <button
                onClick={handleMarkComplete}
                disabled={saving}
                className="w-full py-3 rounded-xl text-white font-bold text-base disabled:opacity-60"
                style={{ backgroundColor: "#1A7A4A" }}
              >
                {saving ? "שומר..." : "סמן שלב כהושלם ✓"}
              </button>
            </div>
          )}

          {success && (
            <div className="text-center py-4">
              <p className="text-2xl mb-2">🎉</p>
              <p className="font-bold text-green-700 text-base">השלב הושלם בהצלחה!</p>
            </div>
          )}
        </div>

        <p className="text-xs text-gray-400 text-center">
          ⚙️ אוטומציה מלאה תהיה זמינה בגרסה הבאה.<br />
          כרגע יש לבצע את הפעולות ידנית בפורטל.
        </p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-2 md:p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 flex-shrink-0">
          <div>
            <p className="text-xs text-gray-500 font-medium">{authority}</p>
            <h2 className="text-base md:text-lg font-bold text-gray-900">{stepTitle}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body — desktop: side by side | mobile: single column */}
        <div className="flex-1 overflow-y-auto">
          {/* DESKTOP layout */}
          <div className="hidden md:flex h-full">
            {/* Left: Instructions */}
            <div className="w-[40%] flex flex-col border-l border-gray-100 bg-gray-50 overflow-y-auto p-5">
              <InstructionList />
            </div>
            {/* Right: Action area */}
            <div className="flex-1 overflow-y-auto p-6">
              <ActionArea />
            </div>
          </div>

          {/* MOBILE layout — single column */}
          <div className="md:hidden p-4 space-y-6">
            {/* Prefill first */}
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
              <p className="text-sm font-bold text-blue-900 mb-3">הנתונים שיוגשו</p>
              <div className="space-y-2">
                {prefillData.map(({ label, value }) => (
                  <div key={label} className="flex items-start gap-2">
                    <span className="text-xs text-gray-500 w-32 flex-shrink-0 mt-0.5">{label}:</span>
                    {value ? (
                      <span className="text-sm font-semibold text-gray-800">{value}</span>
                    ) : (
                      <span className="text-sm text-red-500">
                        חסר — <a href="/profile" className="underline">עדכן פרופיל ←</a>
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-gray-50 rounded-xl p-4">
              <InstructionList />
            </div>

            {/* Portal button */}
            {portalUnreachable && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800">
                <p className="font-semibold">הפורטל {authority} אינו זמין כרגע.</p>
              </div>
            )}
            <button
              onClick={openPortal}
              className="w-full py-4 rounded-xl text-white text-base font-bold flex items-center justify-center gap-2"
              style={{ backgroundColor: "#1E5FA8", minHeight: "56px" }}
            >
              <ExternalLink className="w-5 h-5" />
              פתח פורטל {authority} ←
            </button>

            {/* Completion */}
            <div className="border border-gray-200 rounded-xl p-5">
              <label className="flex items-center gap-3 cursor-pointer mb-4">
                <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} className="w-4 h-4 accent-blue-600" />
                <span className="text-sm font-semibold text-gray-800">סיימתי את כל השלבים בפורטל</span>
              </label>
              {confirmed && !success && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-gray-600 block mb-1">מספר אישור / מספר תיק (אופציונלי)</label>
                    <input type="text" value={confirmNum} onChange={e => setConfirmNum(e.target.value)}
                      placeholder="לדוגמה: 123456789"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400" dir="rtl" />
                    <p className="text-[11px] text-gray-400 mt-1">מספר האישור מופיע באימייל או בדף האישור של הפורטל</p>
                  </div>
                  <button onClick={handleMarkComplete} disabled={saving}
                    className="w-full py-3 rounded-xl text-white font-bold text-base disabled:opacity-60"
                    style={{ backgroundColor: "#1A7A4A", minHeight: "52px" }}>
                    {saving ? "שומר..." : "סמן שלב כהושלם ✓"}
                  </button>
                </div>
              )}
              {success && (
                <div className="text-center py-4">
                  <p className="text-2xl mb-2">🎉</p>
                  <p className="font-bold text-green-700">השלב הושלם בהצלחה!</p>
                </div>
              )}
            </div>

            <p className="text-xs text-gray-400 text-center pb-2">
              ⚙️ אוטומציה מלאה תהיה זמינה בגרסה הבאה.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}