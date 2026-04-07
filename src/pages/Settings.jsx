import { useState } from "react";
import { ChevronDown, ChevronUp, ShieldCheck, Bell, Globe, Trash2, Lock } from "lucide-react";

function Section({ icon: Icon, title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-xl border border-gray-200 mb-4 overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon className="w-4 h-4 text-gray-500" />
          <span className="font-semibold text-gray-800 text-base">{title}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}

function ComingSoonBadge() {
  return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">בקרוב</span>
  );
}

function ToggleRow({ label, description, value, onChange }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-800">{label}</p>
        {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!value)}
        className="relative w-11 h-6 rounded-full transition-colors flex-shrink-0"
        style={{ backgroundColor: value ? "#1E5FA8" : "#D1D5DB" }}
      >
        <span
          className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all"
          style={{ right: value ? "2px" : "auto", left: value ? "auto" : "2px" }}
        />
      </button>
    </div>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const [notifPrefs, setNotifPrefs] = useState({
    deadlines: true,
    birthdays: true,
    orders: true,
    milestones: true,
    system: false,
  });

  function toggleNotif(key) {
    setNotifPrefs(p => ({ ...p, [key]: !p[key] }));
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8" dir="rtl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">הגדרות</h1>

      {/* Account */}
      <Section icon={ShieldCheck} title="הגדרות חשבון" defaultOpen>
        <div className="space-y-3 pt-2">
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">כתובת אימייל</label>
            <div className="flex gap-2">
              <input
                type="email"
                disabled
                placeholder="הכתובת נטענת..."
                className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm bg-gray-50 text-gray-500 outline-none"
              />
              <span className="flex items-center"><ComingSoonBadge /></span>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">סיסמה</label>
            <div className="flex gap-2 items-center">
              <input
                type="password"
                disabled
                placeholder="••••••••"
                className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm bg-gray-50 text-gray-500 outline-none"
              />
              <span className="flex items-center"><ComingSoonBadge /></span>
            </div>
          </div>
        </div>
      </Section>

      {/* Notifications */}
      <Section icon={Bell} title="התראות">
        <div className="pt-2">
          <ToggleRow
            label="תזכורות מועדים"
            description="התראה לפני תאריכי הגשה ומועדים חשובים"
            value={notifPrefs.deadlines}
            onChange={() => toggleNotif("deadlines")}
          />
          <ToggleRow
            label="ימי הולדת"
            description="התראה ביום ההולדת של בני משפחה"
            value={notifPrefs.birthdays}
            onChange={() => toggleNotif("birthdays")}
          />
          <ToggleRow
            label="עדכוני הזמנות"
            description="עדכונים על סטטוס משלוחים"
            value={notifPrefs.orders}
            onChange={() => toggleNotif("orders")}
          />
          <ToggleRow
            label="אבני דרך"
            description="תזכורות למועדי יעד של מטרות"
            value={notifPrefs.milestones}
            onChange={() => toggleNotif("milestones")}
          />
          <ToggleRow
            label="הודעות מערכת"
            description="עדכונים ושיפורים בפלטפורמה"
            value={notifPrefs.system}
            onChange={() => toggleNotif("system")}
          />
          <p className="text-xs text-gray-400 mt-3">* שמירת ההעדפות תהיה זמינה בקרוב</p>
        </div>
      </Section>

      {/* Language & Region */}
      <Section icon={Globe} title="שפה ואזור">
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-gray-800">שפה</p>
              <p className="text-xs text-gray-400">ממשק המשתמש</p>
            </div>
            <span className="text-sm font-semibold text-gray-700 bg-gray-100 px-3 py-1 rounded-lg">עברית</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-gray-800">אזור זמן</p>
              <p className="text-xs text-gray-400">לתאריכים ושעות</p>
            </div>
            <span className="text-sm font-semibold text-gray-700 bg-gray-100 px-3 py-1 rounded-lg">Asia/Jerusalem</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-gray-800">פורמט תאריך</p>
            </div>
            <span className="text-sm font-semibold text-gray-700 bg-gray-100 px-3 py-1 rounded-lg">DD/MM/YYYY</span>
          </div>
        </div>
      </Section>

      {/* Security */}
      <Section icon={Lock} title="אבטחה">
        <div className="pt-2 space-y-3">
          <div className="flex items-center justify-between py-3 border border-gray-100 rounded-xl px-4">
            <div>
              <p className="text-sm font-medium text-gray-800">אימות דו-שלבי</p>
              <p className="text-xs text-gray-400">הוסף שכבת הגנה נוספת לחשבונך</p>
            </div>
            <ComingSoonBadge />
          </div>
          <div className="flex items-center justify-between py-3 border border-gray-100 rounded-xl px-4">
            <div>
              <p className="text-sm font-medium text-gray-800">התנתקות מכל המכשירים</p>
            </div>
            <ComingSoonBadge />
          </div>
        </div>
      </Section>

      {/* Danger Zone */}
      <Section icon={Trash2} title="מחיקת חשבון">
        <div className="pt-2">
          <p className="text-sm text-gray-600 mb-4">
            מחיקת החשבון היא פעולה בלתי הפיכה. כל המידע שלך יימחק לצמיתות.
          </p>
          <div className="flex items-center gap-3">
            <button
              disabled
              className="px-4 py-2 rounded-lg border-2 border-red-200 text-red-400 text-sm font-medium cursor-not-allowed"
            >
              מחק חשבון
            </button>
            <ComingSoonBadge />
          </div>
        </div>
      </Section>
    </div>
  );
}