import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { Plus, Edit2, Eye, EyeOff, Trash2, Save, X } from "lucide-react";
import { sendTestEmail } from "../../services/EmailService";
import AddPartnerModal from "../../components/admin/AddPartnerModal.jsx";

const AUTHORITY_LABELS = { tax_authority: "מס הכנסה", vat: 'מע"מ', nii: "ביטוח לאומי", municipality: "עירייה", other: "אחר" };
const URGENCY_LABELS = { high: "דחוף", medium: "בינוני", low: "נמוך" };
const URGENCY_COLORS = { high: "bg-red-100 text-red-700", medium: "bg-orange-100 text-orange-700", low: "bg-gray-100 text-gray-500" };
const FEATURE_LABELS = { template_download: "הורדת טופס", ai_query: "עוזר AI", email_sig: "חתימת אימייל", domain: "דומיין", automation: "אוטומציה", extra_storage: "אחסון נוסף" };

function InlineEditTemplate({ template, onSave, onCancel }) {
  const [form, setForm] = useState({ ...template });
  return (
    <tr className="bg-blue-50">
      <td className="px-4 py-3" colSpan={5}>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
          <input className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" placeholder="שם הטופס"
            value={form.title_he || ""} onChange={e => setForm(f => ({ ...f, title_he: e.target.value }))} />
          <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white outline-none"
            value={form.authority || "other"} onChange={e => setForm(f => ({ ...f, authority: e.target.value }))}>
            {Object.entries(AUTHORITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white outline-none"
            value={form.urgency || "medium"} onChange={e => setForm(f => ({ ...f, urgency: e.target.value }))}>
            {Object.entries(URGENCY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <input className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none col-span-2" placeholder="תיאור"
            value={form.description || ""} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          <input className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" placeholder="הערת דדליין"
            value={form.deadline_note || ""} onChange={e => setForm(f => ({ ...f, deadline_note: e.target.value }))} />
          <input className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none col-span-2" placeholder="קישור חיצוני" dir="ltr"
            value={form.external_url || ""} onChange={e => setForm(f => ({ ...f, external_url: e.target.value }))} />
        </div>
        <div className="flex gap-2">
          <button onClick={() => onSave(form)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-sm font-medium" style={{ backgroundColor: "#1E5FA8" }}>
            <Save className="w-3.5 h-3.5" /> שמור
          </button>
          <button onClick={onCancel} className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">ביטול</button>
        </div>
      </td>
    </tr>
  );
}

function TemplatesTab() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [addingNew, setAddingNew] = useState(false);

  useEffect(() => {
    base44.entities.DocumentTemplate.list().then(data => { setTemplates(data); setLoading(false); });
  }, []);

  async function handleSave(form) {
    if (form.id) {
      await base44.entities.DocumentTemplate.update(form.id, form);
      setTemplates(prev => prev.map(t => t.id === form.id ? { ...t, ...form } : t));
    } else {
      const created = await base44.entities.DocumentTemplate.create({ ...form, is_active: true });
      setTemplates(prev => [created, ...prev]);
    }
    setEditingId(null);
    setAddingNew(false);
  }

  async function toggleActive(template) {
    await base44.entities.DocumentTemplate.update(template.id, { is_active: !template.is_active });
    setTemplates(prev => prev.map(t => t.id === template.id ? { ...t, is_active: !t.is_active } : t));
  }

  if (loading) return <div className="flex items-center justify-center py-16"><div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={() => setAddingNew(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium" style={{ backgroundColor: "#1E5FA8" }}>
          <Plus className="w-4 h-4" /> הוסף טופס
        </button>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" dir="rtl">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["שם הטופס", "רשות", "דחיפות", "סטטוס", "פעולות"].map(h => (
                  <th key={h} className="px-4 py-3 text-right text-xs font-semibold text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {addingNew && (
                <InlineEditTemplate
                  template={{ title_he: "", authority: "tax_authority", urgency: "medium", description: "", deadline_note: "", external_url: "", key: "" }}
                  onSave={handleSave}
                  onCancel={() => setAddingNew(false)}
                />
              )}
              {templates.map(t => editingId === t.id ? (
                <InlineEditTemplate key={t.id} template={t} onSave={handleSave} onCancel={() => setEditingId(null)} />
              ) : (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{t.title_he}</td>
                  <td className="px-4 py-3 text-gray-600">{AUTHORITY_LABELS[t.authority] || t.authority}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${URGENCY_COLORS[t.urgency] || ""}`}>{URGENCY_LABELS[t.urgency] || t.urgency}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${t.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {t.is_active ? "פעיל" : "מוסתר"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setEditingId(t.id)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500" title="ערוך">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => toggleActive(t)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500" title={t.is_active ? "הסתר" : "הצג"}>
                        {t.is_active ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {templates.length === 0 && <div className="text-center py-10 text-gray-400">אין טפסים עדיין</div>}
        </div>
      </div>
    </div>
  );
}

function HolidaysTab() {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [newForm, setNewForm] = useState({ name_he: "", date: "", year: 2026, is_active: true });
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    base44.entities.IsraeliHoliday.list("-date").then(data => { setHolidays(data); setLoading(false); });
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    const created = await base44.entities.IsraeliHoliday.create(newForm);
    setHolidays(prev => [...prev, created].sort((a, b) => a.date > b.date ? 1 : -1));
    setNewForm({ name_he: "", date: "", year: 2026, is_active: true });
    setAdding(false);
  }

  async function handleUpdate(id) {
    await base44.entities.IsraeliHoliday.update(id, editForm);
    setHolidays(prev => prev.map(h => h.id === id ? { ...h, ...editForm } : h));
    setEditingId(null);
  }

  async function handleDelete(id) {
    if (!window.confirm("למחוק חג זה?")) return;
    await base44.entities.IsraeliHoliday.delete(id);
    setHolidays(prev => prev.filter(h => h.id !== id));
  }

  async function toggleActive(h) {
    await base44.entities.IsraeliHoliday.update(h.id, { is_active: !h.is_active });
    setHolidays(prev => prev.map(x => x.id === h.id ? { ...x, is_active: !x.is_active } : x));
  }

  if (loading) return <div className="flex items-center justify-center py-16"><div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={() => setAdding(v => !v)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium" style={{ backgroundColor: "#1E5FA8" }}>
          <Plus className="w-4 h-4" /> הוסף חג
        </button>
      </div>
      {adding && (
        <form onSubmit={handleCreate} className="bg-blue-50 rounded-xl p-4 mb-4 flex flex-wrap gap-3">
          <input required className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" placeholder="שם החג בעברית"
            value={newForm.name_he} onChange={e => setNewForm(f => ({ ...f, name_he: e.target.value }))} />
          <input required type="date" className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" dir="ltr"
            value={newForm.date} onChange={e => setNewForm(f => ({ ...f, date: e.target.value, year: new Date(e.target.value).getFullYear() }))} />
          <button type="submit" className="px-4 py-2 rounded-lg text-white text-sm font-medium" style={{ backgroundColor: "#1E5FA8" }}>הוסף</button>
          <button type="button" onClick={() => setAdding(false)} className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600">ביטול</button>
        </form>
      )}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm" dir="rtl">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {["שם החג", "תאריך", "שנה", "סטטוס", "פעולות"].map(h => (
                <th key={h} className="px-4 py-3 text-right text-xs font-semibold text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {holidays.map(h => editingId === h.id ? (
              <tr key={h.id} className="bg-blue-50">
                <td className="px-4 py-3">
                  <input className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none w-full" value={editForm.name_he || ""}
                    onChange={e => setEditForm(f => ({ ...f, name_he: e.target.value }))} />
                </td>
                <td className="px-4 py-3">
                  <input type="date" className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" dir="ltr" value={editForm.date || ""}
                    onChange={e => setEditForm(f => ({ ...f, date: e.target.value, year: new Date(e.target.value).getFullYear() }))} />
                </td>
                <td className="px-4 py-3 text-gray-500">{editForm.year}</td>
                <td />
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => handleUpdate(h.id)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-white text-xs" style={{ backgroundColor: "#1E5FA8" }}><Save className="w-3 h-3" />שמור</button>
                    <button onClick={() => setEditingId(null)} className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600">ביטול</button>
                  </div>
                </td>
              </tr>
            ) : (
              <tr key={h.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{h.name_he}</td>
                <td className="px-4 py-3 text-gray-600" dir="ltr">{h.date}</td>
                <td className="px-4 py-3 text-gray-500">{h.year}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${h.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {h.is_active ? "פעיל" : "מושבת"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setEditingId(h.id); setEditForm({ name_he: h.name_he, date: h.date, year: h.year }); }}
                      className="p-1.5 rounded hover:bg-gray-100 text-gray-500"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => toggleActive(h)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500">
                      {h.is_active ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => handleDelete(h.id)} className="p-1.5 rounded hover:bg-red-50 text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {holidays.length === 0 && <div className="text-center py-10 text-gray-400">אין חגים. לחץ "הוסף חג" להתחיל.</div>}
      </div>
    </div>
  );
}

function PricingTab() {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    base44.entities.PricingConfig.list().then(data => { setConfigs(data); setLoading(false); });
  }, []);

  async function handleSave(id) {
    await base44.entities.PricingConfig.update(id, { price_ils: Number(editForm.price_ils), free_quota: Number(editForm.free_quota), label_he: editForm.label_he });
    setConfigs(prev => prev.map(c => c.id === id ? { ...c, ...editForm, price_ils: Number(editForm.price_ils), free_quota: Number(editForm.free_quota) } : c));
    setEditingId(null);
  }

  if (loading) return <div className="flex items-center justify-center py-16"><div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" /></div>;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table className="w-full text-sm" dir="rtl">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            {["תכונה", "תווית", "מחיר (₪)", "מכסה חינמית", "פעולות"].map(h => (
              <th key={h} className="px-4 py-3 text-right text-xs font-semibold text-gray-500">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {configs.map(c => editingId === c.id ? (
            <tr key={c.id} className="bg-blue-50">
              <td className="px-4 py-3 font-medium text-gray-700">{c.icon} {FEATURE_LABELS[c.feature_key] || c.feature_key}</td>
              <td className="px-4 py-3">
                <input className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none w-full" value={editForm.label_he || ""}
                  onChange={e => setEditForm(f => ({ ...f, label_he: e.target.value }))} />
              </td>
              <td className="px-4 py-3">
                <input type="number" min="0" className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none w-24" dir="ltr"
                  value={editForm.price_ils ?? ""} onChange={e => setEditForm(f => ({ ...f, price_ils: e.target.value }))} />
              </td>
              <td className="px-4 py-3">
                <input type="number" min="0" className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none w-24" dir="ltr"
                  value={editForm.free_quota ?? ""} onChange={e => setEditForm(f => ({ ...f, free_quota: e.target.value }))} />
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <button onClick={() => handleSave(c.id)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-white text-xs" style={{ backgroundColor: "#1E5FA8" }}><Save className="w-3 h-3" />שמור</button>
                  <button onClick={() => setEditingId(null)} className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600">ביטול</button>
                </div>
              </td>
            </tr>
          ) : (
            <tr key={c.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-gray-900">{c.icon} {FEATURE_LABELS[c.feature_key] || c.feature_key}</td>
              <td className="px-4 py-3 text-gray-600">{c.label_he}</td>
              <td className="px-4 py-3 font-semibold text-gray-900">₪{c.price_ils}</td>
              <td className="px-4 py-3 text-gray-600">{c.free_quota > 0 ? c.free_quota : "אין"}</td>
              <td className="px-4 py-3">
                <button onClick={() => { setEditingId(c.id); setEditForm({ label_he: c.label_he, price_ils: c.price_ils, free_quota: c.free_quota }); }}
                  className="p-1.5 rounded hover:bg-gray-100 text-gray-500"><Edit2 className="w-3.5 h-3.5" /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {configs.length === 0 && <div className="text-center py-10 text-gray-400">אין קונפיגורציית תמחור עדיין</div>}
    </div>
  );
}

function PaymentSettingsTab() {
  const [terminalName, setTerminalName] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    base44.entities.SystemConfig.list().then(configs => {
      const byKey = {};
      for (const c of configs) byKey[c.key] = { id: c.id, value: c.value };
      setTerminalName(byKey["tranzila_terminal_name"]?.value || "");
      setBaseUrl(byKey["app_base_url"]?.value || "");
      setLoading(false);
    });
  }, []);

  async function handleSave() {
    setSaving(true);
    const configs = await base44.entities.SystemConfig.list();
    const byKey = {};
    for (const c of configs) byKey[c.key] = c.id;

    async function upsert(key, value) {
      if (byKey[key]) {
        await base44.entities.SystemConfig.update(byKey[key], { value });
      } else {
        await base44.entities.SystemConfig.create({ key, value });
      }
    }

    await upsert("tranzila_terminal_name", terminalName.trim());
    await new Promise(r => setTimeout(r, 300));
    await upsert("app_base_url", baseUrl.trim());

    setSaving(false);
    setToast("הגדרות נשמרו בהצלחה ✓");
    setTimeout(() => setToast(""), 3000);
  }

  if (loading) return <div className="flex items-center justify-center py-16"><div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-md">
      <p className="text-sm text-gray-500 mb-5">ערכים אלה משמשים לניתוב תשלומי Tranzila. הם מחליפים את ברירות המחדל בקוד.</p>
      {toast && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm font-medium bg-green-50 text-green-700">{toast}</div>
      )}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-5">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">שם טרמינל Tranzila</label>
          <input
            type="text"
            value={terminalName}
            onChange={e => setTerminalName(e.target.value)}
            placeholder="fresh_start_terminal"
            dir="ltr"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
          />
          <p className="text-xs text-gray-400 mt-1">שם הטרמינל שקיבלת מ-Tranzila בהגדרות החשבון שלך</p>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">כתובת האפליקציה (base URL)</label>
          <input
            type="url"
            value={baseUrl}
            onChange={e => setBaseUrl(e.target.value)}
            placeholder="https://app.fresh-start.co.il"
            dir="ltr"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
          />
          <p className="text-xs text-gray-400 mt-1">כתובת ה-URL המפורסמת של האפליקציה (ללא / בסוף)</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || (!terminalName.trim() && !baseUrl.trim())}
          className="w-full py-2.5 rounded-lg text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          style={{ backgroundColor: "#1E5FA8" }}
        >
          {saving ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />שומר...</> : "שמור הגדרות"}
        </button>
      </div>
    </div>
  );
}

function EmailTestTab() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState("");

  async function handleSend() {
    if (!email.trim()) return;
    setSending(true);
    try {
      await sendTestEmail({ toEmail: email.trim() });
      setToast("✅ מייל בדיקה נשלח בהצלחה!");
    } catch (e) {
      setToast("❌ שליחה נכשלה: " + e.message);
    }
    setSending(false);
    setTimeout(() => setToast(""), 4000);
  }

  return (
    <div className="max-w-md">
      <p className="text-sm text-gray-500 mb-5">שלח מייל בדיקה כדי לוודא שמערכת המיילים פועלת תקין.</p>
      {toast && (
        <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${toast.startsWith("✅") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {toast}
        </div>
      )}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">כתובת אימייל</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="test@example.com"
            dir="ltr"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
          />
        </div>
        <button
          onClick={handleSend}
          disabled={sending || !email.trim()}
          className="w-full py-2.5 rounded-lg text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          style={{ backgroundColor: "#1E5FA8" }}
        >
          {sending ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> שולח...</> : "שלח מייל בדיקה"}
        </button>
      </div>
    </div>
  );
}

function PartnersContentTab() {
  const [showAdd, setShowAdd] = useState(false);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.ProfessionalPartner.list().then(data => { setPartners(data); setLoading(false); });
  }, []);

  if (loading) return <div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" /></div>;

  return (
    <div dir="rtl">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">{partners.length} שותפים רשומים</p>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium"
          style={{ backgroundColor: "#1A7A4A" }}>
          + הוסף שותף
        </button>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm" dir="rtl">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {["שם", "מקצוע", "עיר", "אימייל", "מאומת", "תוכנית"].map(h => (
                <th key={h} className="px-4 py-3 text-right text-xs font-semibold text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {partners.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                <td className="px-4 py-3 text-gray-600">{p.profession}</td>
                <td className="px-4 py-3 text-gray-600">{p.city || "—"}</td>
                <td className="px-4 py-3 text-gray-500 text-xs" dir="ltr">{p.email || "—"}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${p.is_verified ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {p.is_verified ? "מאומת ✓" : "לא מאומת"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                    {{ free: "חינמי", pro: "פרו", premium: "פרמיום" }[p.plan] || "חינמי"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {partners.length === 0 && <div className="text-center py-10 text-gray-400">אין שותפים עדיין</div>}
      </div>
      {showAdd && <AddPartnerModal onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); base44.entities.ProfessionalPartner.list().then(setPartners); }} />}
    </div>
  );
}

const TABS = [
  { key: "templates", label: "טפסים ממשלתיים" },
  { key: "holidays", label: "חגים ישראליים" },
  { key: "pricing", label: "תמחור" },
  { key: "email_test", label: "בדיקת מיילים" },
  { key: "payment_settings", label: "הגדרות תשלום" },
  { key: "partners", label: "אנשי מקצוע שותפים" },
];

export default function AdminContent() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("templates");
  useEffect(() => { document.title = "ניהול תוכן | Fresh Start"; }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8" dir="rtl">
      <button onClick={() => navigate('/dashboard')} style={{ display:'inline-flex', alignItems:'center', gap:'6px', background:'none', border:'none', color:'#1E5FA8', cursor:'pointer', fontSize:'14px', fontFamily:'Rubik, sans-serif', padding:'8px 0', marginBottom:'16px', fontWeight:'500' }}><span style={{ fontSize:'16px' }}>→</span><span>חזרה לדשבורד</span></button>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">ניהול תוכן</h1>
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {TABS.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${activeTab === tab.key ? "border-blue-600 text-blue-600" : "border-transparent text-gray-600 hover:text-gray-900"}`}>
            {tab.label}
          </button>
        ))}
      </div>
      {activeTab === "templates" && <TemplatesTab />}
      {activeTab === "holidays" && <HolidaysTab />}
      {activeTab === "pricing" && <PricingTab />}
      {activeTab === "email_test" && <EmailTestTab />}
      {activeTab === "payment_settings" && <PaymentSettingsTab />}
      {activeTab === "partners" && <PartnersContentTab />}
    </div>
  );
}