import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import BusinessProgressMap from "../components/BusinessProgressMap";

function StatCard({ emoji, label, value, sub, onClick }) {
  return (
    <div onClick={onClick}
      className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col items-center cursor-pointer hover:shadow-md hover:border-gray-200 transition-all">
      <span className="text-3xl mb-2">{emoji}</span>
      <p className="text-4xl font-bold mb-1" style={{ color: "#1E5FA8" }}>{value ?? "—"}</p>
      {sub && <p className="text-xs text-gray-400 mb-0.5">{sub}</p>}
      <p className="text-sm text-gray-500 font-medium">{label}</p>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [docCount, setDocCount] = useState(null);
  const [contactCount, setContactCount] = useState(null);
  const [clientCount, setClientCount] = useState(null);
  const [stepsCompleted, setStepsCompleted] = useState(null);
  const [steps, setSteps] = useState([]);

  useEffect(() => {
    async function load() {
      const user = await base44.auth.me();
      const [docs, contacts, clients, completedSteps, allSteps] = await Promise.all([
        base44.entities.Document.filter({ created_by: user.email, status: "active" }),
        base44.entities.Contact.filter({ created_by: user.email }),
        base44.entities.Client.filter({ created_by: user.email }),
        base44.entities.BusinessOpeningStep.filter({ created_by: user.email, status: "completed" }),
        base44.entities.BusinessOpeningStep.filter({ created_by: user.email }),
      ]);
      setDocCount(docs.length);
      setContactCount(contacts.length);
      setClientCount(clients.length);
      setStepsCompleted(completedSteps.length);
      setSteps(allSteps);
    }
    load();
  }, []);

  return (
    <div className="px-4 py-8 max-w-4xl mx-auto" dir="rtl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">שלום 👋</h1>
      <p className="text-sm text-gray-500 mb-8">ברוך הבא ל-Fresh Start — הפלטפורמה לעצמאים בישראל</p>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <StatCard emoji="📁" label="מסמכים" value={docCount} onClick={() => navigate("/documents")} />
        <StatCard emoji="🤝" label="לקוחות" value={clientCount} onClick={() => navigate("/clients")} />
        <StatCard emoji="👥" label="אנשי קשר" value={contactCount} onClick={() => navigate("/contacts")} />
        <StatCard emoji="✅" label="שלבי פתיחה" value={stepsCompleted != null ? `${stepsCompleted}/4` : "—"} onClick={() => navigate("/business-opening")} />
        <StatCard emoji="📈" label="התקדמות" value="←" onClick={() => navigate("/progress")} />
      </div>

      {/* Business Opening Widget */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-gray-800">מסע פתיחת העסק</h2>
        </div>
        <BusinessProgressMap steps={steps} mini={true} />
      </div>

      {/* Quick Actions */}
      <h2 className="text-base font-semibold text-gray-800 mb-3">פעולות מהירות</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { emoji: "📄", label: "העלאת מסמך", path: "/documents/upload" },
          { emoji: "✍️", label: "צור חתימה", path: "/documents/sign/create" },
          { emoji: "👤", label: "הוסף איש קשר", path: "/contacts" },
          { emoji: "📁", label: "הארכיון שלי", path: "/documents" },
        ].map(({ emoji, label, path }) => (
          <button key={path} onClick={() => navigate(path)}
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col items-center gap-2 hover:shadow-md hover:border-gray-200 transition-all text-center">
            <span className="text-2xl">{emoji}</span>
            <span className="text-xs font-medium text-gray-700">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}