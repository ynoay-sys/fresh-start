import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import BackButton from "../components/BackButton";

const BUSINESS_TYPES = [
  { value: "osek_patur", label: "עוסק פטור", description: "מחזור עסקי עד תקרת הפטור השנתית" },
  { value: "osek_murshe", label: "עוסק מורשה", description: "מחזור עסקי מעל תקרת הפטור" },
  { value: "osek_zair", label: "עוסק זעיר", description: "עסק קטן עם מחזור מוגבל" },
  { value: "esek_beinoni", label: "עסק בינוני", description: "עסק בינוני עם עובדים" },
  { value: "amuta", label: "עמותה", description: "ארגון ללא מטרות רווח" },
  { value: "sakhir_atzmai", label: "שכיר-עצמאי", description: "משלב עבודה שכירה ועצמאות" },
];

const STEPS = ["סוג עסק", "פרטי רישום", "סיכום"];

export default function SetupExisting() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [selectedType, setSelectedType] = useState("");
  const [details, setDetails] = useState({ business_name: "", vat_number: "", business_start_date: "" });
  const [saving, setSaving] = useState(false);
  const [profileId, setProfileId] = useState(null);

  useEffect(() => {
    document.title = "הגדרת העסק הקיים | Fresh Start";
    base44.auth.me().then(u =>
      base44.entities.UserProfile.filter({ created_by: u.email }).then(res => {
        if (res[0]) setProfileId(res[0].id);
      })
    );
  }, []);

  async function handleFinish() {
    setSaving(true);
    const data = {
      business_status: "existing",
      business_type: selectedType,
      business_name: details.business_name,
      vat_number: details.vat_number,
      business_start_date: details.business_start_date || undefined,
    };
    if (profileId) {
      await base44.entities.UserProfile.update(profileId, data);
    } else {
      await base44.entities.UserProfile.create(data);
    }
    setSaving(false);
    navigate("/dashboard");
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8" dir="rtl">
      <BackButton />
      <h1 className="text-2xl font-bold text-gray-900 mb-2">הגדרת העסק הקיים</h1>
      <p className="text-sm text-gray-500 mb-6">מה המצב שלך? בחר את סוג העסק שלך כדי שנוכל להתאים את החוויה</p>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ backgroundColor: i <= step ? "#1E5FA8" : "#E5E7EB", color: i <= step ? "white" : "#9CA3AF" }}>
                {i + 1}
              </div>
              <span className="text-xs font-medium" style={{ color: i <= step ? "#1E5FA8" : "#9CA3AF" }}>{s}</span>
            </div>
            {i < STEPS.length - 1 && <div className="w-6 h-px bg-gray-200" />}
          </div>
        ))}
      </div>

      {/* Step 0: Business Type */}
      {step === 0 && (
        <div>
          <h2 className="text-base font-semibold text-gray-800 mb-4">בחר את סוג העסק שלך</h2>
          <div className="grid grid-cols-1 gap-3">
            {BUSINESS_TYPES.map(bt => (
              <button
                key={bt.value}
                onClick={() => setSelectedType(bt.value)}
                className="text-right p-4 rounded-xl border-2 transition-all"
                style={{
                  borderColor: selectedType === bt.value ? "#1E5FA8" : "#E5E7EB",
                  backgroundColor: selectedType === bt.value ? "#EAF2FB" : "white",
                }}
              >
                <p className="font-semibold text-gray-900">{bt.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{bt.description}</p>
              </button>
            ))}
          </div>
          <button
            onClick={() => setStep(1)}
            disabled={!selectedType}
            className="mt-6 w-full py-3 rounded-xl text-white font-bold disabled:opacity-40"
            style={{ backgroundColor: "#1E5FA8" }}
          >
            המשך ←
          </button>
        </div>
      )}

      {/* Step 1: Registration Details */}
      {step === 1 && (
        <div>
          <h2 className="text-base font-semibold text-gray-800 mb-4">פרטי רישום</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">שם העסק</label>
              <input
                type="text"
                value={details.business_name}
                onChange={e => setDetails(d => ({ ...d, business_name: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
                placeholder="לדוגמה: סטודיו עיצוב דנה"
                dir="rtl"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">מספר עוסק / מע"מ</label>
              <input
                type="text"
                value={details.vat_number}
                onChange={e => setDetails(d => ({ ...d, vat_number: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
                placeholder="123456789"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">תאריך פתיחת העסק</label>
              <input
                type="date"
                value={details.business_start_date}
                onChange={e => setDetails(d => ({ ...d, business_start_date: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={() => setStep(0)} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-medium">
              חזרה
            </button>
            <button
              onClick={() => setStep(2)}
              className="flex-1 py-3 rounded-xl text-white font-bold"
              style={{ backgroundColor: "#1E5FA8" }}
            >
              המשך ←
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Summary */}
      {step === 2 && (
        <div>
          <h2 className="text-base font-semibold text-gray-800 mb-4">סיכום</h2>
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">סוג עסק:</span>
              <span className="font-semibold text-gray-900">{BUSINESS_TYPES.find(b => b.value === selectedType)?.label}</span>
            </div>
            {details.business_name && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">שם העסק:</span>
                <span className="font-semibold text-gray-900">{details.business_name}</span>
              </div>
            )}
            {details.vat_number && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">מספר עוסק:</span>
                <span className="font-semibold text-gray-900">{details.vat_number}</span>
              </div>
            )}
            {details.business_start_date && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">תאריך פתיחה:</span>
                <span className="font-semibold text-gray-900">{details.business_start_date}</span>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-medium">
              חזרה
            </button>
            <button
              onClick={handleFinish}
              disabled={saving}
              className="flex-1 py-3 rounded-xl text-white font-bold disabled:opacity-50"
              style={{ backgroundColor: "#1E5FA8" }}
            >
              {saving ? "שומר..." : "סיים והתחל ←"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}