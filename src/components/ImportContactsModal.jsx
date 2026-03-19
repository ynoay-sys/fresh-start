import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function ImportContactsModal({ onClose, onImported }) {
  const [clientContacts, setClientContacts] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    async function load() {
      const user = await base44.auth.me();
      const contacts = await base44.entities.Contact.filter({ created_by: user.email, category: "client" });
      setClientContacts(contacts);
      setLoading(false);
    }
    load();
  }, []);

  function toggleAll(checked) {
    setSelected(checked ? clientContacts.map(c => c.id) : []);
  }

  function toggle(id) {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  async function handleImport() {
    setImporting(true);
    const user = await base44.auth.me();
    const existingClients = await base44.entities.Client.filter({ created_by: user.email });
    const existingNames = new Set(existingClients.map(c => c.full_name.toLowerCase()));

    const toImport = clientContacts.filter(c => selected.includes(c.id));
    let imported = 0, skipped = 0;

    for (const contact of toImport) {
      if (existingNames.has(contact.full_name.toLowerCase())) {
        skipped++;
      } else {
        await base44.entities.Client.create({
          full_name: contact.full_name,
          phone: contact.phone || "",
          email: contact.email || "",
          contact_id: contact.id,
        });
        imported++;
      }
    }

    setResult({ imported, skipped });
    setImporting(false);
    if (imported > 0 && onImported) onImported();
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 text-lg">ייבוא לקוחות מאנשי קשר</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="px-6 py-5">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-6 h-6 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
            </div>
          ) : result ? (
            <div className="text-center py-6">
              <p className="text-2xl mb-2">✅</p>
              <p className="font-semibold text-gray-800">יובאו {result.imported} לקוחות חדשים. דולגו {result.skipped} שכבר קיימים.</p>
              <button onClick={onClose} className="mt-4 px-4 py-2 rounded-lg text-white text-sm font-medium" style={{ backgroundColor: "#1E5FA8" }}>סגור</button>
            </div>
          ) : clientContacts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-3xl mb-2">👥</p>
              <p className="text-sm">אין אנשי קשר עם קטגוריה "לקוח".</p>
              <p className="text-xs text-gray-400 mt-1">שנה את קטגוריית איש הקשר ל"לקוח" בדף אנשי הקשר.</p>
            </div>
          ) : (
            <>
              <label className="flex items-center gap-2 mb-3 cursor-pointer">
                <input type="checkbox" checked={selected.length === clientContacts.length}
                  onChange={e => toggleAll(e.target.checked)} />
                <span className="text-sm font-medium text-gray-700">בחר הכל ({clientContacts.length})</span>
              </label>
              <div className="space-y-2 mb-5 max-h-60 overflow-y-auto">
                {clientContacts.map(c => (
                  <label key={c.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input type="checkbox" checked={selected.includes(c.id)} onChange={() => toggle(c.id)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">{c.full_name}</p>
                      <p className="text-xs text-gray-400 truncate">{c.phone || ""} {c.email ? `· ${c.email}` : ""}</p>
                    </div>
                  </label>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={handleImport} disabled={importing || selected.length === 0}
                  className="flex-1 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50"
                  style={{ backgroundColor: "#1E5FA8" }}>
                  {importing ? "מייבא..." : `ייבא לקוחות נבחרים (${selected.length})`}
                </button>
                <button onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50">ביטול</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}