import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import GuidedSubmissionWizard from "./GuidedSubmissionWizard";

// ── Bank step ──────────────────────────────────────────────────────────────
const BANKS = [
  { key: "hapoalim", label: "בנק הפועלים", url: "https://www.bankhapoalim.co.il/he/foreign-residents-and-businesses/small-business" },
  { key: "leumi", label: "בנק לאומי", url: "https://www.leumi.co.il/he/business-banking" },
  { key: "discount", label: "בנק דיסקונט", url: "https://www.discountbank.co.il/DB/he/business" },
  { key: "mizrahi", label: "מזרחי טפחות", url: "https://www.mizrahi-tefahot.co.il/he/business" },
  { key: "mercantile", label: "בנק מרכנתיל", url: "https://www.mercantile.co.il" },
];

const BANK_INSTRUCTIONS = [
  { step: 1, title: "כנס לאתר הבנק", description: "לחץ על 'פתח פורטל' מימין לפתיחת אתר הבנק הנבחר.", tip: "מומלץ לפתוח חשבון עסקי נפרד מהחשבון האישי שלך" },
  { step: 2, title: "חפש 'פתיחת חשבון עסקי'", description: "באתר הבנק, חפש את האפשרות לפתיחת חשבון עסקי או חשבון לעצמאים.", tip: "רוב הבנקים מאפשרים תחילת תהליך אונליין ואז פגישה בסניף" },
  { step: 3, title: "מלא את הטופס המקוון", description: "הכנס את הפרטים האישיים שלך. הנתונים מוצגים בכרטיס למעלה לנוחיותך." },
  { step: 4, title: "קבע פגישה בסניף", description: "רוב הבנקים ידרשו פגישה פיזית בסניף לאימות זהות וחתימת מסמכים.", tip: "הכן: תעודת זהות מקורית + אישור כתובת (חשבון חשמל / ארנונה)" },
  { step: 5, title: "קבל את פרטי החשבון", description: "לאחר אישור הבנק, תקבל מספר חשבון. הכנס אותו בפרופיל שלך.", tip: "עדכן את פרטי הבנק בפרופיל Fresh Start לאחר פתיחת החשבון" },
];

// ── VAT step ───────────────────────────────────────────────────────────────
const VAT_INSTRUCTIONS = [
  { step: 1, title: 'כנס לפורטל מע"מ', description: 'לחץ על "פתח פורטל" לפתיחת אתר רשות המיסים.', tip: 'הפורטל דורש זיהוי עם תעודת זהות ומספר טלפון' },
  { step: 2, title: "זיהוי והתחברות", description: "התחבר עם תעודת הזהות שלך ומספר הטלפון לקבלת קוד SMS." },
  { step: 3, title: "בחר סוג עוסק", description: "בחר עוסק מורשה או עוסק פטור בהתאם למחזור הצפוי שלך.", tip: "ניתן לשנות סוג עוסק בעתיד אם המחזור משתנה" },
  { step: 4, title: "מלא פרטי עסק", description: "הכנס שם עסק, כתובת, ענף עיסוק, ותאריך תחילת פעילות.", tip: "תאריך תחילת פעילות הוא היום שבו התחלת לספק שירות או למכור" },
  { step: 5, title: "הגש את הטופס", description: 'לחץ על "הגש" ואשר את הפרטים. תקבל מספר עוסק מיידית.' },
  { step: 6, title: "שמור את מספר העוסק", description: "העתק את מספר העוסק שקיבלת והכנס אותו בפרופיל Fresh Start.", tip: "מספר העוסק הוא המספר שיופיע על כל החשבוניות שלך" },
];

const BIZ_TYPE_HE = { freelancer: "פרילנסר", retail: "עסק קמעונאי", studio: "סטודיו", food: "מזון", consultant: "ייעוץ", other: "עסק" };

// ── Tax step ──────────────────────────────────────────────────────────────
const TAX_INSTRUCTIONS = [
  { step: 1, title: "כנס לפורטל מס הכנסה", description: "לחץ על 'פתח פורטל' לכניסה לאתר רשות המיסים." },
  { step: 2, title: "התחבר עם תעודת זהות", description: "השתמש בתעודת הזהות ומספר הטלפון לזיהוי." },
  { step: 3, title: "פתח תיק עצמאי", description: "חפש 'פתיחת תיק עצמאי' ומלא את הטופס עם פרטי העסק.", tip: "תזדקק לפרטי חשבון הבנק העסקי שפתחת בשלב הקודם" },
  { step: 4, title: "הצהר על הכנסה צפויה", description: "הזן את ההכנסה השנתית הצפויה. זה קובע את גובה המקדמות החודשיות.", tip: "עדיף להצהיר על הכנסה ריאלית — ניתן לתקן מאוחר יותר" },
  { step: 5, title: "שמור מספר תיק", description: "לאחר פתיחת התיק תקבל מספר תיק מס הכנסה. שמור אותו בפרופיל." },
];

