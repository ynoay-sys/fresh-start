import { useState, useRef, useEffect, useCallback } from "react";
import { Check, X, ExternalLink, Upload } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { checkAndUnlockAchievements } from "../lib/achievements";

// Steps that require a file/confirmation number to be "fully complete"
const REQUIRES_NUMBER_STEPS = ["vat_file", "tax_file", "nii"];

// ── Israeli ID checksum validation ────────────────────────────────────────
function isValidIsraeliID(id) {
  id = String(id).padStart(9, "0");
  if (id.length !== 9) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let digit = parseInt(id[i]);
    if (i % 2 === 0) {
      sum += digit;
    } else {
      let doubled = digit * 2;
      sum += doubled > 9 ? doubled - 9 : doubled;
    }
  }
  return sum % 10 === 0;
}

// ── Toast component ────────────────────────────────────────────────────────
function InvalidKeyToast({ onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 10000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div
      className="fixed top-4 left-1/2 z-[9999] flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-white text-sm font-medium"
      style={{ transform: "translateX(-50%)", backgroundColor: "#C25A00", minWidth: 280, maxWidth: 380 }}
      dir="rtl"
    >
      <span className="flex-1">יש להכניס עד 9 תווים, אין להזין אותיות אלא רק מספרים</span>
      <button onClick={onDismiss} className="p-1 rounded hover:bg-white/20 flex-shrink-0">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// ── Isolated confirm-number input — defined at module scope to prevent remount ──
function ConfirmNumInput({ stepKey, onCommit, inputRef }) {
  const [localVal, setLocalVal] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastShownOnce, setToastShownOnce] = useState(false);
  const [isIdMode, setIsIdMode] = useState(false);
  const [idError, setIdError] = useState("");
  const [highlighted, setHighlighted] = useState(false);

  // Expose highlight/clearHighlight to parent via ref
  useEffect(() => {
    if (inputRef) inputRef.current = { highlight: () => setHighlighted(true), clearHighlight: () => setHighlighted(false) };
  });

  const isVat = stepKey === "vat_file";
  const paddedId = isIdMode && localVal ? String(localVal).padStart(9, "0") : null;

  // Sync value + validity up to parent whenever they change
  useEffect(() => {
    if (isIdMode) {
      const padded = localVal ? String(localVal).padStart(9, "0") : "";
      onCommit(padded, true, localVal ? isValidIsraeliID(localVal) : null);
    } else {
      onCommit(localVal, false, null);
    }
  }, [localVal, isIdMode]);

  function handleKeyDown(e) {
    if (e.key.length === 1 && !/\d/.test(e.key) && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      if (!toastShownOnce) {
        setShowToast(true);
        setToastShownOnce(true);
      }
    }
  }

  function handleChange(e) {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 9);
    setLocalVal(digits);
    setIdError("");
    if (digits === "") setToastShownOnce(false);
  }

  function handleIdModeChange(checked) {
    setIsIdMode(checked);
    setIdError("");
    // Do NOT clear localVal — keep existing value, just toggle validation mode
  }

  const hintText = isIdMode
    ? "הכנס את מספר תעודת הזהות שלך (עד 9 ספרות)"
    : "מספר התיק מופיע באימייל או בדף האישור של הפורטל";

  const inputStyle = highlighted
    ? { backgroundColor: "#FFEEEE", border: "2px solid #AA1111" }
    : {};

  const checkboxLabelStyle = highlighted
    ? { backgroundColor: "#FFFDE7", fontWeight: "bold", padding: "2px 4px", borderRadius: 4 }
    : {};

  const checkboxStyle = highlighted
    ? { outline: "2px solid #C25A00" }
    : {};

  return (
    <>
      {showToast && <InvalidKeyToast onDismiss={() => setShowToast(false)} />}
      <div>
        <label className="text-xs text-gray-600 block mb-1">מספר תיק/אישור (אופציונלי)</label>
        <input
          type="text"
          inputMode="numeric"
          value={localVal}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="לדוגמה: 123456789"
          className="w-full rounded-lg px-3 py-2 text-sm outline-none"
          style={{ border: "1px solid #e5e7eb", ...inputStyle }}
          dir="ltr"
          autoComplete="off"
        />
        {isIdMode && localVal && (
          <p className="text-xs text-gray-400 mt-1">המספר שישמר: <span className="font-mono font-semibold text-gray-600">{paddedId}</span></p>
        )}
        {idError && <p className="text-xs text-red-600 mt-1">{idError}</p>}
        <p className="text-[11px] text-gray-400 mt-1">{hintText}</p>

        {isVat && (
          <label className="flex items-center gap-2 mt-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isIdMode}
              onChange={e => handleIdModeChange(e.target.checked)}
              className="w-3.5 h-3.5"
              style={checkboxStyle}
            />
            <span className="text-xs text-gray-600" style={checkboxLabelStyle}>מספר זה הינו מספר תעודת הזהות שלי</span>
          </label>
        )}
      </div>
    </>
  );
}

