import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { updatePaymentStatus } from "../services/PaymentService";
import { sendPaymentReceiptEmail } from "../services/EmailService";
import { trackEvent } from "../lib/trackEvent";

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [processed, setProcessed] = useState(false);

  useEffect(() => {
    document.title = "תשלום הושלם | Fresh Start";
    async function process() {
      const params = new URLSearchParams(window.location.search);
      const orderId = params.get("orderId");
      if (!orderId || processed) return;
      setProcessed(true);

      const record = await updatePaymentStatus(orderId, "completed");
      trackEvent("payment_completed", { orderId });

      // Fire-and-forget receipt email
      try {
        const user = await base44.auth.me();
        if (user && record) {
          sendPaymentReceiptEmail({
            orderId,
            userEmail: user.email,
            amount: record.amount_ils,
            description: record.notes || record.feature_key || "",
            userName: user.full_name || "",
          });
        }
      } catch (_) {}
    }
    process();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-lg p-10 max-w-sm w-full text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5 text-4xl">✅</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">התשלום בוצע בהצלחה!</h1>
        <p className="text-sm text-gray-500 mb-8">קבלה נשלחה לאימייל שלך</p>
        <button
          onClick={() => navigate("/dashboard")}
          className="w-full py-3 rounded-xl text-white font-bold text-sm"
          style={{ backgroundColor: "#1E5FA8" }}
        >
          חזרה לדשבורד ←
        </button>
      </div>
    </div>
  );
}