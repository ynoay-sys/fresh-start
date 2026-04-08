import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import PaywallModal from "./PaywallModal";
import { trackEvent } from "../lib/trackEvent";

const AUTHORITY_COLORS = {
  tax_authority: "#1E5FA8",
  vat: "#5C1A8A",
  nii: "#1A7A4A",
  municipality: "#C25A00",
  other: "#555555",
};

const AUTHORITY_LABELS = {
  tax_authority: "מס הכנסה",
  vat: 'מע"מ',
  nii: "ביטוח לאומי",
  municipality: "עירייה",
  other: "אחר",
};

const URGENCY_LABELS = { high: "דחוף", medium: "בינוני", low: "נמוך" };
const URGENCY_ICONS = { high: "🔴", medium: "🟠", low: "⚪" };
const URGENCY_COLORS = { high: "text-red-600", medium: "text-orange-500", low: "text-gray-400" };

const AUTHORITY_FILTERS = [
  { key: "all", label: "הכל" },
  { key: "tax_authority", label: "מס הכנסה" },
  { key: "vat", label: 'מע"מ' },
  { key: "nii", label: "ביטוח לאומי" },
  { key: "municipality", label: "עירייה" },
];

const URGENCY_FILTERS = [
  { key: "all", label: "הכל" },
  { key: "high", label: "דחוף" },
  { key: "medium", label: "בינוני" },
  { key: "low", label: "נמוך" },
];

const FREE_QUOTA = 3;

