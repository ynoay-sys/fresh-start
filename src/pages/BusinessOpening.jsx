import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import confetti from "canvas-confetti";
import ManualFallbackBanner from "../components/ManualFallbackBanner";

const STEP_DEFS = [
  {
    key: "bank_account",
    icon: "🏦",
    title: "פתיחת חשבון בנק עסקי",
    description: "פתח חשבון בנק ייעודי לעסק שלך. מומלץ להפריד בין הכספים האישיים לעסקיים.",
    docs: ["תעודת זהות", "אסמכתא לכתובת מגורים"],
    links: [
      { label: "בנק הפועלים", url: "https://www.bankhapoalim.co.il" },
      { label: "בנק לאומי", url: "https://www.leumi.co.il" },
      { label: "בנק דיסקונט", url: "https://www.discountbank.co.il" },
      { label: "מזרחי טפחות", url: "https://www.mizrahi-tefahot.co.il" },
    ],
    linksLabel: "בנקים מומלצים:",
  },
  {
    key: "vat_file",
    icon: "📋",
    title: 'פתיחת תיק מע"מ',
    description: 'על כל עוסק מורשה לפתוח תיק מע"מ ברשות המיסים. הגשה חובה תוך 30 יום מתחילת הפעילות.',
    docs: ["תעודת זהות", "כתובת העסק", "פרטי חשבון בנק עסקי"],
    externalLink: { label: 'עבור לאתר רשות המיסים ←', url: "https://www.gov.il/he/departments/topics/vat/govil-landing-page" },
    showProfile: true,
  },
  {
    key: "tax_file",
    icon: "📊",
    title: "פתיחת תיק מס הכנסה",
    description: "רשום את עצמך כעצמאי במס הכנסה. הרישום מאפשר לך לדווח על הכנסותיך ולנכות הוצאות עסקיות.",
    docs: ["תעודת זהות", "פרטי העסק", "הכנסה שנתית צפויה"],
    externalLink: { label: "עבור לאתר מס הכנסה ←", url: "https://www.misim.gov.il" },
  },
  {
    key: "nii",
    icon: "🛡️",
    title: "הצהרה לביטוח לאומי",
    description: "כעצמאי, עליך להצהיר על פתיחת העסק בביטוח הלאומי תוך 90 יום. זה קובע את גובה דמי הביטוח שלך.",
    docs: ["תעודת זהות", "פרטי העסק", "הכנסה חודשית צפויה"],
    externalLink: { label: "עבור לביטוח לאומי ←", url: "https://www.btl.gov.il" },
  },
];

const STATUS_LABELS = {
  not_started: { label: "טרם התחיל", cls: "bg-gray-100 text-gray-600" },
  in_progress: { label: "בתהליך", cls: "bg-blue-100 text-blue-700" },
  completed: { label: "הושלם ✓", cls: "bg-green-100 text-green-700" },
  manual_fallback: { label: "ידני", cls: "bg-orange-100 text-orange-700" },
  queued: { label: "ממתין", cls: "bg-gray-100 text-gray-500" },
};

function ProfilePreview({ profile }) {
  if (!profile) return null;
  const hasData = profile.first_name || profile.address || profile.city;
  return (
    <div className="rounded-lg p-3 text-sm mt-3" style={{ backgroundColor: "#EFF6FF" }}>
      <p className="font-semibold text-blue-800 mb-2 text-xs">הנתונים שלך שיוגשו:</p>
      {hasData ? (
        <div className="space-y-1 text-blue-900">
          {profile.first_name && <p>שם: {profile.first_name} {profile.last_name}</p>}
          {profile.address && <p>כתובת: {profile.address}{profile.city ? `, ${profile.city}` : ""}</p>}
          {profile.vat_number && <p>מספר עוסק: {profile.vat_number}</p>}
        </div>
      ) : (
        <Link to="/profile" className="text-blue-600 underline text-xs">השלם פרטים בפרופיל</Link>
      )}
    </div>
  );
}

