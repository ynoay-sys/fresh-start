import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, Copy, Check } from "lucide-react";

const APP_URL = "https://app.fresh-start.co.il";

const EMPTY_FORM = {
  name: "", profession: "", subcategory: "", phone: "", email: "",
  city: "", address: "", description: "", website: "", rating: 4.5,
  reviewCount: 0, is_active: true, is_verified: true,
};

const PROFESSIONS = [
  "עורך דין", "רואה חשבון", "יועץ מס", "סוכן ביטוח",
  "מתווך", "מעצב", "צלם", "שיווק", "טכנולוגיה", "אחר"
];

export default function AddPartnerModal({ onClose, onSaved }) {
  const [mode, setMode] = useState(null); // "listed" | "full"
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setSaving] = useState(false);
  const [result, setResult] = useState(null); // { type: "existing_updated" | "invite_link", link?: string }
  const [copied, setCopied] = useState(false);

  const f = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  async function handleSave() {
    setSaving(true);
    const partnerData = {
      ...form,
      isVerifiedPartner: true,
      is_premium: false,
      plan: "free",
      logoInitials: form.name?.slice(0, 2) || "?",
    };

    // Create ProfessionalPartner
    await base44.entities.ProfessionalPartner.create(partnerData);

    if (mode === "listed") {
      setSaving(false);
      onSaved("listed");
      return;
    }

    // Full partner — check UserProfile
    if (form.email) {
      const profiles = await base44.entities.UserProfile.filter({ created_by: form.email });
      if (profiles.length > 0) {
        await base44.entities.UserProfile.update(profiles[0].id, { role: "partner" });
        setResult({ type: "existing_updated" });
      } else {
        const token = btoa(`partner:${form.email}:${Date.now()}`);
        const inviteLink = `${APP_URL}/register?role=partner&invite=${token}`;
        setResult({ type: "invite_link", link: inviteLink });
      }
    }
    setSaving(false);
  }

  function copyLink(link) {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (result) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" dir="rtl">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
          {result.type === "existing_updated" ? (
            <>
              <div className="text-4xl mb-3">✅</div>
              <h3 className="font-bold text-gray-900 mb-2">משתמש קיים — תפקיד עודכן לשותף</h3>
              <p className="text-sm text-gray-500 mb-5">הפרופיל המקצועי נוצר ותפקיד המשתמש עודכן.</p>
            </>
          ) : (
            <>
              <div className="text-4xl mb-3">🔗</div>
              <h3 className="font-bold text-gray-900 mb-2">שלח קישור זה לשותף</h3>
              <p className="text-sm text-gray-500 mb-3">כשיירשם, תפקידו יוגדר אוטומטית כשותף.</p>
              <div className="bg-gray-50 rounded-lg p-3 text-xs font-mono text-gray-700 break-all mb-4 text-right">
                {result.link}
              </div>
              <button onClick={() => copyLink(result.link)}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-white text-sm font-medium mb-3"
                style={{ backgroundColor: "#1E5FA8" }}>
                {copied ? <><Check className="w-4 h-4" />הועתק!</> : <><Copy className="w-4 h-4" />העתק קישור</>}
              </button>
            </>
          )}
          <button onClick={() => { onSaved("full"); onClose(); }}
            className="w-full py-2.5 rounded-lg border border-gray-200 text-sm text-gray-700">סגור</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold text-gray-900">הוסף שותף מקצועי</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>

        {!mode ? (
          <div className="px-6 py-6 space-y-4">
            <p className="text-sm text-gray-600 mb-4">כיצד תרצה להוסיף את השותף?</p>
            <button onClick={() => setMode("listed")}
              className="w-full text-right p-4 rounded-xl border-2 border-gray-200 hover:border-blue-400 transition-colors">
              <p className="font-semibold text-gray-900 mb-1">הוסף ללא גישה לאפליקציה</p>
              <p className="text-sm text-gray-500">מופיע בשוק המקצועי, ללא כניסה למערכת</p>
            </button>
            <button onClick={() => setMode("full")}
              className="w-full text-right p-4 rounded-xl border-2 border-gray-200 hover:border-green-400 transition-colors">
              <p className="font-semibold text-gray-900 mb-1">הוסף עם גישה לאפליקציה</p>
              <p className="text-sm text-gray-500">יכול להתחבר ולנהל את הפרופיל שלו</p>
            </button>
          </div>
        ) : (
          <div className="px-6 py-5 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <button onClick={() => setMode(null)} className="text-xs text-blue-600 underline">← חזור</button>
              <span className="text-xs text-gray-400">
                {mode === "listed" ? "ללא גישה לאפליקציה" : "עם גישה לאפליקציה"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-600 block mb-1">שם מלא *</label>
                <input required value={form.name} onChange={e => f("name", e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">מקצוע *</label>
                <select value={form.profession} onChange={e => f("profession", e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 bg-white">
                  <option value="">בחר...</option>
                  {PROFESSIONS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">התמחות</label>
                <input value={form.subcategory} onChange={e => f("subcategory", e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">עיר *</label>
                <input required value={form.city} onChange={e => f("city", e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">טלפון</label>
                <input value={form.phone} onChange={e => f("phone", e.target.value)} dir="ltr"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-600 block mb-1">
                  אימייל {mode === "full" ? "*" : ""}
                </label>
                <input value={form.email} onChange={e => f("email", e.target.value)} dir="ltr"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-600 block mb-1">כתובת</label>
                <input value={form.address} onChange={e => f("address", e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-600 block mb-1">תיאור</label>
                <textarea value={form.description} onChange={e => f("description", e.target.value)} rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 resize-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">אתר</label>
                <input value={form.website} onChange={e => f("website", e.target.value)} dir="ltr"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">דירוג</label>
                <input type="number" min="1" max="5" step="0.1" value={form.rating}
                  onChange={e => f("rating", parseFloat(e.target.value))} dir="ltr"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400" />
              </div>
            </div>

            <button onClick={handleSave} disabled={loading || !form.name || !form.profession || !form.city}
              className="w-full py-3 rounded-xl text-white font-bold text-sm disabled:opacity-50"
              style={{ backgroundColor: "#1E5FA8" }}>
              {loading ? "שומר..." : "שמור שותף ←"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}