function TemplateCard({ template, isCompleted, usageBlocked, onComplete, onPaywall }) {
  const [confirming, setConfirming] = useState(false);
  const color = AUTHORITY_COLORS[template.authority] || "#555";

  return (
    <div className={`rounded-xl border overflow-hidden flex flex-col transition-all ${isCompleted ? "bg-green-50 border-green-200" : "bg-white border-gray-200 hover:shadow-sm"}`}>
      <div className="h-2 w-full flex-shrink-0" style={{ backgroundColor: color }} />

      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold" style={{ color }}>{AUTHORITY_LABELS[template.authority]}</span>
          <span className={`text-xs font-medium ${URGENCY_COLORS[template.urgency]}`}>
            {URGENCY_ICONS[template.urgency]} {URGENCY_LABELS[template.urgency]}
          </span>
        </div>

        <h3 className="font-bold text-gray-900 text-base mb-1 leading-snug">{template.title_he}</h3>
        <p className="text-xs text-gray-500 leading-relaxed mb-2 line-clamp-2">{template.description}</p>

        {template.deadline_note && (
          <p className="text-xs text-orange-600 mb-3">⏰ {template.deadline_note}</p>
        )}

        {isCompleted ? (
          <div className="mt-auto py-2 px-3 bg-green-100 rounded-lg text-center text-sm font-semibold text-green-700">
            הושלם בהצלחה ✓
          </div>
        ) : (
          <div className="mt-auto space-y-2">
            {confirming ? (
              <div className="space-y-2">
                <p className="text-xs text-gray-700 text-center">האם השלמת את הטופס "{template.title_he}"?</p>
                <div className="flex gap-2">
                  <button onClick={() => { setConfirming(false); onComplete(template); }}
                    className="flex-1 py-1.5 rounded-lg text-white text-xs font-medium bg-green-600 hover:bg-green-700">
                    כן, הושלם ✓
                  </button>
                  <button onClick={() => setConfirming(false)}
                    className="flex-1 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-gray-50">
                    ביטול
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <a href={template.external_url} target="_blank" rel="noopener noreferrer"
                  className="flex-1 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-700 hover:bg-gray-50 text-center">
                  צפה בטופס ←
                </a>
                <button
                  onClick={() => usageBlocked ? onPaywall(template) : setConfirming(true)}
                  className="flex-1 py-1.5 rounded-lg text-white text-xs font-medium"
                  style={{ backgroundColor: usageBlocked ? "#C25A00" : "#1A7A4A" }}>
                  {usageBlocked ? "שדרג לסיום ✓" : "סמנו כהושלם ✓"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function TemplatesLibrary() {
  const [templates, setTemplates] = useState([]);
  const [completions, setCompletions] = useState([]);
  const [usageRecord, setUsageRecord] = useState(null);
  const [usageCount, setUsageCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [authorityFilter, setAuthorityFilter] = useState("all");
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [toast, setToast] = useState("");
  const [paywallTemplate, setPaywallTemplate] = useState(null);

  async function load() {
    const user = await base44.auth.me();
    const tmplRes = await base44.entities.DocumentTemplate.filter({ is_active: true });
    const [compRes, usageRes] = await Promise.all([
      base44.entities.UserTemplateCompletion.filter({ created_by: user.email }),
      base44.entities.UserFeatureUsage.filter({ created_by: user.email, feature_key: "template_download" }),
    ]);
    setTemplates(tmplRes);
    setCompletions(compRes);
    if (usageRes.length > 0) {
      setUsageRecord(usageRes[0]);
      setUsageCount(usageRes[0].usage_count || 0);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function isCompleted(templateKey) {
    return completions.some(c => c.template_key === templateKey);
  }

  const usageBlocked = usageCount >= FREE_QUOTA;

  async function handleComplete(template) {
    const user = await base44.auth.me();
    const newCount = usageCount + 1;
    if (usageRecord) {
      await base44.entities.UserFeatureUsage.update(usageRecord.id, { usage_count: newCount });
    } else {
      const created = await base44.entities.UserFeatureUsage.create({
        user_id: user.id, feature_key: "template_download", usage_count: 1,
      });
      setUsageRecord(created);
    }
    setUsageCount(newCount);

    trackEvent('government_form_completed', { templateKey: template.key });
    await base44.entities.UserTemplateCompletion.create({
      user_id: user.id,
      template_key: template.key,
      completed_at: new Date().toISOString(),
    });

    await base44.entities.Notification.create({
      tier: "system", type: "deadline",
      title: `טופס הושלם: ${template.title_he} ✓`,
      body: `סימנת את הטופס '${template.title_he}' כהושלם.`,
      action_url: "/documents/templates", is_read: false,
    });

    setToast("הטופס סומן כהושלם ✓");
    setTimeout(() => setToast(""), 3000);
    load();
  }

  const filtered = templates.filter(t => {
    const authMatch = authorityFilter === "all" || t.authority === authorityFilter;
    const urgMatch = urgencyFilter === "all" || t.urgency === urgencyFilter;
    return authMatch && urgMatch;
  });

  const completedCount = templates.filter(t => isCompleted(t.key)).length;
  const highUncompleted = templates.filter(t => t.urgency === "high" && !isCompleted(t.key)).length;
  const mediumUncompleted = templates.filter(t => t.urgency === "medium" && !isCompleted(t.key)).length;
  const pct = templates.length > 0 ? Math.round((completedCount / templates.length) * 100) : 0;
  const filtersActive = authorityFilter !== "all" || urgencyFilter !== "all";

  if (loading) {
    return <div className="flex items-center justify-center py-16"><div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" /></div>;
  }

  return (
    <div dir="rtl">
      {/* Progress summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-gray-700">השלמת {completedCount} מתוך {templates.length} טפסים</p>
          <span className="text-sm font-bold" style={{ color: "#1E5FA8" }}>{pct}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: "#1E5FA8" }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 16, justifyContent: 'flex-end', width: '100%', padding: '8px 0' }}>
          {[
            { label: "דחופים שלא הושלמו", count: highUncompleted, color: "#AA1111" },
            { label: "בינוניים שלא הושלמו", count: mediumUncompleted, color: "#C25A00" },
            { label: "הושלמו", count: completedCount, color: "#1A7A4A" },
          ].map(({ label, count, color }) => (
            <span key={label} style={{ display: 'inline-flex', flexDirection: 'row', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
              <span style={{ fontSize: 13, color: "#444444" }}>{label}: {count}</span>
              <span style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: color, border: '1px solid rgba(0,0,0,0.2)', flexShrink: 0, display: 'inline-block' }} />
            </span>
          ))}
        </div>
      </div>

      {paywallTemplate && (
        <PaywallModal
          featureKey="template_download"
          usedCount={usageCount}
          onClose={() => setPaywallTemplate(null)}
          onPaymentSuccess={() => { setPaywallTemplate(null); handleComplete(paywallTemplate); }}
        />
      )}

      {/* Filters */}
      <p style={{ fontSize: 13, fontWeight: 600, color: '#555', textAlign: 'right', marginBottom: 6 }}>סוג טופס</p>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="flex gap-1 flex-wrap">
          {AUTHORITY_FILTERS.map(f => (
            <button key={f.key} onClick={() => setAuthorityFilter(f.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${authorityFilter === f.key ? "text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              style={authorityFilter === f.key ? { backgroundColor: "#1E5FA8" } : {}}>
              {f.label}
            </button>
          ))}
        </div>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#555', textAlign: 'right', marginBottom: 6, marginTop: 12 }}>דחיפות</p>
          <div className="flex gap-1 flex-wrap">
          {URGENCY_FILTERS.map(f => (
            <button key={f.key} onClick={() => setUrgencyFilter(f.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${urgencyFilter === f.key ? "text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              style={urgencyFilter === f.key ? { backgroundColor: "#555" } : {}}>
              {f.label}
            </button>
          ))}
          </div>
        </div>
      </div>
      <p className="text-xs text-gray-400 text-right mb-3">
        {filtersActive
          ? `${[authorityFilter !== "all" && AUTHORITY_LABELS[authorityFilter], urgencyFilter !== "all" && URGENCY_LABELS[urgencyFilter]].filter(Boolean).join(" + ")}: ${filtered.length} טפסים`
          : `מציג את כל ${filtered.length} הטפסים`
        }
      </p>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(t => (
          <TemplateCard
            key={t.key}
            template={t}
            isCompleted={isCompleted(t.key)}
            usageBlocked={usageBlocked && !isCompleted(t.key)}
            onComplete={handleComplete}
            onPaywall={setPaywallTemplate}
          />
        ))}
      </div>

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-green-600 text-white px-5 py-2.5 rounded-full text-sm font-medium shadow-lg z-50">
          {toast}
        </div>
      )}
    </div>
  );
}