import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import BusinessProgressMap from "../components/BusinessProgressMap";

function StatCard({ emoji, label, value }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col items-center">
      <span className="text-2xl mb-1">{emoji}</span>
      <p className="text-3xl font-bold mb-0.5" style={{ color: "#1E5FA8" }}>{value ?? "—"}</p>
      <p className="text-xs text-gray-500 text-center">{label}</p>
    </div>
  );
}

function QuickActionCard({ emoji, label, path }) {
  const navigate = useNavigate();
  return (
    <button onClick={() => navigate(path)}
      className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col items-center gap-2 hover:shadow-md hover:border-gray-200 transition-all">
      <span className="text-3xl">{emoji}</span>
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </button>
  );
}

export default function Progress() {
  const [steps, setSteps] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const user = await base44.auth.me();
      const [stepRes, docsRes, signedRes, clientsRes, contactsRes] = await Promise.all([
        base44.entities.BusinessOpeningStep.filter({ created_by: user.email }),
        base44.entities.Document.filter({ created_by: user.email, status: "active" }),
        base44.entities.Document.filter({ created_by: user.email, is_signed: true }),
        base44.entities.Client.filter({ created_by: user.email }),
        base44.entities.Contact.filter({ created_by: user.email }),
      ]);
      setSteps(stepRes);
      setStats({
        docs: docsRes.length,
        signed: signedRes.length,
        clients: clientsRes.length,
        contacts: contactsRes.length,
      });
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8" dir="rtl">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">ההתקדמות שלי</h1>

      {/* Section 1: Progress Map */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-base font-bold text-gray-800 mb-5">מפת המסע לפתיחת עסק</h2>
        <BusinessProgressMap steps={steps} />
      </div>

      {/* Section 2: Stats */}
      <div className="mb-6">
        <h2 className="text-base font-bold text-gray-800 mb-3">הפלטפורמה שלי</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard emoji="📁" label="מסמכים שהועלו" value={stats.docs} />
          <StatCard emoji="✍️" label="מסמכים חתומים" value={stats.signed} />
          <StatCard emoji="👥" label="לקוחות" value={stats.clients} />
          <StatCard emoji="👤" label="אנשי קשר" value={stats.contacts} />
        </div>
      </div>

      {/* Section 3: Quick Actions */}
      <div>
        <h2 className="text-base font-bold text-gray-800 mb-3">פעולות מהירות</h2>
        <div className="grid grid-cols-3 gap-3">
          <QuickActionCard emoji="📄" label="העלה מסמך" path="/documents/upload" />
          <QuickActionCard emoji="👥" label="הוסף לקוח" path="/clients" />
          <QuickActionCard emoji="✍️" label="צור חתימה" path="/documents/sign/create" />
        </div>
      </div>
    </div>
  );
}