// ── NII step ──────────────────────────────────────────────────────────────
const NII_INSTRUCTIONS = [
  { step: 1, title: "כנס לפורטל ביטוח לאומי", description: "לחץ על 'פתח פורטל' לכניסה לאתר הביטוח הלאומי.", tip: "יש להצהיר תוך 90 יום מתחילת פעילות העסק" },
  { step: 2, title: "כניסה לאזור האישי", description: "התחבר עם תעודת הזהות שלך." },
  { step: 3, title: "הגשת הודעה על פתיחת עסק", description: "חפש 'הודעה על תחילת עבודה עצמאית' ומלא את הטופס." },
  { step: 4, title: "הזן הכנסה חודשית צפויה", description: "הצהר על ההכנסה החודשית הצפויה. זה קובע את דמי הביטוח.", tip: "דמי ביטוח לאומי לעצמאי: כ-12% מההכנסה עד תקרה" },
  { step: 5, title: "שמור מספר תיק", description: "לאחר ההגשה שמור את מספר התיק בביטוח הלאומי." },
];

function maskId(id) {
  if (!id) return null;
  return `••••${id.slice(-4)}`;
}

// Bank pre-step selector
function BankSelector({ onSelect }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">בחר את הבנק שברצונך לפתוח בו חשבון:</h2>
        <div className="space-y-2">
          {BANKS.map(b => (
            <button key={b.key} onClick={() => onSelect(b)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all text-right">
              <span className="text-2xl">🏦</span>
              <span className="font-medium text-gray-800">{b.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// VAT type pre-step
function VatTypeSelector({ current, onSelect }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">בחר את סוג הרישום המתאים לך:</h2>
        <div className="grid grid-cols-2 gap-4">
          {[
            { key: "מורשה", title: "עוסק מורשה", lines: ["מחזור שנתי מעל ₪120,000", "גובה מע״מ: 17% על כל עסקה", "מגיש דוח מע״מ כל חודש/חודשיים"] },
            { key: "פטור", title: "עוסק פטור", lines: ["מחזור שנתי עד ₪120,000", "פטור מגביית מע״מ", "מגיש דוח שנתי בלבד"] },
          ].map(opt => (
            <button key={opt.key} onClick={() => onSelect(opt.key)}
              className={`rounded-xl border-2 p-4 text-right transition-all hover:border-blue-400 ${current === opt.key ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}>
              <p className="font-bold text-gray-900 mb-2">{opt.title}</p>
              {opt.lines.map(l => <p key={l} className="text-xs text-gray-500">{l}</p>)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Income pre-step
function IncomeSelector({ current, onSelect }) {
  const [val, setVal] = useState(current || 120000);
  let hint = "";
  if (val < 75000) hint = "מדרגת מס ראשונה — 10%";
  else if (val <= 215000) hint = "מדרגת מס שנייה — 14%–20%";
  else hint = "מדרגות מס גבוהות — 31%–50%";

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">מהי ההכנסה השנתית הצפויה שלך?</h2>
        <input
          type="range" min={0} max={500000} step={5000}
          value={val} onChange={e => setVal(Number(e.target.value))}
          className="w-full mb-2"
        />
        <div className="flex justify-between text-xs text-gray-400 mb-4">
          <span>₪0</span><span>₪500,000+</span>
        </div>
        <div className="text-center mb-4">
          <p className="text-2xl font-bold" style={{ color: "#1E5FA8" }}>₪{val.toLocaleString()}</p>
          <p className="text-sm text-gray-600 mt-1">{hint}</p>
        </div>
        <button onClick={() => onSelect(val)}
          className="w-full py-3 rounded-xl text-white font-bold"
          style={{ backgroundColor: "#1E5FA8" }}>
          המשך ←
        </button>
      </div>
    </div>
  );
}

export default function BusinessStepWizard({ stepKey, stepRecord, profile, user, onComplete, onClose }) {
  const [preStep, setPreStep] = useState(null); // null = show wizard, "bank" / "vat" / "income"
  const [selectedBank, setSelectedBank] = useState(null);
  const [vatType, setVatType] = useState(profile?.vat_type || null);
  const [income, setIncome] = useState(profile?.expected_annual_income || null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (stepKey === "bank_account" && !selectedBank) { setPreStep("bank"); return; }
    if (stepKey === "vat_file" && !vatType) { setPreStep("vat"); return; }
    if (stepKey === "tax_file" && !income) { setPreStep("income"); return; }
    setReady(true);
  }, [selectedBank, vatType, income]);

  async function handleBankSelect(bank) {
    setSelectedBank(bank);
    setPreStep(null);
    setReady(true);
  }

  async function handleVatSelect(type) {
    setVatType(type);
    if (profile?.id) {
      await base44.entities.UserProfile.update(profile.id, { vat_type: type });
    }
    if (stepKey === "tax_file" && !income) { setPreStep("income"); return; }
    setPreStep(null);
    setReady(true);
  }

  async function handleIncomeSelect(val) {
    setIncome(val);
    if (profile?.id) {
      await base44.entities.UserProfile.update(profile.id, { expected_annual_income: val });
    }
    setPreStep(null);
    setReady(true);
  }

  // Build config per stepKey
  const configs = {
    bank_account: {
      stepTitle: "פתיחת חשבון בנק עסקי",
      authority: selectedBank?.label || "בנקים בישראל",
      portalUrl: selectedBank?.url || "https://www.bankhapoalim.co.il",
      instructions: BANK_INSTRUCTIONS,
      prefillData: [
        { label: "שם מלא", value: [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || null },
        { label: "תעודת זהות", value: maskId(profile?.id_number_il) },
        { label: "כתובת", value: [profile?.address, profile?.city].filter(Boolean).join(", ") || null },
        { label: "טלפון", value: profile?.phone_il || null },
      ],
    },
    vat_file: {
      stepTitle: 'פתיחת תיק מע"מ',
      authority: 'רשות המיסים — מע"מ',
      portalUrl: "https://www.misim.gov.il/eovhv/Main.aspx",
      instructions: VAT_INSTRUCTIONS,
      prefillData: [
        { label: "שם מלא", value: [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || null },
        { label: "תעודת זהות", value: maskId(profile?.id_number_il) },
        { label: "כתובת העסק", value: [profile?.address, profile?.city].filter(Boolean).join(", ") || null },
        { label: "שם העסק", value: profile?.business_name || null },
        { label: "סוג העסק", value: profile?.business_type ? BIZ_TYPE_HE[profile.business_type] : null },
        { label: "טלפון", value: profile?.phone_il || null },
        { label: "אימייל", value: user?.email || null },
      ],
    },
    tax_file: {
      stepTitle: "פתיחת תיק מס הכנסה",
      authority: "רשות המיסים — מס הכנסה",
      portalUrl: "https://www.misim.gov.il",
      instructions: TAX_INSTRUCTIONS,
      prefillData: [
        { label: "שם מלא", value: [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || null },
        { label: "תעודת זהות", value: maskId(profile?.id_number_il) },
        { label: "כתובת", value: [profile?.address, profile?.city].filter(Boolean).join(", ") || null },
        { label: "שם עסק", value: profile?.business_name || null },
        { label: "סוג עסק", value: profile?.business_type ? BIZ_TYPE_HE[profile.business_type] : null },
        { label: "הכנסה שנתית צפויה", value: income ? `₪${Number(income).toLocaleString()}` : null },
      ],
    },
    nii: {
      stepTitle: "הצהרה לביטוח לאומי",
      authority: "המוסד לביטוח לאומי",
      portalUrl: "https://www.btl.gov.il/online-services/",
      instructions: NII_INSTRUCTIONS,
      prefillData: [
        { label: "שם מלא", value: [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || null },
        { label: "תעודת זהות", value: maskId(profile?.id_number_il) },
        { label: "כתובת", value: [profile?.address, profile?.city].filter(Boolean).join(", ") || null },
        { label: "טלפון", value: profile?.phone_il || null },
        { label: "תאריך תחילת עסק", value: new Date().toLocaleDateString("he-IL") },
        { label: "הכנסה חודשית צפויה", value: income ? `₪${Math.round(income / 12).toLocaleString()}` : null },
      ],
    },
  };

  const cfg = configs[stepKey];

  if (preStep === "bank") return <BankSelector onSelect={handleBankSelect} />;
  if (preStep === "vat") return <VatTypeSelector current={vatType} onSelect={handleVatSelect} />;
  if (preStep === "income") return <IncomeSelector current={income} onSelect={handleIncomeSelect} />;
  if (!ready || !cfg) return null;

  return (
    <GuidedSubmissionWizard
      stepKey={stepKey}
      stepTitle={cfg.stepTitle}
      authority={cfg.authority}
      portalUrl={cfg.portalUrl}
      instructions={cfg.instructions}
      prefillData={cfg.prefillData}
      onComplete={onComplete}
      onClose={onClose}
      stepRecord={stepRecord}
    />
  );
}