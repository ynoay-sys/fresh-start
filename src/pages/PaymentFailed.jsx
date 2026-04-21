import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { updatePaymentStatus } from "../services/PaymentService";
import { trackEvent } from "../lib/trackEvent";

export default function PaymentFailed() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "תשלום נכשל | Fresh Start";
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get("orderId");
    if (orderId) {
      updatePaymentStatus(orderId, "failed").catch(() => {});
      trackEvent("payment_failed", { orderId });
    }
  }, []);

  function handleRetry() {
    // Go back if possible, otherwise fallback to billing
    if (window.history.length > 2) {
      navigate(-2); // skip the Tranzila redirect step
    } else {
      navigate("/billing");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-lg p-10 max-w-sm w-full text-center">
        <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-5 text-4xl">❌</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">התשלום לא הושלם</h1>
        <p className="text-sm text-gray-500 mb-8">לא בוצע חיוב. ניתן לנסות שוב.</p>
        <div className="space-y-3">
          <button
            onClick={handleRetry}
            className="w-full py-3 rounded-xl text-white font-bold text-sm"
            style={{ backgroundColor: "#1E5FA8" }}
          >
            נסה שוב ←
          </button>
          <button
            onClick={() => navigate("/billing")}
            className="w-full py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50"
          >
            היסטוריית תשלומים
          </button>
        </div>
      </div>
    </div>
  );
}