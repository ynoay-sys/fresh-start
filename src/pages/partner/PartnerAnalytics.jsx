import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import BackButton from "../../components/BackButton";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { format, subDays } from "date-fns";

export default function PartnerAnalytics() {
  const [partner, setPartner] = useState(null);
  const [profile, setProfile] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "הסטטיסטיקות שלי | Fresh Start";
    async function load() {
      const u = await base44.auth.me();
      const [partners, profiles, notifs] = await Promise.all([
        base44.entities.ProfessionalPartner.filter({ email: u.email }),
        base44.entities.UserProfile.filter({ created_by: u.email }),
        base44.entities.Notification.filter({ created_by: u.email }),
      ]);
      setPartner(partners[0] || null);
      setProfile(profiles[0] || null);
      const partnerNotifs = notifs.filter(n => n.type === "partner_view" || n.type === "partner_contact_request");
      setNotifications(partnerNotifs);
      setLoading(false);
    }
    load();
  }, []);

  const plan = profile?.partner_plan || "free";
  const views = partner?.profile_views || 0;
  const requests = partner?.contact_requests_count || 0;

  // Build last 7 days chart data from notifications
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i);
    const dayStr = d.toDateString();
    const count = notifications.filter(n =>
      n.type === "partner_view" && new Date(n.created_date).toDateString() === dayStr
    ).length;
    return { day: format(d, "dd/MM"), views: count };
  });

  if (loading) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-green-100 border-t-green-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-8" dir="rtl">
      <BackButton />
      <h1 className="text-2xl font-bold text-gray-900 mb-6">הסטטיסטיקות שלי 📊</h1>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
          <p className="text-4xl font-bold mb-1" style={{ color: "#1A7A4A" }}>{views}</p>
          <p className="text-sm text-gray-500">צפיות בפרופיל</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
          <p className="text-4xl font-bold mb-1" style={{ color: "#1E5FA8" }}>{requests}</p>
          <p className="text-sm text-gray-500">פניות שהתקבלו</p>
        </div>
      </div>

      {plan === "free" ? (
        <div className="relative bg-white rounded-xl border border-gray-200 p-6">
          <div className="blur-sm pointer-events-none">
            <p className="text-sm font-medium text-gray-600 mb-3">צפיות ב-7 ימים האחרונים</p>
            <div className="h-40 bg-gray-100 rounded-lg" />
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-sm font-semibold text-gray-700 mb-2">שדרג לפרו לצפות בכל הסטטיסטיקות</p>
            <a href="/partner/pricing" className="px-4 py-2 rounded-lg text-white text-sm font-medium" style={{ backgroundColor: "#1A7A4A" }}>שדרג ←</a>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-700 mb-4">צפיות ב-7 ימים האחרונים</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData}>
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="views" fill="#1A7A4A" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}