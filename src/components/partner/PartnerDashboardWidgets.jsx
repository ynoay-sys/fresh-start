import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

function ProfileCardPreview({ partner, navigate }) {
  if (!partner) return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
      <h2 className="text-sm font-bold text-gray-800 mb-3">כך אתה נראה בשוק המקצועי</h2>
      <div className="text-center py-4">
        <p className="text-sm text-gray-400 mb-3">פרופיל מקצועי עדיין לא נוצר</p>
        <button onClick={() => navigate("/partner/profile")}
          className="px-4 py-2 rounded-lg text-white text-xs font-medium"
          style={{ backgroundColor: "#1A7A4A" }}>
          צור פרופיל ←
        </button>
      </div>
    </div>
  );

  const initials = (partner.name || "").split(" ").map(w => w[0]).slice(0, 2).join("");

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-gray-800">כך אתה נראה בשוק המקצועי</h2>
        <button onClick={() => navigate("/partner/profile")}
          className="text-xs font-medium" style={{ color: "#1A7A4A" }}>ערוך פרופיל ←</button>
      </div>
      <div className="border border-gray-100 rounded-xl p-4 bg-gray-50">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
            style={{ backgroundColor: "#1A7A4A" }}>{initials}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-bold text-gray-900 text-sm">{partner.name}</p>
              {partner.is_verified && <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">מאומת ✓</span>}
              {partner.is_premium && <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium">פרמיום ⭐</span>}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">{partner.profession}</p>
            {partner.city && <p className="text-xs text-gray-400 mt-0.5">📍 {partner.city}</p>}
            {partner.description && <p className="text-xs text-gray-600 mt-2 line-clamp-2">{partner.description}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileViewsWidget({ partner, plan, viewNotifs, navigate }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
      <h2 className="text-sm font-bold text-gray-800 mb-3">צפיות בפרופיל שלך 👁️</h2>
      {plan === "free" ? (
        <div className="relative">
          <div className="blur-sm pointer-events-none py-4 text-center">
            <p className="text-4xl font-bold text-gray-300">{partner?.profile_views || 0}</p>
            <p className="text-sm text-gray-300">צפיות אחרונות</p>
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl" style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)" }}>
            <p className="text-sm font-medium text-gray-700 mb-2">שדרג לפרו לצפות בכל הסטטיסטיקות</p>
            <button onClick={() => navigate("/partner/pricing")}
              className="px-3 py-1.5 rounded-lg text-white text-xs font-medium"
              style={{ backgroundColor: "#1A7A4A" }}>שדרג ←</button>
          </div>
        </div>
      ) : (
        <div>
          <p className="text-3xl font-bold mb-1" style={{ color: "#1A7A4A" }}>{partner?.profile_views || 0}</p>
          <p className="text-sm text-gray-500 mb-3">
            {viewNotifs.filter(n => {
              const d = new Date(n.created_date);
              const now = new Date();
              return now - d < 30 * 24 * 60 * 60 * 1000;
            }).length} אנשים צפו בפרופיל שלך החודש
          </p>
          {plan === "premium" && viewNotifs.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-2">מי צפה בפרופיל שלך:</p>
              <div className="space-y-1.5">
                {viewNotifs.slice(0, 5).map(n => (
                  <div key={n.id} className="flex items-center justify-between text-xs text-gray-600">
                    <span>{n.body}</span>
                    <span className="text-gray-400">{n.created_date ? format(new Date(n.created_date), "dd/MM") : ""}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ContactRequestsWidget({ plan, requestNotifs, navigate }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-gray-800">פניות חדשות 📨</h2>
        <button onClick={() => navigate("/partner/requests")} className="text-xs font-medium" style={{ color: "#1A7A4A" }}>
          כל הפניות ←
        </button>
      </div>
      {plan === "free" ? (
        <div className="text-center py-3">
          <p className="text-lg font-bold text-gray-800">{requestNotifs.length} פניות</p>
          <p className="text-sm text-gray-500 mt-1 mb-3">שדרג לראות אותן</p>
          <button onClick={() => navigate("/partner/pricing")}
            className="px-4 py-2 rounded-lg text-white text-xs font-medium"
            style={{ backgroundColor: "#1A7A4A" }}>שדרג לפרו ←</button>
        </div>
      ) : requestNotifs.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-3">אין פניות עדיין</p>
      ) : (
        <div className="space-y-2">
          {requestNotifs.slice(0, plan === "pro" ? 5 : requestNotifs.length).map(n => (
            <div key={n.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <div>
                <p className="text-sm font-medium text-gray-800">{n.title}</p>
                <p className="text-xs text-gray-400">{n.created_date ? format(new Date(n.created_date), "dd/MM HH:mm") : ""}</p>
              </div>
              {!n.is_read && <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">חדש</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PartnerDashboardWidgets() {
  const navigate = useNavigate();
  const [partner, setPartner] = useState(null);
  const [profile, setProfile] = useState(null);
  const [viewNotifs, setViewNotifs] = useState([]);
  const [requestNotifs, setRequestNotifs] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      const u = await base44.auth.me();
      const [partners, profiles, notifs] = await Promise.all([
        base44.entities.ProfessionalPartner.filter({ email: u.email }),
        base44.entities.UserProfile.filter({ created_by: u.email }),
        base44.entities.Notification.filter({ created_by: u.email }, "-created_date"),
      ]);
      setPartner(partners[0] || null);
      setProfile(profiles[0] || null);
      setViewNotifs(notifs.filter(n => n.type === "partner_view"));
      setRequestNotifs(notifs.filter(n => n.type === "partner_contact_request"));
      setLoaded(true);
    }
    load();
  }, []);

  if (!loaded) return null;

  const plan = profile?.partner_plan || "free";

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 px-1">
        <span className="text-xs font-semibold text-green-700 uppercase tracking-wider">⭐ הכלים המקצועיים שלי</span>
      </div>
      <ProfileCardPreview partner={partner} navigate={navigate} />
      <ProfileViewsWidget partner={partner} plan={plan} viewNotifs={viewNotifs} navigate={navigate} />
      <ContactRequestsWidget plan={plan} requestNotifs={requestNotifs} navigate={navigate} />
      <hr style={{ border: "none", borderTop: "2px solid #E5E7EB", margin: "16px 0 24px" }} />
    </div>
  );
}