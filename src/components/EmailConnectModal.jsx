import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, Check } from "lucide-react";

export default function EmailConnectModal({ onClose, onConnected }) {
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleConnect() {
    if (!email.trim()) return;
    setSaving(true);
    // Save email to UserProfile as proxy
    const user = await base44.auth.me();
    const profiles = await base44.entities.UserProfile.filter({ created_by: user.email });
    if (profiles.length > 0) {
      await base44.entities.UserProfile.update(profiles[0].id, { contact_email: email });
    }
    localStorage.setItem("emailConnected", "true");
    localStorage.setItem("connectedEmail", email);
    setSaving(false);
    setSuccess(true);
    setTimeout(() => onConnected(email), 1500);
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">חיבור תיבת דוא״ל</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5">
          {success ? (
            <div className="flex flex-col items-center py-4 text-center gap-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: "#DCFCE7" }}>
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <p className="font-medium text-gray-900">האימייל {email} חובר בהצלחה ✓</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-500 mb-4">הכנס את כתובת האימייל שלך כדי לאפשר זיהוי אוטומטי של הזמנות</p>
              <div className="flex flex-col gap-1 mb-4">
                <label className="text-xs font-medium text-gray-600">כתובת אימייל</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  dir="ltr"
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={handleConnect} disabled={saving || !email.trim()}
                  className="flex-1 py-2.5 rounded-lg text-white font-medium text-sm disabled:opacity-60"
                  style={{ backgroundColor: "#1E5FA8" }}>
                  {saving ? "מחבר..." : "חבר"}
                </button>
                <button onClick={onClose} className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50">
                  ביטול
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}