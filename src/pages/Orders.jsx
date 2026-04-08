import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { format, addDays, differenceInDays } from "date-fns";
import { Plus, RefreshCw } from "lucide-react";
import TabBar from "../components/TabBar";
import OrderCard from "../components/OrderCard";
import AddOrderModal from "../components/AddOrderModal";
import EmailConnectModal from "../components/EmailConnectModal";
import AIParseModal from "../components/AIParseModal";
import { trackEvent } from "../lib/trackEvent";

const STATUS_TABS = [
  { key: "all", label: "הכל" },
  { key: "pending", label: "ממתין" },
  { key: "in_transit", label: "בדרך" },
  { key: "delivered", label: "נמסר" },
  { key: "delayed", label: "מאוחר" },
];

function isOverdue(order) {
  if (!order.expected_date || order.status === "delivered") return false;
  return new Date(order.expected_date) < new Date();
}

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [emailConnected, setEmailConnected] = useState(false);
  const [connectedEmail, setConnectedEmail] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const flag = localStorage.getItem("emailConnected");
    const saved = localStorage.getItem("connectedEmail");
    if (flag === "true" && saved) {
      setEmailConnected(true);
      setConnectedEmail(saved);
    }
    load();
  }, []);

  async function load() {
    setLoading(true);
    const u = await base44.auth.me();
    setUser(u);
    const res = await base44.entities.Order.filter({ created_by: u.email }, "-created_date");
    setOrders(res);
    setLoading(false);
  }

  function handleEmailConnected(email) {
    setEmailConnected(true);
    setConnectedEmail(email);
    setShowEmailModal(false);
  }

  function handleDisconnect() {
    localStorage.removeItem("emailConnected");
    localStorage.removeItem("connectedEmail");
    setEmailConnected(false);
    setConnectedEmail("");
  }

  async function handleSync() {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      setShowAIModal(true);
    }, 2000);
  }

  const today = new Date();
  const filtered = orders.filter(o => {
    if (activeTab !== "all" && o.status !== activeTab) return false;
    if (search) {
      const q = search.toLowerCase();
      if (![o.order_number, o.carrier, o.contents].some(f => f?.toLowerCase().includes(q))) return false;
    }
    return true;
  });

  const stats = {
    total: orders.length,
    inTransit: orders.filter(o => o.status === "in_transit").length,
    delivered: orders.filter(o => o.status === "delivered").length,
    delayed: orders.filter(o => o.status === "delayed" || isOverdue(o)).length,
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">הזמנות ומשלוחים</h1>
        <div className="flex gap-2">
          {emailConnected && (
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "מסרק..." : "סנכרן אימייל 🔄"}
            </button>
          )}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium"
            style={{ backgroundColor: "#1E5FA8" }}
          >
            <Plus className="w-4 h-4" /> הוספת הזמנה ידנית
          </button>
        </div>
      </div>

      {/* Email Connection Section */}
      {!emailConnected ? (
        <div className="rounded-xl p-5 mb-6" style={{ backgroundColor: "#EFF6FF" }}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <span className="text-3xl">📧</span>
            <div className="flex-1">
              <p className="font-bold text-blue-900 text-base">חבר את תיבת הדוא״ל שלך</p>
              <p className="text-sm text-blue-700 mt-0.5">Fresh Start יזהה אוטומטית הזמנות ומשלוחים מהאימייל שלך</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setShowEmailModal(true)}
                className="px-4 py-2 rounded-lg bg-white border text-sm font-medium hover:bg-gray-50 flex items-center gap-1.5"
                style={{ borderColor: "#EA4335", color: "#EA4335" }}
              >
                📧 חבר Gmail
              </button>
              <button
                onClick={() => setShowEmailModal(true)}
                className="px-4 py-2 rounded-lg bg-white border text-sm font-medium hover:bg-gray-50 flex items-center gap-1.5"
                style={{ borderColor: "#0078D4", color: "#0078D4" }}
              >
                📧 חבר Outlook
              </button>
            </div>
          </div>
          <p className="text-xs text-blue-600 mt-3">Fresh Start לא שומר את תוכן האימיילים שלך</p>
        </div>
      ) : (
        <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-5 py-3 mb-6">
          <span className="text-sm font-medium text-green-800">📧 מחובר: {connectedEmail}</span>
          <div className="flex items-center gap-3">
            <button onClick={handleSync} disabled={syncing}
              className="text-sm font-medium px-3 py-1.5 rounded-lg text-white disabled:opacity-60"
              style={{ backgroundColor: "#1E5FA8" }}>
              {syncing ? "מסרק..." : "סנכרן עכשיו 🔄"}
            </button>
            <button onClick={handleDisconnect} className="text-xs text-gray-400 hover:text-red-500 underline">נתק</button>
          </div>
        </div>
      )}

      {/* Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { emoji: "📦", label: 'סה"כ הזמנות', value: stats.total },
          { emoji: "🚚", label: "בדרך", value: stats.inTransit, color: "#1E5FA8" },
          { emoji: "✅", label: "נמסרו", value: stats.delivered, color: "#1A7A4A" },
          { emoji: "⚠️", label: "מאוחרות", value: stats.delayed, color: "#AA1111" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <span className="text-2xl">{s.emoji}</span>
            <p className="text-2xl font-bold mt-1" style={{ color: s.color || "#374151" }}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Status Tabs */}
      <div className="mb-4">
        <TabBar tabs={STATUS_TABS} activeKey={activeTab} onChange={setActiveTab} />
      </div>

      {/* Search */}
      <div className="mb-5">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="חפש לפי מספר הזמנה, ספק או תוכן..."
          className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-400"
          dir="rtl"
        />
      </div>

      {/* Empty State */}
      {!loading && orders.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <span className="text-6xl mb-4">📦</span>
          <p className="text-lg font-semibold text-gray-700 mb-1">אין הזמנות עדיין</p>
          <p className="text-sm text-gray-400 mb-6">הוסף הזמנה ידנית או חבר את האימייל שלך לזיהוי אוטומטי</p>
          <div className="flex gap-3">
            <button onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded-lg text-white text-sm font-medium" style={{ backgroundColor: "#1E5FA8" }}>
              + הוסף ידנית
            </button>
            <button onClick={() => setShowEmailModal(true)}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">
              חבר אימייל 📧
            </button>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
        </div>
      )}

      {/* Orders Grid */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map(order => (
            <OrderCard key={order.id} order={order} onUpdated={load} user={user} />
          ))}
        </div>
      )}

      {!loading && orders.length > 0 && filtered.length === 0 && (
        <p className="text-center text-gray-400 py-12 text-sm">לא נמצאו הזמנות התואמות לחיפוש</p>
      )}

      {/* Modals */}
      {showAddModal && (
        <AddOrderModal user={user} onClose={() => setShowAddModal(false)} onSaved={() => { setShowAddModal(false); load(); }} />
      )}
      {showEmailModal && (
        <EmailConnectModal onClose={() => setShowEmailModal(false)} onConnected={handleEmailConnected} />
      )}
      {showAIModal && (
        <AIParseModal user={user} onClose={() => setShowAIModal(false)} onImported={() => { setShowAIModal(false); load(); }} />
      )}
    </div>
  );
}