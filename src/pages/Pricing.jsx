import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { PRICING_CONFIG } from "../lib/pricingConfig";

function FeaturePricingCard({ config, usageRecord }) {
  const used = usageRecord?.usage_count || 0;
  const quota = config.free_quota;
  const withinFree = quota > 0 && used < quota;
  const exceeded = quota > 0 && used >= quota;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-3 hover:shadow-md transition-all">
      <div className="flex items-center justify-between">
        <span className="text-3xl">{config.icon}</span>
        {withinFree && (
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-green-100 text-green-700">חינם ✓</span>
        )}
        {exceeded && (
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-orange-100 text-orange-700">בתשלום</span>
        )}
        {quota === 0 && (
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">בתשלום</span>
        )}
      </div>

      <div>
        <p className="font-bold text-gray-900 text-base mb-1">{config.label_he}</p>
        {quota > 0 ? (
          <div>
            <p className="text-sm text-green-600 font-medium">{quota} ראשונים חינם</p>
            <p className="text-sm text-gray-500">לאחר מכן: ₪{config.price_ils} לשימוש</p>
          </div>
        ) : (
          <p className="text-sm font-semibold" style={{ color: "#1E5FA8" }}>₪{config.price_ils} לשימוש</p>
        )}
      </div>

      {quota > 0 && (
        <div>
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>השתמשת ב-{used} מתוך {quota}</span>
            <span>{Math.round((used / quota) * 100)}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(100, (used / quota) * 100)}%`,
                backgroundColor: used >= quota ? "#C25A00" : used >= quota * 0.75 ? "#F59E0B" : "#1A7A4A",
              }}
            />
          </div>
        </div>
      )}
      {quota === 0 && (
        <p className="text-xs text-gray-400">ללא מכסה חינמית</p>
      )}
    </div>
  );
}

export default function Pricing() {
  useEffect(() => { document.title = 'תמחור | Fresh Start'; }, []);
  const [usageMap, setUsageMap] = useState({});
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistDone, setWaitlistDone] = useState(
    !!localStorage.getItem("waitlist_joined")
  );

  useEffect(() => {
    async function load() {
      const user = await base44.auth.me();
      const usageRecords = await base44.entities.UserFeatureUsage.filter({ created_by: user.email });
      const map = {};
      for (const r of usageRecords) map[r.feature_key] = r;
      setUsageMap(map);
    }
    load();
  }, []);

  function handleWaitlist(e) {
    e.preventDefault();
    if (!waitlistEmail.trim()) return;
    localStorage.setItem("waitlist_joined", waitlistEmail);
    setWaitlistDone(true);
  }

  const features = Object.values(PRICING_CONFIG);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8" dir="rtl">
      <button onClick={() => window.history.back()} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#1E5FA8', cursor: 'pointer', fontSize: '14px', fontFamily: 'Rubik, sans-serif', padding: '8px 0', marginBottom: '8px' }}>
        <span>→</span><span>חזרה</span>
      </button>
      {/* Header */}
      <div className="text-center mb-10">
        <span className="inline-block px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full mb-4">
          ללא מנוי חודשי — שלם לפי שימוש
        </span>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">שלם רק על מה שאתה משתמש בו</h1>
        <p className="text-gray-500 text-base">Fresh Start — בסיס חינמי עם תוספות בתשלום</p>
      </div>

      {/* Feature Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {features.map(config => (
          <FeaturePricingCard
            key={config.feature_key}
            config={config}
            usageRecord={usageMap[config.feature_key] || null}
          />
        ))}
      </div>

      {/* Coming Soon Plans */}
      <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8">
        <h2 className="text-xl font-bold text-gray-500 mb-1 text-center">בקרוב — מסלולי מנוי חודשיים</h2>
        <p className="text-center text-sm text-gray-400 mb-6">מסלולים חודשיים שיספקו ערך מוגדל לעסק שלך</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 opacity-50">
          {[
            { name: "Starter", price: 49, desc: "עצמאי פעיל" },
            { name: "Pro", price: 129, desc: "עסק מבוסס" },
            { name: "Business", price: 249, desc: "צוות קטן" },
          ].map(plan => (
            <div key={plan.name} className="bg-gray-100 rounded-xl p-5 text-center cursor-not-allowed">
              <p className="font-bold text-gray-700 text-lg mb-1">{plan.name}</p>
              <p className="text-2xl font-bold text-gray-800 mb-1">₪{plan.price}<span className="text-sm font-normal text-gray-500">/חודש</span></p>
              <p className="text-sm text-gray-500">{plan.desc}</p>
            </div>
          ))}
        </div>

        {/* Waitlist */}
        <div className="max-w-md mx-auto text-center">
          <p className="text-sm font-semibold text-gray-600 mb-3">הצטרף לרשימת ההמתנה</p>
          {waitlistDone ? (
            <p className="text-green-600 font-medium">נרשמת! נעדכן אותך ✓</p>
          ) : (
            <form onSubmit={handleWaitlist} className="flex gap-2">
              <input
                type="email"
                value={waitlistEmail}
                onChange={e => setWaitlistEmail(e.target.value)}
                placeholder="כתובת אימייל שלך"
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-400"
                dir="ltr"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-lg text-white text-sm font-medium"
                style={{ backgroundColor: "#1E5FA8" }}
              >
                שמור מקום
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}