function StepCard({ def, step, onUpdate, profile }) {
  const [updating, setUpdating] = useState(false);

  async function setStatus(status) {
    setUpdating(true);
    const data = { status };
    if (status === "completed") data.submitted_at = new Date().toISOString();
    await base44.entities.BusinessOpeningStep.update(step.id, data);
    onUpdate(step.id, data);
    setUpdating(false);
  }

  const status = step.status;
  const statusInfo = STATUS_LABELS[status] || STATUS_LABELS.not_started;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{def.icon}</span>
          <div>
            <h3 className="font-bold text-gray-900 text-base">{def.title}</h3>
            <p className="text-sm text-gray-500 mt-0.5">{def.description}</p>
          </div>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 mr-2 ${statusInfo.cls} ${status === "in_progress" ? "animate-pulse" : ""}`}>
          {statusInfo.label}
        </span>
      </div>

      {/* Required Docs */}
      <div className="mb-3">
        <p className="text-xs font-semibold text-gray-500 mb-1">מסמכים נדרשים:</p>
        <ul className="space-y-0.5">
          {def.docs.map((d, i) => (
            <li key={i} className="text-sm text-gray-700 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0" />
              {d}
            </li>
          ))}
        </ul>
      </div>

      {/* Profile Preview (VAT step) */}
      {def.showProfile && <ProfilePreview profile={profile} />}

      {/* Links */}
      {def.links && (
        <div className="mt-3">
          <p className="text-xs font-semibold text-gray-500 mb-1.5">{def.linksLabel}</p>
          <div className="flex flex-wrap gap-2">
            {def.links.map((l, i) => (
              <a key={i} href={l.url} target="_blank" rel="noopener noreferrer"
                className="text-xs px-3 py-1.5 rounded-lg border transition-colors hover:bg-blue-50"
                style={{ borderColor: "#1E5FA8", color: "#1E5FA8" }}>
                {l.label} ↗
              </a>
            ))}
          </div>
        </div>
      )}

      {/* External Link */}
      {def.externalLink && (
        <a href={def.externalLink.url} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center mt-3 text-sm font-medium px-4 py-2 rounded-lg text-white transition-colors"
          style={{ backgroundColor: "#1E5FA8" }}>
          {def.externalLink.label}
        </a>
      )}

      {/* Actions */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        {(status === "not_started" || status === "manual_fallback" || status === "queued") && (
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setStatus("completed")} disabled={updating}
              className="px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50"
              style={{ backgroundColor: "#1A7A4A" }}>
              עשיתי זאת! ✓
            </button>
            <button onClick={() => setStatus("in_progress")} disabled={updating}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50">
              סמן כבתהליך
            </button>
          </div>
        )}
        {status === "in_progress" && (
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setStatus("completed")} disabled={updating}
              className="px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50"
              style={{ backgroundColor: "#1A7A4A" }}>
              סיימתי! סמן כהושלם ✓
            </button>
            <button onClick={() => setStatus("not_started")} disabled={updating}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50">
              חזור להמתנה
            </button>
          </div>
        )}
        {status === "completed" && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-green-700 font-medium text-sm">
              <span className="text-lg">✅</span>
              הושלם{step.submitted_at ? ` בתאריך ${format(new Date(step.submitted_at), "dd/MM/yyyy")}` : ""}
            </div>
            <button onClick={() => setStatus("not_started")} disabled={updating}
              className="text-xs text-gray-400 hover:text-gray-600 underline disabled:opacity-50">
              בטל סימון
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BusinessOpening() {
  const navigate = useNavigate();
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [celebrated, setCelebrated] = useState(false);

  useEffect(() => {
    async function load() {
      const user = await base44.auth.me();
      let existing = await base44.entities.BusinessOpeningStep.filter({ created_by: user.email });

      // Auto-create if no steps exist
      if (existing.length === 0) {
        const keys = ["bank_account", "vat_file", "tax_file", "nii"];
        existing = await Promise.all(
          keys.map(k => base44.entities.BusinessOpeningStep.create({ step_key: k, status: "not_started" }))
        );
      }
      setSteps(existing);

      // Load profile for VAT step
      const profiles = await base44.entities.UserProfile.filter({ created_by: user.email });
      setProfile(profiles[0] || null);
      setLoading(false);
    }
    load();
  }, []);

  function handleUpdate(id, data) {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
  }

  const completedCount = steps.filter(s => s.status === "completed").length;
  const allDone = completedCount === 4 && steps.length === 4;

  useEffect(() => {
    if (allDone && !celebrated) {
      setCelebrated(true);
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.4 } });
    }
  }, [allDone]);

  const getStep = (key) => steps.find(s => s.step_key === key) || { status: "not_started" };

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

      <ManualFallbackBanner />

      {/* Progress Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-700">השלמת {completedCount} מתוך 4 שלבים</span>
          <span className="text-sm font-bold" style={{ color: "#1E5FA8" }}>{Math.round((completedCount / 4) * 100)}%</span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${(completedCount / 4) * 100}%`, backgroundColor: "#1E5FA8" }} />
        </div>
      </div>

      {/* Celebration Banner */}
      {allDone && (
        <div className="rounded-xl p-6 mb-6 text-white text-center"
          style={{ background: "linear-gradient(135deg, #1E5FA8, #1A7A4A)" }}>
          <p className="text-2xl font-bold mb-1">🎉 מזל טוב! העסק שלך רשום רשמית!</p>
          <p className="text-sm opacity-90 mb-4">השלמת את כל שלבי פתיחת העסק. אתה מוכן להתחיל!</p>
          <button onClick={() => navigate("/dashboard")}
            className="px-5 py-2 bg-white rounded-lg text-sm font-medium"
            style={{ color: "#1E5FA8" }}>
            עבור ללוח הבקרה ←
          </button>
        </div>
      )}

      {/* Step Cards */}
      {STEP_DEFS.map(def => (
        <StepCard
          key={def.key}
          def={def}
          step={getStep(def.key)}
          onUpdate={handleUpdate}
          profile={profile}
        />
      ))}
    </div>
  );
}