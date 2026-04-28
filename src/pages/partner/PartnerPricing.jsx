import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import BackButton from "../../components/BackButton";
import PaywallModal from "../../components/PaywallModal";

const PLANS = [
  {
    key: "free",
    name: "חינמי",
    price: 0,
    badge: null,
    features: [
      { label: "פרופיל בשוק המקצועי", ok: true },
      { label: "5 צפיות אחרונות בפרופיל", ok: true },
      { label: "3 פניות מלקוחות בחודש", ok: true },
      { label: 'תג "שותף"', ok: true },
      { label: "זהות הצופים", ok: false },
      { label: "סטטיסטיקות מתקדמות", ok: false },
      { label: "עדיפות בתוצאות חיפוש", ok: false },
    ],
  },
  {
    key: "pro",
    name: "פרו",
    price: 99,
    badge: "הכי פופולרי 🔥",
    badgeColor: "#1E5FA8",
    features: [
      { label: "הכל בחינמי +", ok: true },
      { label: "30 ימי סטטיסטיקות", ok: true },
      { label: "20 פניות בחודש", ok: true },
      { label: 'תג "שותף מאומת ✓"', ok: true },
      { label: "מיקום אמצעי בחיפוש", ok: true },
      { label: "זהות הצופים", ok: false },
    ],
  },
  {
    key: "premium",
    name: "פרמיום",
    price: 249,
    badge: "המקצועי ⭐",
    badgeColor: "#B8860B",
    features: [
      { label: "הכל בפרו +", ok: true },
      { label: "זהות הצופים בפרופיל", ok: true },
      { label: "פניות ללא הגבלה", ok: true },
      { label: 'תג "שותף פרמיום ⭐"', ok: true },
      { label: "מיקום ראשון בחיפוש", ok: true },
      { label: "תג זמן תגובה", ok: true },
      { label: "אנליטיקה מתקדמת", ok: true },
    ],
  },
];

export default function PartnerPricing() {
  const [currentPlan, setCurrentPlan] = useState("free");
  const [paywallTarget, setPaywallTarget] = useState(null);

  useEffect(() => {
    document.title = "תוכניות שותפים | Fresh Start";
    async function load() {
      const u = await base44.auth.me();
      const profiles = await base44.entities.UserProfile.filter({ created_by: u.email });
      setCurrentPlan(profiles[0]?.partner_plan || "free");
    }
    load();
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8" dir="rtl">
      <BackButton />
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">תוכניות שותפים מקצועיים</h1>
        <p className="text-gray-500">בחר את התוכנית המתאימה לעסק שלך</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {PLANS.map(plan => {
          const isCurrent = plan.key === currentPlan;
          return (
            <div key={plan.key}
              className={`bg-white rounded-2xl border-2 p-6 flex flex-col transition-all ${isCurrent ? "border-green-500 shadow-lg" : "border-gray-200 hover:border-gray-300"}`}>
              {plan.badge && (
                <div className="mb-3">
                  <span className="text-xs font-bold px-3 py-1 rounded-full text-white" style={{ backgroundColor: plan.badgeColor }}>
                    {plan.badge}
                  </span>
                </div>
              )}
              <h2 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h2>
              <p className="text-3xl font-bold mb-1" style={{ color: "#1A7A4A" }}>
                ₪{plan.price}
                {plan.price > 0 && <span className="text-sm font-normal text-gray-400">/חודש</span>}
              </p>
              {isCurrent && (
                <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full w-fit mb-3">התוכנית הנוכחית שלך</span>
              )}
              <ul className="space-y-2 mb-6 flex-1 mt-3">
                {plan.features.map(f => (
                  <li key={f.label} className="flex items-center gap-2 text-sm">
                    <span className={f.ok ? "text-green-600" : "text-gray-300"}>
                      {f.ok ? "✓" : "✗"}
                    </span>
                    <span className={f.ok ? "text-gray-700" : "text-gray-400"}>{f.label}</span>
                  </li>
                ))}
              </ul>
              {plan.key !== "free" && !isCurrent && (
                <button onClick={() => setPaywallTarget(plan)}
                  className="w-full py-3 rounded-xl text-white font-bold text-sm"
                  style={{ backgroundColor: plan.key === "premium" ? "#B8860B" : "#1A7A4A" }}>
                  שדרג עכשיו ←
                </button>
              )}
              {plan.key === "free" && !isCurrent && (
                <button className="w-full py-3 rounded-xl border border-gray-200 text-gray-500 text-sm">
                  תוכנית ברירת מחדל
                </button>
              )}
            </div>
          );
        })}
      </div>

      {paywallTarget && (
        <PaywallModal
          featureKey="partner_plan"
          usedCount={0}
          onClose={() => setPaywallTarget(null)}
          onPaymentSuccess={() => setPaywallTarget(null)}
        />
      )}
    </div>
  );
}