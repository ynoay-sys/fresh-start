import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import BackButton from "../../components/BackButton";
import { format } from "date-fns";

export default function PartnerRequests() {
  const [notifications, setNotifications] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "פניות שהתקבלו | Fresh Start";
    async function load() {
      const u = await base44.auth.me();
      const [notifs, profiles] = await Promise.all([
        base44.entities.Notification.filter({ created_by: u.email }, "-created_date"),
        base44.entities.UserProfile.filter({ created_by: u.email }),
      ]);
      setNotifications(notifs.filter(n => n.type === "partner_contact_request"));
      setProfile(profiles[0] || null);
      setLoading(false);
    }
    load();
  }, []);

  const plan = profile?.partner_plan || "free";
  const visibleRequests = plan === "free" ? [] : plan === "pro" ? notifications.slice(0, 20) : notifications;

  if (loading) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-green-100 border-t-green-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-8" dir="rtl">
      <BackButton />
      <h1 className="text-2xl font-bold text-gray-900 mb-2">פניות שהתקבלו 📨</h1>
      <p className="text-sm text-gray-500 mb-6">לקוחות שרצו ליצור איתך קשר</p>

      {plan === "free" ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-4xl mb-3">🔒</p>
          <p className="text-lg font-bold text-gray-800 mb-1">יש לך {notifications.length} פניות</p>
          <p className="text-sm text-gray-500 mb-4">שדרג לפרו כדי לראות את פרטי הפניות</p>
          <a href="/partner/pricing" className="inline-block px-5 py-2.5 rounded-xl text-white text-sm font-medium" style={{ backgroundColor: "#1A7A4A" }}>
            שדרג לפרו ←
          </a>
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-5xl mb-4">📨</p>
          <p>עדיין אין פניות</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleRequests.map(n => (
            <div key={n.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">{n.title}</p>
                  <p className="text-sm text-gray-600 mt-1">{n.body}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {n.created_date ? format(new Date(n.created_date), "dd/MM/yyyy HH:mm") : ""}
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ml-2 ${n.is_read ? "bg-gray-100 text-gray-500" : "bg-green-100 text-green-700"}`}>
                  {n.is_read ? "נקרא" : "חדש"}
                </span>
              </div>
            </div>
          ))}
          {plan === "pro" && notifications.length > 20 && (
            <p className="text-center text-sm text-gray-400 py-2">שדרג לפרמיום לראות כל הפניות</p>
          )}
        </div>
      )}
    </div>
  );
}