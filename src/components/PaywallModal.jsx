import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { PRICING_CONFIG } from "../lib/pricingConfig";
import { initiatePayment, createPendingPayment, getPaymentStatus } from "../services/PaymentService";
import { trackEvent } from "../lib/trackEvent";

export default function PaywallModal({ featureKey, usedCount = 0, onClose, onPaymentSuccess }) {
  const config = PRICING_CONFIG[featureKey];
  const [loading, setLoading] = useState(false);
  const [redirected, setRedirected] = useState(false);
  const [checking, setChecking] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [statusMsg, setStatusMsg] = useState("");
  const [statusType, setStatusType] = useState(""); // "success" | "pending" | "failed"

  if (!config) return null;

  async function handlePay() {
    setLoading(true);
    const user = await base44.auth.me();
    const oid = "FS-" + Date.now() + "-" + Math.floor(Math.random() * 10000);
    setOrderId(oid);

    // Save pending record BEFORE opening the payment window
    await createPendingPayment({
      orderId: oid,
      amount: config.price_ils,
      description: config.label_he,
      featureKey,
      userEmail: user.email,
      userId: user.id,
    });

    const url = initiatePayment({
      amount: config.price_ils,
      description: config.label_he,
      userEmail: user.email,
      orderId: oid,
    });

    window.open(url, "_blank");
    trackEvent("payment_initiated", { feature: featureKey, amount: config.price_ils });
    setLoading(false);
    setRedirected(true);
  }

  async function handleCheckStatus() {
    if (!orderId) return;
    setChecking(true);
    setStatusMsg("");
    const status = await getPaymentStatus(orderId);
    setChecking(false);

    if (status === "completed") {
      setStatusType("success");
      setStatusMsg("התשלום בוצע בהצלחה! ✅");
      trackEvent("payment_completed", { feature: featureKey });
      // Extend usage by decrementing (same logic as before)
      const user = await base44.auth.me();
      const usageRecords = await base44.entities.UserFeatureUsage.filter({ created_by: user.email, feature_key: featureKey });
      if (usageRecords.length > 0) {
        await base44.entities.UserFeatureUsage.update(usageRecords[0].id, {
          usage_count: Math.max(0, (usageRecords[0].usage_count || 0) - 1),
        });
      }
      setTimeout(() => { onPaymentSuccess(); onClose(); }, 1500);
    } else if (status === "failed") {
      setStatusType("failed");
      setStatusMsg("התשלום נכשל. נסה שוב או פנה לתמיכה.");
    } else {
      setStatusType("pending");
      setStatusMsg("התשלום טרם הושלם. אנא השלם את התשלום בחלון שנפתח.");
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">🔒 תכונה בתשלום</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Payment Summary */}
          <div className="bg-blue-50 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">סיכום תשלום</p>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-2xl">{config.icon}</span>
              <span className="font-semibold text-gray-800">{config.label_he}</span>
            </div>
            <p className="text-xl font-bold text-blue-700">₪{config.price_ils}</p>
            {config.free_quota > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                השתמשת ב-{usedCount} מתוך {config.free_quota} שימושים חינמיים
              </p>
            )}
          </div>

          {/* Security badges */}
          <div className="space-y-1.5">
            <p className="text-xs text-gray-500 flex items-center gap-2">🔒 תשלום מאובטח דרך Tranzila</p>
            <p className="text-xs text-gray-500 flex items-center gap-2">✓ עמידה בתקן PCI-DSS</p>
            <p className="text-xs text-gray-500 flex items-center gap-2">🇮🇱 שער תשלום ישראלי מאושר</p>
          </div>

          {/* Status message */}
          {statusMsg && (
            <div className={`rounded-xl px-4 py-3 text-sm font-medium ${
              statusType === "success" ? "bg-green-50 text-green-700" :
              statusType === "failed" ? "bg-red-50 text-red-700" :
              "bg-orange-50 text-orange-700"
            }`}>
              {statusMsg}
            </div>
          )}

          {!redirected ? (
            /* CTA — before redirect */
            <div className="flex flex-col gap-3">
              <button
                onClick={handlePay}
                disabled={loading}
                className="w-full py-3 rounded-xl text-white font-bold text-sm disabled:opacity-70 flex items-center justify-center gap-2"
                style={{ backgroundColor: "#1E5FA8" }}
              >
                {loading ? (
                  <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> טוען...</>
                ) : (
                  "המשך לתשלום מאובטח ←"
                )}
              </button>
              <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50">
                ביטול
              </button>
            </div>
          ) : (
            /* After redirect — check status flow */
            <div className="space-y-3">
              <div className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-600 leading-relaxed">
                נפתח חלון תשלום מאובטח. לאחר השלמת התשלום, חזור לכאן ולחץ "בדוק סטטוס תשלום".
              </div>
              <button
                onClick={handleCheckStatus}
                disabled={checking || statusType === "success"}
                className="w-full py-3 rounded-xl text-white font-bold text-sm disabled:opacity-70 flex items-center justify-center gap-2"
                style={{ backgroundColor: "#1A7A4A" }}
              >
                {checking ? (
                  <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> בודק...</>
                ) : (
                  "בדוק סטטוס תשלום"
                )}
              </button>
              <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50">
                סגור
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}