// ── InstructionList — module scope ─────────────────────────────────────────
function InstructionList({ instructions, activeStep, setActiveStep, saveProgress, validationError, goNext, goPrev }) {
  const total = instructions.length;
  return (
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

      {validationError && (
        <p className="text-sm text-red-600 font-medium px-1">{validationError}</p>
      )}

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

// ── Main component ─────────────────────────────────────────────────────────
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
  profileFieldKey = null,
  profileId = null,
  stepValidation = {},
}) {
  const savedStep = stepRecord?.draft_data?.wizardStep ?? 0;
  const [activeStep, setActiveStep] = useState(savedStep);
  const [confirmed, setConfirmed] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [portalUnreachable, setPortalUnreachable] = useState(false);
  const [confirmNumError, setConfirmNumError] = useState("");

  // Committed state from ConfirmNumInput
  const committedRef = useRef({ value: "", isIdMode: false, isIdValid: null });
  const confirmInputRef = useRef(null);
  const [shortNumModal, setShortNumModal] = useState(false);
  const [shortNumInfoOpen, setShortNumInfoOpen] = useState(false);

  const total = instructions.length;

  const handleCommit = useCallback((value, isIdMode, isIdValid) => {
    committedRef.current = { value, isIdMode, isIdValid };
  }, []);

  async function saveProgress(stepIdx) {
    if (!stepRecord?.id) return;
    await base44.entities.BusinessOpeningStep.update(stepRecord.id, {
      draft_data: { ...(stepRecord.draft_data || {}), wizardStep: stepIdx },
      status: "in_progress",
    });
  }

  function goNext() {
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
    const { value: confirmNum, isIdMode, isIdValid } = committedRef.current;

    // ID validation
    if (isIdMode && confirmNum) {
      if (!isIdValid) {
        setConfirmNumError('מספר ת"ז לא תקין — יש להכניס ספרת ביקורת נכונה');
        return;
      }
    }

    // Warn if <9 digits, not ID mode, for steps requiring a number
    if (confirmNum && !isIdMode && confirmNum.length < 9 && REQUIRES_NUMBER_STEPS.includes(stepKey)) {
      setShortNumModal(true);
      return;
    }

    setConfirmNumError("");
    await doSave(false);
  }

  async function doSave(forcePartial = false) {
    const { value: confirmNum } = committedRef.current;
    setShortNumModal(false);
    setSaving(true);
    const requiresNum = REQUIRES_NUMBER_STEPS.includes(stepKey);
    const isPartialComplete = forcePartial || (requiresNum && !confirmNum);
    const newStatus = isPartialComplete ? "partial" : "completed";
    if (confirmNum && profileFieldKey && profileId) {
      await base44.entities.UserProfile.update(profileId, { [profileFieldKey]: confirmNum }).catch(() => {});
    }
    await base44.entities.BusinessOpeningStep.update(stepRecord.id, {
      status: newStatus,
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

  // Completion form — shared between desktop and mobile
  const CompletionForm = (
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
          <ConfirmNumInput
            stepKey={stepKey}
            onCommit={handleCommit}
            inputRef={confirmInputRef}
          />
          {confirmNumError && <p className="text-xs text-red-600 -mt-2">{confirmNumError}</p>}

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
            style={{ backgroundColor: "#1A7A4A", minHeight: "52px" }}
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
  );

  // Prefill card — shared
  const PrefillCard = (
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
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-2 md:p-4" dir="rtl">

      {/* Short number warning modal */}
      {shortNumModal && (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4" dir="rtl"
          onClick={() => setShortNumModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900">מספר תיק קצר מ-9 ספרות</h2>
              <button onClick={() => setShortNumModal(false)} className="p-1 rounded hover:bg-gray-100">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <p className="text-sm text-gray-700 mb-4 leading-relaxed">
              מספר תיק ניכויים קצר מ-9 ספרות.<br />
              במידה ומספר זה הינו מספר ת״ז — יש לסמן את הוי &quot;מספר זה הינו מספר תעודת הזהות שלי&quot;.<br />
              במידה ומספר זה אינו מספר ת״ז — יש להזין 9 ספרות.
            </p>

            {/* Info accordion */}
            <div className="mb-5">
              <button
                onClick={() => setShortNumInfoOpen(v => !v)}
                className="flex items-center gap-2 text-sm text-blue-700 hover:text-blue-900 font-medium">
                <span className="text-base">ℹ️</span>
                <span className="underline">כיצד לאתר את מספר תיק הניכויים שלי?</span>
              </button>
              {shortNumInfoOpen && (
                <div className="mt-3 bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-gray-700 space-y-1">
                  <p className="font-semibold text-blue-900 mb-2">כיצד מוצאים את מספר תיק הניכויים?</p>
                  <p>מספר תיק הניכויים מופיע באחד מהמקומות הבאים:</p>
                  <ul className="list-disc mr-4 space-y-1 text-xs">
                    <li>תלוש השכר האחרון שקיבלת</li>
                    <li>באתר רשות המיסים: <a href="https://www.misim.gov.il" target="_blank" rel="noopener noreferrer" className="underline text-blue-700">www.misim.gov.il</a><br />(כניסה לאזור האישי ← ניהול תיק ← מספר התיק)</li>
                    <li>בטופס 101 (טופס פרטי עובד)</li>
                    <li>בפנייה לפקיד השומה הקרוב אליך</li>
                  </ul>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => doSave(true)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50">
                המשך בכל זאת
              </button>
              <button
                onClick={() => {
                  setShortNumModal(false);
                  confirmInputRef.current?.highlight();
                  setTimeout(() => confirmInputRef.current?.clearHighlight(), 3000);
                }}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium"
                style={{ backgroundColor: "#1E5FA8" }}>
                תקן את המספר
              </button>
            </div>
          </div>
        </div>
      )}

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

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {/* DESKTOP */}
          <div className="hidden md:flex h-full">
            <div className="w-[40%] flex flex-col border-l border-gray-100 bg-gray-50 overflow-y-auto p-5">
              <InstructionList
                instructions={instructions}
                activeStep={activeStep}
                setActiveStep={setActiveStep}
                saveProgress={saveProgress}
                validationError={validationError}
                goNext={goNext}
                goPrev={goPrev}
              />
            </div>
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
              {PrefillCard}
              {portalUnreachable && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800">
                  <p className="font-semibold">הפורטל {authority} אינו זמין כרגע.</p>
                  <p className="text-xs mt-0.5">המידע שלך נשמר. נסה שוב מאוחר יותר.</p>
                </div>
              )}
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
              {CompletionForm}
              <p className="text-xs text-gray-400 text-center">
                ⚙️ אוטומציה מלאה תהיה זמינה בגרסה הבאה.<br />
                כרגע יש לבצע את הפעולות ידנית בפורטל.
              </p>
            </div>
          </div>

          {/* MOBILE */}
          <div className="md:hidden p-4 space-y-6">
            {PrefillCard}
            <div className="bg-gray-50 rounded-xl p-4">
              <InstructionList
                instructions={instructions}
                activeStep={activeStep}
                setActiveStep={setActiveStep}
                saveProgress={saveProgress}
                validationError={validationError}
                goNext={goNext}
                goPrev={goPrev}
              />
            </div>
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
            {CompletionForm}
            <p className="text-xs text-gray-400 text-center pb-2">
              ⚙️ אוטומציה מלאה תהיה זמינה בגרסה הבאה.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}