import { useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function ManualEditModal({ page, onClose, onSaved }) {
  const [form, setForm] = useState({
    headline: page.headline || "",
    subheadline: page.subheadline || "",
    tagline: page.tagline || "",
    primary_color: page.primary_color || "#1E5FA8",
    secondary_color: page.secondary_color || "#EAF2FB",
    contact_email: page.contact_email || "",
    contact_phone: page.contact_phone || "",
    services_list: page.services_list ? [...page.services_list] : [],
  });
  const [saving, setSaving] = useState(false);

  function updateService(idx, field, value) {
    const updated = [...form.services_list];
    updated[idx] = { ...updated[idx], [field]: value };
    setForm(f => ({ ...f, services_list: updated }));
  }

  function addService() {
    setForm(f => ({ ...f, services_list: [...f.services_list, { title: "", description: "" }] }));
  }

  function removeService(idx) {
    setForm(f => ({ ...f, services_list: f.services_list.filter((_, i) => i !== idx) }));
  }

  async function handleSave() {
    setSaving(true);
    await base44.entities.LandingPage.update(page.id, form);
    setSaving(false);
    onSaved(form);
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="font-bold text-gray-900 text-lg">עריכה ידנית ⚙️</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {[
            { label: "כותרת ראשית", key: "headline" },
            { label: "כותרת משנה", key: "subheadline" },
            { label: "סלוגן", key: "tagline" },
            { label: "אימייל ליצירת קשר", key: "contact_email" },
            { label: "טלפון ליצירת קשר", key: "contact_phone" },
          ].map(({ label, key }) => (
            <div key={key}>
              <label className="text-xs font-medium text-gray-600 block mb-1">{label}</label>
              <input
                type="text"
                value={form[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
                dir="rtl"
              />
            </div>
          ))}

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "צבע ראשי", key: "primary_color" },
              { label: "צבע משני", key: "secondary_color" },
            ].map(({ label, key }) => (
              <div key={key}>
                <label className="text-xs font-medium text-gray-600 block mb-1">{label}</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
                  />
                  <span className="text-sm text-gray-500">{form[key]}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Services */}
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-2">שירותים</label>
            <div className="space-y-2">
              {form.services_list.map((s, i) => (
                <div key={i} className="flex gap-2 items-start p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      placeholder="שם השירות"
                      value={s.title}
                      onChange={e => updateService(i, "title", e.target.value)}
                      className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-sm outline-none focus:border-blue-400"
                      dir="rtl"
                    />
                    <input
                      type="text"
                      placeholder="תיאור קצר"
                      value={s.description}
                      onChange={e => updateService(i, "description", e.target.value)}
                      className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-sm outline-none focus:border-blue-400"
                      dir="rtl"
                    />
                  </div>
                  <button onClick={() => removeService(i)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-md mt-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button onClick={addService}
                className="flex items-center gap-2 w-full px-3 py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors justify-center">
                <Plus className="w-4 h-4" /> הוסף שירות
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2.5 rounded-lg text-white font-medium text-sm disabled:opacity-60"
            style={{ backgroundColor: "#1E5FA8" }}>
            {saving ? "שומר..." : "שמור שינויים"}
          </button>
          <button onClick={onClose}
            className="px-5 py-2.5 rounded-lg border border-gray-200 text-gray-700 font-medium text-sm hover:bg-gray-50">
            ביטול
          </button>
        </div>
      </div>
    </div>
  );
}