import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { base44 } from "@/api/base44Client";

const CATEGORIES = [
  { value: "family", label: "משפחה" },
  { value: "advisor", label: "יועץ" },
  { value: "lawyer", label: "עורך דין" },
  { value: "investor", label: "משקיע" },
  { value: "client", label: "לקוח" },
  { value: "banker", label: "בנקאי" },
  { value: "colleague", label: "עמית" },
  { value: "supplier", label: "ספק" },
];

const EMPTY = {
  category: "", full_name: "", profession: "", responsibility: "",
  phone: "", email: "", website: "", availability: "", notes: "",
};

export default function ContactModal({ contact, onClose, onSaved }) {
  const [form, setForm] = useState(contact ? { ...contact } : { ...EMPTY });
  const [saving, setSaving] = useState(false);

  function set(field, val) { setForm(f => ({ ...f, [field]: val })); }

  async function handleSave() {
    if (!form.full_name?.trim() || !form.category) return;
    setSaving(true);
    if (contact?.id) {
      await base44.entities.Contact.update(contact.id, form);
    } else {
      await base44.entities.Contact.create(form);
    }
    setSaving(false);
    onSaved();
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 text-lg">
            {contact ? `עריכת איש קשר — ${contact.full_name}` : "הוספת איש קשר"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="px-6 py-5 space-y-4">
          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">קטגוריה *</label>
            <select
              value={form.category}
              onChange={e => set("category", e.target.value)}
              dir="rtl"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:border-blue-400"
            >
              <option value="">בחר קטגוריה...</option>
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">שם מלא *</label>
            <input type="text" value={form.full_name} onChange={e => set("full_name", e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400" dir="rtl" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">מקצוע / תפקיד</label>
              <input type="text" value={form.profession} onChange={e => set("profession", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400" dir="rtl" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">טלפון</label>
              <input type="text" value={form.phone} onChange={e => set("phone", e.target.value)}
                placeholder="05X-XXXXXXX"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400" dir="rtl" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">אחריות / מטרה</label>
            <textarea value={form.responsibility} onChange={e => set("responsibility", e.target.value)} rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 resize-none" dir="rtl" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">אימייל</label>
              <input type="email" value={form.email} onChange={e => set("email", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400" dir="ltr" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">אתר אינטרנט</label>
              <input type="url" value={form.website} onChange={e => set("website", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400" dir="ltr" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">שעות זמינות</label>
            <input type="text" value={form.availability} onChange={e => set("availability", e.target.value)}
              placeholder='ימים א-ה, 9:00-17:00'
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400" dir="rtl" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">הערות</label>
            <textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 resize-none" dir="rtl" />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-start">
          <button
            onClick={handleSave}
            disabled={saving || !form.full_name?.trim() || !form.category}
            className="px-5 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: "#1E5FA8" }}
          >
            {saving ? "שומר..." : "שמור איש קשר"}
          </button>
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50">
            ביטול
          </button>
        </div>
      </div>
    </div>
  );
}