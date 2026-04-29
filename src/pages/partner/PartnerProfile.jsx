import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";

export default function PartnerProfile() {
  const navigate = useNavigate();
  const [partner, setPartner] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    document.title = "פרופיל מקצועי | Fresh Start";
    async function load() {
      const u = await base44.auth.me();
      const results = await base44.entities.ProfessionalPartner.filter({ email: u.email });
      if (results[0]) {
        setPartner(results[0]);
        setForm(results[0]);
      } else {
        const profileArr = await base44.entities.UserProfile.filter({ created_by: u.email });
        const p = profileArr[0] || {};
        setForm({
          name: u.full_name || "",
          email: u.email,
          profession: p.business_type || "",
          city: p.city || "",
          phone: p.phone_il || "",
          description: "",
          website: "",
          category: "other",
        });
      }
    }
    load();
  }, []);

  async function handleSave() {
    setSaving(true);
    const u = await base44.auth.me();
    if (partner) {
      await base44.entities.ProfessionalPartner.update(partner.id, form);
    } else {
      const created = await base44.entities.ProfessionalPartner.create({ ...form, email: u.email, is_active: true });
      setPartner(created);
    }
    setSaving(false);
    setToast("הפרופיל נשמר בהצלחה ✓");
    setTimeout(() => setToast(""), 3000);
  }

  const f = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <div className="max-w-2xl mx-auto px-4 py-8" dir="rtl">
      <button onClick={() => navigate('/dashboard')} style={{ display:'inline-flex', alignItems:'center', gap:'6px', background:'none', border:'none', color:'#1E5FA8', cursor:'pointer', fontSize:'14px', fontFamily:'Rubik, sans-serif', padding:'8px 0', marginBottom:'16px', fontWeight:'500' }}><span>→</span><span>חזרה למסך הראשי</span></button>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">הפרופיל המקצועי שלי</h1>
      <p className="text-sm text-gray-500 mb-6">כך הלקוחות רואים אותך בשוק המקצועי</p>

      {toast && (
        <div className="mb-4 px-4 py-3 rounded-xl text-white text-sm font-medium" style={{ backgroundColor: "#1A7A4A" }}>
          {toast}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        {[
          { key: "name", label: "שם מלא *" },
          { key: "profession", label: "מקצוע / תפקיד" },
          { key: "city", label: "עיר" },
          { key: "phone", label: "טלפון" },
          { key: "website", label: "אתר אינטרנט" },
        ].map(({ key, label }) => (
          <div key={key}>
            <label className="text-xs font-medium text-gray-600 block mb-1">{label}</label>
            <input
              type="text" value={form[key] || ""}
              onChange={e => f(key, e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-400"
              dir="rtl"
            />
          </div>
        ))}
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">תיאור קצר</label>
          <textarea value={form.description || ""} onChange={e => f("description", e.target.value)}
            rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-400 resize-none" dir="rtl" />
        </div>

        <button onClick={handleSave} disabled={saving || !form.name}
          className="w-full py-3 rounded-xl text-white font-bold text-sm disabled:opacity-50"
          style={{ backgroundColor: "#1A7A4A" }}>
          {saving ? "שומר..." : "שמור פרופיל ✓"}
        </button>
      </div>
    </div>
  );
}