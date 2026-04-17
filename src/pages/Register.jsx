import { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Eye, EyeOff } from "lucide-react";

const BUSINESS_TYPES = [
  { value: "freelancer", label: "פרילנסר" },
  { value: "retail", label: "קמעונאות" },
  { value: "studio", label: "סטודיו / קליניקה" },
  { value: "food", label: "מזון ומשקאות" },
  { value: "consultant", label: "ייעוץ" },
  { value: "other", label: "אחר" },
];

function PasswordStrength({ password }) {
  const hasLen = password.length >= 8;
  const hasNum = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*]/.test(password);

  const strength = !password ? null : hasLen && hasNum && hasSpecial ? "green" : hasLen ? "orange" : "red";
  const strengthLabel = { green: "חזקה", orange: "בינונית", red: "חלשה" };
  const strengthColors = { green: "#1A7A4A", orange: "#C25A00", red: "#DC2626" };

  if (!password) return null;

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all"
            style={{
              width: strength === "green" ? "100%" : strength === "orange" ? "60%" : "25%",
              backgroundColor: strengthColors[strength]
            }} />
        </div>
        <span className="text-xs font-medium" style={{ color: strengthColors[strength] }}>
          {strengthLabel[strength]}
        </span>
      </div>
      <div className="space-y-0.5">
        {[
          { check: hasLen, label: "לפחות 8 תווים" },
          { check: hasNum, label: "לפחות ספרה אחת" },
          { check: hasSpecial, label: "לפחות תו מיוחד (!@#$%^&*)" },
        ].map(({ check, label }) => (
          <p key={label} className={`text-xs flex items-center gap-1.5 ${check ? "text-green-600" : "text-gray-400"}`}>
            <span>{check ? "✓" : "○"}</span>{label}
          </p>
        ))}
      </div>
    </div>
  );
}

