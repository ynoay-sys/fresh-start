import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Search, Plus, Trash2, ShieldCheck, Star, PauseCircle } from "lucide-react";
import { format } from "date-fns";

function AddPartnerModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ name: "", email: "", profession: "", city: "" });
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    if (!form.name || !form.email) return;
    setSaving(true);
    await base44.entities.ProfessionalPartner.create({
      ...form, is_active: true, is_verified: false, is_premium: false, plan: "free",
      profile_views: 0, contact_requests_count: 0,
    });
    setSaving(false);
    onSaved();
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full">
        <h3 className="font-bold text-gray-900 text-lg mb-4">הוסף שותף מקצועי</h3>
        <div className="space-y-3">
          {[
            { key: "name", label: "שם מלא *" },
            { key: "email", label: "אימייל *" },
            { key: "profession", label: "מקצוע" },
            { key: "city", label: "עיר" },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="text-xs text-gray-500 block mb-1">{label}</label>
              <input type="text" value={form[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400" dir="rtl" />
            </div>
          ))}
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={handleSubmit} disabled={saving || !form.name || !form.email}
            className="flex-1 py-2.5 rounded-lg text-white text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: "#1E5FA8" }}>
            {saving ? "שומר..." : "הוסף שותף"}
          </button>
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-700">ביטול</button>
        </div>
      </div>
    </div>
  );
}

export default function PartnersTab() {
  const [partners, setPartners] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  async function load() {
    setLoading(true);
    const [pArr, prArr] = await Promise.all([
      base44.entities.ProfessionalPartner.list(),
      base44.entities.UserProfile.filter({ role: "partner" }),
    ]);
    setPartners(pArr);
    setProfiles(prArr);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleVerify(partner) {
    await base44.entities.ProfessionalPartner.update(partner.id, { is_verified: true, is_active: true });
    // Also update UserProfile if matched by email
    const prof = profiles.find(p => p.created_by === partner.email);
    if (prof) await base44.entities.UserProfile.update(prof.id, { role: "partner" });
    load();
  }

  async function handlePremium(partner) {
    await base44.entities.ProfessionalPartner.update(partner.id, { is_premium: true, plan: "premium" });
    const prof = profiles.find(p => p.created_by === partner.email);
    if (prof) await base44.entities.UserProfile.update(prof.id, { partner_plan: "premium" });
    load();
  }

  async function handleSuspend(partner) {
    await base44.entities.ProfessionalPartner.update(partner.id, { is_active: false });
    const prof = profiles.find(p => p.created_by === partner.email);
    if (prof) await base44.entities.UserProfile.update(prof.id, { is_active: false });
    load();
  }

  async function handleDelete(partner) {
    if (!confirm(`למחוק את ${partner.name}?`)) return;
    await base44.entities.ProfessionalPartner.delete(partner.id);
    const prof = profiles.find(p => p.created_by === partner.email);
    if (prof) await base44.entities.UserProfile.delete(prof.id);
    load();
  }

  const filtered = partners.filter(p => {
    const q = search.toLowerCase();
    return !q || p.name?.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q) || p.profession?.toLowerCase().includes(q);
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="חפש שותף..."
            className="w-full pr-10 pl-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none" dir="rtl" />
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-white text-sm font-medium"
          style={{ backgroundColor: "#1A7A4A" }}>
          <Plus className="w-4 h-4" /> הוסף שותף
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-green-100 border-t-green-600 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm" dir="rtl">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["שם מלא / מקצוע", "עיר", "תוכנית", "מאומת", "פעיל", "תאריך הצטרפות", "פעולות"].map(h => (
                  <th key={h} className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ backgroundColor: "#1A7A4A" }}>
                        {(p.name || "?").split(" ").map(w => w[0]).slice(0, 2).join("")}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{p.name}</p>
                        <p className="text-xs text-gray-400">{p.profession}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{p.city || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      p.plan === "premium" ? "bg-yellow-100 text-yellow-800" :
                      p.plan === "pro" ? "bg-blue-100 text-blue-700" :
                      "bg-gray-100 text-gray-600"
                    }`}>
                      {{ free: "חינמי", pro: "פרו", premium: "פרמיום" }[p.plan] || "חינמי"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.is_verified ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {p.is_verified ? "מאומת ✓" : "לא מאומת"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.is_active !== false ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                      {p.is_active !== false ? "פעיל" : "מושהה"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {p.created_date ? format(new Date(p.created_date), "dd/MM/yyyy") : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {!p.is_verified && (
                        <button onClick={() => handleVerify(p)} title="אמת שותף"
                          className="p-1.5 rounded-lg hover:bg-green-50 text-green-600">
                          <ShieldCheck className="w-4 h-4" />
                        </button>
                      )}
                      {!p.is_premium && (
                        <button onClick={() => handlePremium(p)} title="שנה לפרמיום"
                          className="p-1.5 rounded-lg hover:bg-yellow-50 text-yellow-600">
                          <Star className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => handleSuspend(p)} title="השהה"
                        className="p-1.5 rounded-lg hover:bg-orange-50 text-orange-500">
                        <PauseCircle className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(p)} title="מחק"
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400">לא נמצאו שותפים</div>
          )}
        </div>
      )}

      {showAdd && <AddPartnerModal onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); load(); }} />}
    </div>
  );
}