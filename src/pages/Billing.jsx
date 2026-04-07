import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { PRICING_CONFIG } from "../lib/pricingConfig";

const STATUS_LABELS = {
  completed: { label: "הושלם", cls: "bg-green-100 text-green-700" },
  pending: { label: "ממתין", cls: "bg-orange-100 text-orange-700" },
  failed: { label: "נכשל", cls: "bg-red-100 text-red-700" },
  refunded: { label: "זוכה", cls: "bg-blue-100 text-blue-700" },
};

export default function Billing() {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const user = await base44.auth.me();
      const res = await base44.entities.Payment.filter({ created_by: user.email }, "-created_date");
      setPayments(res);
      setLoading(false);
    }
    load();
  }, []);

  const completed = payments.filter(p => p.status === "completed");
  const total = completed.reduce((sum, p) => sum + (p.amount_ils || 0), 0);

  const featureCounts = {};
  for (const p of completed) {
    featureCounts[p.feature_key] = (featureCounts[p.feature_key] || 0) + 1;
  }
  const topFeatureKey = Object.entries(featureCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
  const topFeatureName = topFeatureKey ? (PRICING_CONFIG[topFeatureKey]?.label_he || topFeatureKey) : null;

  function exportCSV() {
    const now = new Date();
    const month = format(now, "yyyy-MM");
    const header = "Date,Feature,Amount ILS,Status,Reference\n";
    const rows = payments.map(p => {
      const date = p.created_date ? format(new Date(p.created_date), "dd/MM/yyyy HH:mm") : "";
      const feature = PRICING_CONFIG[p.feature_key]?.label_he || p.feature_key || "";
      return `"${date}","${feature}",${p.amount_ils || 0},${p.status || ""},"${p.gateway_ref || ""}"`;
    }).join("\n");
    const blob = new Blob(["\uFEFF" + header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fresh-start-payments-${month}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 overflow-x-hidden w-full" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">היסטוריית תשלומים</h1>
        {payments.length > 0 && (
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            ייצא לאקסל 📊
          </button>
        )}
      </div>

      {/* Summary */}
      {payments.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold" style={{ color: "#1E5FA8" }}>₪{total}</p>
            <p className="text-xs text-gray-500 mt-1">סה״כ הוצאות</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-gray-800">{payments.length}</p>
            <p className="text-xs text-gray-500 mt-1">עסקאות</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-base font-bold text-gray-800 truncate">{topFeatureName || "—"}</p>
            <p className="text-xs text-gray-500 mt-1">תכונה פופולרית</p>
          </div>
        </div>
      )}

      {/* Table */}
      {payments.length === 0 ? (
        <div className="text-center py-24">
          <span className="text-5xl block mb-4">💳</span>
          <p className="text-lg font-semibold text-gray-700 mb-1">אין תשלומים עדיין</p>
          <p className="text-sm text-gray-400 mb-5">השתמש בתכונות בתשלום כדי לראות את ההיסטוריה כאן</p>
          <button onClick={() => navigate("/pricing")}
            className="text-sm font-medium" style={{ color: "#1E5FA8" }}>
            עבור לתמחור ←
          </button>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {payments.map(p => {
              const cfg = PRICING_CONFIG[p.feature_key];
              const statusInfo = STATUS_LABELS[p.status] || { label: p.status, cls: "bg-gray-100 text-gray-600" };
              return (
                <div key={p.id} className="bg-white border border-gray-200 rounded-xl p-4 w-full">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{cfg?.icon || "💳"}</span>
                    <span className="font-bold text-gray-800 text-sm">{cfg?.label_he || p.feature_key}</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-1">תאריך: {p.created_date ? format(new Date(p.created_date), "dd/MM/yyyy HH:mm") : "—"}</p>
                  <p className="text-xs text-gray-800 font-bold mb-1">סכום: ₪{p.amount_ils}</p>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gray-500">סטטוס:</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusInfo.cls}`}>{statusInfo.label}</span>
                  </div>
                  {p.gateway_ref && <p className="text-xs text-gray-400 font-mono truncate">עסקה: {p.gateway_ref}</p>}
                </div>
              );
            })}
          </div>
          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs">תאריך</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs">תכונה</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs">סכום</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs">סטטוס</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs">מספר עסקה</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payments.map(p => {
                  const cfg = PRICING_CONFIG[p.feature_key];
                  const statusInfo = STATUS_LABELS[p.status] || { label: p.status, cls: "bg-gray-100 text-gray-600" };
                  return (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">
                        {p.created_date ? format(new Date(p.created_date), "dd/MM/yyyy HH:mm") : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1.5">
                          <span>{cfg?.icon || "💳"}</span>
                          <span className="text-gray-800 font-medium">{cfg?.label_he || p.feature_key}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold text-gray-900">₪{p.amount_ils}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusInfo.cls}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs font-mono">{p.gateway_ref || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}