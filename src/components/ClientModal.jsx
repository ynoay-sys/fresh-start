import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { base44 } from "@/api/base44Client";

const EMPTY = { full_name: "", phone: "", email: "", notes: "", contact_id: "" };

export default function ClientModal({ client, onClose, onSaved }) {
  const [form, setForm] = useState(client ? { ...client } : { ...EMPTY });
  const [contacts, setContacts] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadContacts() {
      const user = await base44.auth.me();
      const results = await base44.entities.Contact.filter({ created_by: user.email });
      setContacts(results);
    }
    loadContacts();
  }, []);

  function set(field, val) { setForm(f => ({ ...f, [field]: val })); }

  function handleContactSelect(contactId) {
    set("contact_id", contactId);
    if (!contactId) return;
    const contact = contacts.find(c => c.id === contactId);
    if (contact) {
      setForm(f => ({
        ...f,
        contact_id: contactId,
        full_name: contact.full_name || f.full_name,
        phone: contact.phone || f.phone,
        email: contact.email || f.email,
      }));
    }
  }

  async function handleSave() {
    if (!form.full_name?.trim()) return;
    setSaving(true);
    if (client?.id) {
      await base44.entities.Client.update(client.id, form);
    } else {
      await base44.entities.Client.create(form);
    }
    setSaving(false);
    onSaved();
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 text-lg">
            {client ? `עריכת לקוח — ${client.full_name}` : "הוספת לקוח"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">קישור לאיש קשר (אופציונלי)</label>
            <select value={form.contact_id || ""} onChange={e => handleContactSelect(e.target.value)}
              dir="rtl" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:border-blue-400">
              <option value="">קשר לאיש קשר קיים (אופציונלי)</option>
              {contacts.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">שם מלא *</label>
            <input type="text" value={form.full_name} onChange={e => set("full_name", e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400" dir="rtl" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">טלפון</label>
              <input type="text" value={form.phone} onChange={e => set("phone", e.target.value)}
                placeholder="05X-XXXXXXX"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400" dir="rtl" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">אימייל</label>
              <input type="email" value={form.email} onChange={e => set("email", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400" dir="ltr" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">הערות</label>
            <textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 resize-none" dir="rtl" />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button onClick={handleSave} disabled={saving || !form.full_name?.trim()}
            className="px-5 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: "#1E5FA8" }}>
            {saving ? "שומר..." : "שמור לקוח"}
          </button>
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50">ביטול</button>
        </div>
      </div>
    </div>
  );
}