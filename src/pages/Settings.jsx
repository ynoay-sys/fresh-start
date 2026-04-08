import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ChevronDown, ChevronUp, ShieldCheck, Bell, Globe, Trash2, Lock, Database, User } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";

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

const PLAN_LABELS = { free: "חינמי", starter: "בסיסי", pro: "מקצועי", business: "עסקי" };
const PLAN_COLORS = { free: "bg-gray-100 text-gray-600", starter: "bg-blue-100 text-blue-700", pro: "bg-purple-100 text-purple-700", business: "bg-green-100 text-green-700" };

export default function Settings() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  const [notifPrefs, setNotifPrefs] = useState(() => {
    try {
      const saved = localStorage.getItem("notificationPrefs");
      return saved ? JSON.parse(saved) : { birthdays: true, holidays: true, system: true, milestones: true };
    } catch { return { birthdays: true, holidays: true, system: true, milestones: true }; }
  });

  const [deleteStep, setDeleteStep] = useState(0);
  const [deleteInput, setDeleteInput] = useState("");
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      base44.entities.UserProfile.filter({ created_by: u.email }).then(r => setProfile(r[0] || null));
    });
  }, []);

  function toggleNotif(key) {
    const next = { ...notifPrefs, [key]: !notifPrefs[key] };
    setNotifPrefs(next);
    localStorage.setItem("notificationPrefs", JSON.stringify(next));
  }

  async function handleExport() {
    setExportLoading(true);
    const [docs, contacts, clients, milestones, orders, payments] = await Promise.all([
      base44.entities.Document.filter({ created_by: user.email }),
      base44.entities.Contact.filter({ created_by: user.email }),
      base44.entities.Client.filter({ created_by: user.email }),
      base44.entities.Milestone.filter({ created_by: user.email }),
      base44.entities.Order.filter({ created_by: user.email }),
      base44.entities.Payment.filter({ created_by: user.email }),
    ]);
    const exportData = { profile, documents: docs, contacts, clients, milestones, orders, payments };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fresh-start-export-${format(new Date(), "yyyy-MM-dd")}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportLoading(false);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8" dir="rtl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">הגדרות</h1>

      {/* Account */}
      <Section icon={User} title="פרטי חשבון" defaultOpen>
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-500">אימייל</span>
            <span className="text-sm font-medium text-gray-800">{user?.email || "—"}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-t border-gray-100">
            <span className="text-sm text-gray-500">חבר מאז</span>
            <span className="text-sm font-medium text-gray-800">
              {user?.created_date ? format(new Date(user.created_date), "dd/MM/yyyy") : "—"}
            </span>
          </div>
          <div className="flex items-center justify-between py-2 border-t border-gray-100">
            <span className="text-sm text-gray-500">מנוי</span>
            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${PLAN_COLORS[profile?.plan || "free"]}`}>
              {PLAN_LABELS[profile?.plan || "free"]}
            </span>
          </div>
        </div>
      </Section>

      {/* Notifications */}
      <Section icon={Bell} title="העדפות התראות">
        <div className="pt-2">
          <ToggleRow label="קבל התראות יום הולדת" value={notifPrefs.birthdays} onChange={() => toggleNotif("birthdays")} />
          <ToggleRow label="קבל התראות חגים" value={notifPrefs.holidays} onChange={() => toggleNotif("holidays")} />
          <ToggleRow label="קבל התראות מערכת" value={notifPrefs.system} onChange={() => toggleNotif("system")} />
          <ToggleRow label="קבל תזכורות אבן דרך" value={notifPrefs.milestones} onChange={() => toggleNotif("milestones")} />
          <p className="text-xs text-green-600 mt-3">✓ ההעדפות נשמרות אוטומטית</p>
        </div>
      </Section>

      {/* Language & Region */}
      <Section icon={Globe} title="שפה ואזור">
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between py-2">
            <p className="text-sm font-medium text-gray-800">שפה</p>
            <span className="text-sm font-semibold text-gray-700 bg-gray-100 px-3 py-1 rounded-lg">עברית</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <p className="text-sm font-medium text-gray-800">אזור זמן</p>
            <span className="text-sm font-semibold text-gray-700 bg-gray-100 px-3 py-1 rounded-lg">Asia/Jerusalem</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <p className="text-sm font-medium text-gray-800">פורמט תאריך</p>
            <span className="text-sm font-semibold text-gray-700 bg-gray-100 px-3 py-1 rounded-lg">DD/MM/YYYY</span>
          </div>
        </div>
      </Section>

      {/* Security */}
      <Section icon={Lock} title="אבטחה">
        <div className="pt-2 space-y-3">
          <div className="flex items-center justify-between py-3 border border-gray-100 rounded-xl px-4">
            <p className="text-sm font-medium text-gray-800">אימות דו-שלבי</p>
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">בקרוב</span>
          </div>
        </div>
      </Section>

      {/* Data */}
      <Section icon={Database} title="נתונים ופרטיות">
        <div className="pt-2 space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">ייצא את כל הנתונים שלך כקובץ JSON</p>
            <button
              onClick={handleExport}
              disabled={exportLoading || !user}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {exportLoading ? "מייצא..." : "ייצא את כל הנתונים שלי 📦"}
            </button>
          </div>
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs text-gray-400 mb-2">קישורים משפטיים:</p>
            <div className="flex gap-3">
              <Link to="/terms" className="text-xs text-blue-600 underline">תנאי שימוש</Link>
              <Link to="/privacy" className="text-xs text-blue-600 underline">מדיניות פרטיות</Link>
            </div>
          </div>
        </div>
      </Section>

      {/* Danger Zone */}
      <Section icon={Trash2} title="מחיקת חשבון">
        <div className="pt-2">
          <p className="text-sm text-gray-600 mb-4">מחיקת החשבון היא פעולה בלתי הפיכה. כל המידע שלך יימחק לצמיתות.</p>
          {deleteStep === 0 && (
            <button onClick={() => setDeleteStep(1)} className="px-4 py-2 rounded-lg border-2 border-red-200 text-red-600 text-sm font-medium hover:bg-red-50">
              מחק חשבון
            </button>
          )}
          {deleteStep === 1 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-red-600">האם אתה בטוח? פעולה זו אינה הפיכה.</p>
              <div className="flex gap-2">
                <button onClick={() => setDeleteStep(2)} className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium">כן, המשך</button>
                <button onClick={() => setDeleteStep(0)} className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700">ביטול</button>
              </div>
            </div>
          )}
          {deleteStep === 2 && (
            <div className="space-y-3">
              <p className="text-sm text-gray-700">הקלד <strong>מחק</strong> לאישור:</p>
              <input
                type="text"
                value={deleteInput}
                onChange={e => setDeleteInput(e.target.value)}
                placeholder='הקלד "מחק"'
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-400"
                dir="rtl"
              />
              {deleteInput === "מחק" && (
                <div>
                  <button
                    onClick={() => { setDeleteStep(0); setDeleteInput(""); alert("בקרוב — פנה לתמיכה"); }}
                    className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium"
                  >
                    מחק סופית
                  </button>
                </div>
              )}
              <button onClick={() => { setDeleteStep(0); setDeleteInput(""); }} className="block text-sm text-gray-400 underline">ביטול</button>
            </div>
          )}
        </div>
      </Section>
    </div>
  );
}