function VerificationModal({ email, onContinue }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center">
        <div className="text-5xl mb-4">📧</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">אימות אימייל</h2>
        <p className="text-sm text-gray-600 mb-1">שלחנו אימייל אימות ל:</p>
        <p className="text-sm font-semibold text-gray-900 mb-4" dir="ltr">{email}</p>
        <p className="text-sm text-gray-500 mb-6">אנא בדוק את תיבת הדואר שלך ולחץ על הקישור לאימות</p>
        <div className="space-y-3">
          <a href={`mailto:${email}`}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">
            📬 פתח אימייל
          </a>
          <button onClick={onContinue}
            className="w-full py-2.5 rounded-xl text-white font-medium text-sm"
            style={{ backgroundColor: "#1E5FA8" }}>
            המשך בכל זאת ←
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Register() {
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", password: "", confirmPassword: "",
    phone: "", businessType: "", terms: false,
  });
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [errors, setErrors] = useState({});

  function set(field, val) {
    setForm(f => ({ ...f, [field]: val }));
    setErrors(e => ({ ...e, [field]: undefined }));
  }

  function validate() {
    const errs = {};
    if (!form.firstName.trim()) errs.firstName = "שדה חובה";
    if (!form.lastName.trim()) errs.lastName = "שדה חובה";
    if (!form.email.trim()) errs.email = "שדה חובה";
    if (!form.password || form.password.length < 8) errs.password = "סיסמה חייבת להכיל לפחות 8 תווים";
    if (form.password !== form.confirmPassword) errs.confirmPassword = "הסיסמאות אינן תואמות";
    if (!form.businessType) errs.businessType = "אנא בחר סוג עסק";
    if (!form.terms) errs.terms = "יש לאשר את תנאי השימוש";
    return errs;
  }

  async function handleRegister(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    try {
      localStorage.setItem("emailVerified", "false");
      setShowVerification(true);
    } finally {
      setLoading(false);
    }
  }

  function handleGoogleRegister() {
    base44.auth.redirectToLogin(window.location.origin + "/dashboard");
  }

  function handleContinue() {
    setShowVerification(false);
    base44.auth.redirectToLogin(window.location.origin + "/dashboard");
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8" dir="rtl">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-6 justify-center">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#1E5FA8" }}>
            <span className="text-white font-bold text-sm">FS</span>
          </div>
          <span className="font-bold text-gray-900 text-lg">Fresh Start</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 text-center mb-1">יצירת חשבון חינמי</h1>
        <p className="text-sm text-gray-500 text-center mb-6">הצטרף לאלפי עצמאים שמנהלים את עסקם עם Fresh Start</p>

        {/* Google */}
        <button onClick={handleGoogleRegister}
          className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 font-medium text-gray-700 mb-4 transition-colors">
          <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.29-8.16 2.29-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
          הירשם עם Google
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">— או —</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          {/* Name row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">שם פרטי *</label>
              <input type="text" value={form.firstName} onChange={e => set("firstName", e.target.value)}
                className={`w-full px-3 py-2.5 border rounded-lg text-sm outline-none ${errors.firstName ? "border-red-400" : "border-gray-200 focus:border-blue-400"}`} />
              {errors.firstName && <p className="text-xs text-red-500 mt-0.5">{errors.firstName}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">שם משפחה *</label>
              <input type="text" value={form.lastName} onChange={e => set("lastName", e.target.value)}
                className={`w-full px-3 py-2.5 border rounded-lg text-sm outline-none ${errors.lastName ? "border-red-400" : "border-gray-200 focus:border-blue-400"}`} />
              {errors.lastName && <p className="text-xs text-red-500 mt-0.5">{errors.lastName}</p>}
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">אימייל *</label>
            <input type="email" value={form.email} onChange={e => set("email", e.target.value)} dir="ltr"
              className={`w-full px-3 py-2.5 border rounded-lg text-sm outline-none ${errors.email ? "border-red-400" : "border-gray-200 focus:border-blue-400"}`} />
            {errors.email && <p className="text-xs text-red-500 mt-0.5">{errors.email}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">סיסמה *</label>
            <div className="relative">
              <input type={showPass ? "text" : "password"} value={form.password}
                onChange={e => set("password", e.target.value)} dir="ltr"
                className={`w-full px-3 py-2.5 border rounded-lg text-sm outline-none pl-10 ${errors.password ? "border-red-400" : "border-gray-200 focus:border-blue-400"}`} />
              <button type="button" onClick={() => setShowPass(v => !v)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-500 mt-0.5">{errors.password}</p>}
            <PasswordStrength password={form.password} />
          </div>

          {/* Confirm password */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">אישור סיסמה *</label>
            <div className="relative">
              <input type={showConfirm ? "text" : "password"} value={form.confirmPassword}
                onChange={e => set("confirmPassword", e.target.value)} dir="ltr"
                className={`w-full px-3 py-2.5 border rounded-lg text-sm outline-none pl-10 ${errors.confirmPassword ? "border-red-400" : "border-gray-200 focus:border-blue-400"}`} />
              <button type="button" onClick={() => setShowConfirm(v => !v)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-xs text-red-500 mt-0.5">{errors.confirmPassword}</p>}
          </div>

          {/* Phone */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">טלפון</label>
            <input type="tel" value={form.phone} onChange={e => set("phone", e.target.value)}
              placeholder="05X-XXXXXXX" dir="ltr"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400" />
          </div>

          {/* Business type */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">סוג עסק *</label>
            <select value={form.businessType} onChange={e => set("businessType", e.target.value)}
              className={`w-full px-3 py-2.5 border rounded-lg text-sm outline-none bg-white ${errors.businessType ? "border-red-400" : "border-gray-200 focus:border-blue-400"}`}>
              <option value="">בחר סוג עסק</option>
              {BUSINESS_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            {errors.businessType && <p className="text-xs text-red-500 mt-0.5">{errors.businessType}</p>}
          </div>

          {/* Terms */}
          <div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={form.terms} onChange={e => set("terms", e.target.checked)}
                className="mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-700">
                אני מסכים/ה ל
                <Link to="/terms" target="_blank" className="font-medium underline" style={{ color: "#1E5FA8" }}>תנאי השימוש</Link>
                {" "}ול
                <Link to="/privacy" target="_blank" className="font-medium underline" style={{ color: "#1E5FA8" }}>מדיניות הפרטיות</Link>
              </span>
            </label>
            {errors.terms && <p className="text-xs text-red-500 mt-0.5">{errors.terms}</p>}
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-50"
            style={{ backgroundColor: "#1E5FA8" }}>
            {loading ? "יוצר חשבון..." : "צור חשבון ←"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-5">
          כבר יש לך חשבון?{" "}
          <Link to="/login" className="font-semibold" style={{ color: "#1E5FA8" }}>כניסה ←</Link>
        </p>
      </div>

      {showVerification && (
        <VerificationModal email={form.email} onContinue={handleContinue} />
      )}
    </div>
  );
}