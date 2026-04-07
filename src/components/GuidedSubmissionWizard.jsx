import { useState } from "react";
import { Check, ChevronRight, ChevronLeft, X, ExternalLink, Upload } from "lucide-react";
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
}) {
  const savedStep = stepRecord?.draft_data?.wizardStep ?? 0;
  const [activeStep, setActiveStep] = useState(savedStep);
  const [done, setDone] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [confirmNum, setConfirmNum] = useState("");
  const [screenshotUrl, setScreenshotUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
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
    const next = Math.min(activeStep + 1, total - 1);
    setActiveStep(next);
    saveProgress(next);
  }

  function goPrev() {
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
      },
    });
    await checkAndUnlockAchievements().catch(() => {});
    setSaving(false);
    setSuccess(true);
    setTimeout(() => { onComplete(); }, 1500);
  }

  async function openPortal() {
    window.open(portalUrl, "_blank");
    // Check reachability passively
    try {
      await fetch(portalUrl, { method: "HEAD", mode: "no-cors" });
    } catch {
      setPortalUnreachable(true);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div>
            <p className="text-xs text-gray-500 font-medium">{authority}</p>
            <h2 className="text-lg font-bold text-gray-900">{stepTitle}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* LEFT PANEL — Instructions */}
          <div className="w-[40%] flex flex-col border-l border-gray-100 bg-gray-50 overflow-y-auto">
            <div className="p-5 flex-1">
              <p className="text-xs text-gray-500 mb-4 font-medium">שלב {activeStep + 1} מתוך {total}</p>
              <div className="space-y-3">
                {instructions.map((inst, i) => {
                  const isActive = i === activeStep;
                  const isDone = i < activeStep;
                  return (
                    <div
                      key={i}
                      onClick={() => { setActiveStep(i); saveProgress(i); }}
                      className={`rounded-xl p-3 cursor-pointer transition-all border ${
                        isActive
                          ? "bg-white border-blue-300 border-r-4 shadow-sm"
                          : isDone
                          ? "bg-green-50 border-green-200 opacity-70"
                          : "bg-white border-gray-200 hover:border-gray-300"
                      }`}
                      style={isActive ? { borderRightColor: "#1E5FA8" } : {}}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                          style={{ backgroundColor: isDone ? "#1A7A4A" : isActive ? "#1E5FA8" : "#E5E7EB", color: isDone || isActive ? "white" : "#6B7280" }}
                        >
                          {isDone ? <Check className="w-3.5 h-3.5" /> : i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold ${isDone ? "text-green-700" : isActive ? "text-gray-900" : "text-gray-600"}`}>
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
              </div>
            </div>

            {/* Navigation */}
            <div className="px-5 pb-5 flex gap-2 flex-shrink-0">
              <button
                onClick={goPrev}
                disabled={activeStep === 0}
                className="flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
                הקודם
              </button>
              <button
                onClick={goNext}
                disabled={activeStep === total - 1}
                className="flex-1 flex items-center justify-center gap-1 px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-40"
                style={{ backgroundColor: "#1E5FA8" }}
              >
                הבא
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* RIGHT PANEL — Action area */}
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
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

            {/* Portal downtime banner */}
            {portalUnreachable && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800">
                <p className="font-semibold">הפורטל {authority} אינו זמין כרגע.</p>
                <p className="text-xs mt-0.5">המידע שלך נשמר. נסה שוב מאוחר יותר.</p>
              </div>
            )}

            {/* Open portal button */}
            <button
              onClick={openPortal}
              className="w-full py-4 rounded-xl text-white text-base font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
              style={{ backgroundColor: "#1E5FA8" }}
            >
              <ExternalLink className="w-5 h-5" />
              פתח פורטל {authority} ←
            </button>
            <p className="text-xs text-gray-400 text-center -mt-3">
              הפורטל יפתח בחלון חדש. בצע את השלבים המפורטים משמאל.
            </p>

            {/* Completion section */}
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
                    <label className="text-xs text-gray-600 block mb-1">מספר אישור / מספר תיק (אם קיבלת)</label>
                    <input
                      type="text"
                      value={confirmNum}
                      onChange={e => setConfirmNum(e.target.value)}
                      placeholder="לדוגמה: 123456789"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
                      dir="rtl"
                    />
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
                    className="w-full py-3 rounded-xl text-white font-bold text-base disabled:opacity-60 transition-opacity"
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

            {/* Manual fallback notice */}
            <p className="text-xs text-gray-400 text-center">
              ⚙️ אוטומציה מלאה תהיה זמינה בגרסה הבאה.<br />
              כרגע יש לבצע את הפעולות ידנית בפורטל.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}