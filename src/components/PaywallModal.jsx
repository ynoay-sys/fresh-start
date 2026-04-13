import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { PRICING_CONFIG } from "../lib/pricingConfig";

export default function PaywallModal({ featureKey, usedCount = 0, onClose, onPaymentSuccess }) {
  const config = PRICING_CONFIG[featureKey];
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [holderName, setHolderName] = useState("");
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!config) return null;

  function formatCardNumber(val) {
    const digits = val.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
  }

  function formatExpiry(val) {
    const digits = val.replace(/\D/g, "").slice(0, 4);
    if (digits.length > 2) return digits.slice(0, 2) + "/" + digits.slice(2);
    return digits;
  }

  async function handlePay() {
    setProcessing(true);
    await new Promise(r => setTimeout(r, 2000));
    setSuccess(true);

    // Create Payment record
    const user = await base44.auth.me();
    const ref = "SIM-" + Math.floor(10000000 + Math.random() * 90000000);
    await base44.entities.Payment.create({
      user_id: user.id,
      feature_key: featureKey,
      amount_ils: config.price_ils,
      currency: "ILS",
      status: "completed",
      gateway_ref: ref,
    });

    // Extend usage by 1
    const usageRecords = await base44.entities.UserFeatureUsage.filter({
      created_by: user.email,
      feature_key: featureKey,
    });
    if (usageRecords.length > 0) {
      await base44.entities.UserFeatureUsage.update(usageRecords[0].id, {
        usage_count: (usageRecords[0].usage_count || 0) - 1,
      });
    }

    await new Promise(r => setTimeout(r, 1500));
    onPaymentSuccess();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" style={{ overflow:'hidden', width:'100%', boxSizing:'border-box' }}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">🔒 תכונה בתשלום</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Feature Info */}
          <div className="bg-blue-50 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-1">
              <span className="text-2xl">{config.icon}</span>
              <span className="font-semibold text-gray-800">{config.label_he}</span>
            </div>
            <p className="text-sm font-bold text-blue-700">₪{config.price_ils} לשימוש אחד</p>
            {config.free_quota > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                השתמשת ב-{usedCount} מתוך {config.free_quota} שימושים חינמיים
              </p>
            )}
          </div>

          {!success ? (
            <>
              {/* Payment Form */}
              <div className="space-y-3">
                <p className="text-sm font-semibold text-gray-700">פרטי תשלום</p>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={e => setCardNumber(formatCardNumber(e.target.value))}
                  placeholder="•••• •••• •••• ••••"
                  dir="ltr"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-400 text-left"
                />
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', width:'100%', boxSizing:'border-box', overflow:'hidden' }}>
                  <input
                    type="text"
                    value={expiry}
                    onChange={e => setExpiry(formatExpiry(e.target.value))}
                    placeholder="MM/YY"
                    dir="ltr"
                    style={{ width:'100%', boxSizing:'border-box', minWidth:0 }}
                    className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-400 text-left"
                  />
                  <input
                    type="password"
                    value={cvv}
                    onChange={e => setCvv(e.target.value.replace(/\D/g, "").slice(0, 3))}
                    placeholder="CVV"
                    dir="ltr"
                    style={{ width:'100%', boxSizing:'border-box', minWidth:0 }}
                    className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-400 text-left"
                  />
                </div>
                <input
                  type="text"
                  value={holderName}
                  onChange={e => setHolderName(e.target.value)}
                  placeholder="שם בעל הכרטיס"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-400"
                />
                <p className="text-xs text-gray-400">
                  זהו סימולציה של תשלום. בגרסת הייצור יתבצע חיוב אמיתי.
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handlePay}
                  disabled={processing}
                  className="flex-1 py-3 rounded-xl text-white font-bold text-sm disabled:opacity-70 flex items-center justify-center gap-2"
                  style={{ backgroundColor: "#1E5FA8" }}
                >
                  {processing ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      מעבד...
                    </>
                  ) : (
                    `שלם ₪${config.price_ils} ←`
                  )}
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-3 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50"
                >
                  ביטול
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-4 space-y-2">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto text-3xl">✅</div>
              <p className="font-bold text-green-700 text-lg">התשלום בוצע בהצלחה!</p>
              <p className="text-sm text-gray-500">₪{config.price_ils} חויב עבור: {config.label_he}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}