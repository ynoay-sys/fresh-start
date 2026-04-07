import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Send, Copy, Check, Monitor, Smartphone } from "lucide-react";
import PaywallModal from "../components/PaywallModal";
import LandingPagePreview from "../components/LandingPagePreview";
import ManualEditModal from "../components/ManualEditModal";
import { checkAndUnlockAchievements } from "../lib/achievements";

const BIZ_TYPE_HE = {
  freelancer: "פרילנסר",
  retail: "עסק קמעונאי",
  studio: "סטודיו",
  food: "מזון",
  consultant: "ייעוץ",
  other: "עסק",
};

function slugify(name) {
  if (!name) return `my-business-${Math.floor(1000 + Math.random() * 9000)}`;
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]/g, "")
    .replace(/\-+/g, "-")
    .slice(0, 30) || `my-business-${Math.floor(1000 + Math.random() * 9000)}`;
}

const CHIPS = [
  "שנה את הכותרת הראשית",
  "הוסף שירות חדש",
  "שנה את הצבע הראשי לירוק",
  "עדכן את פרטי הקשר",
];

export default function LandingPageBuilder() {
  const [page, setPage] = useState(null);
  const [businessName, setBusinessName] = useState("");
  const [profile, setProfile] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [previewMode, setPreviewMode] = useState("desktop");
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showDomainPaywall, setShowDomainPaywall] = useState(false);
  const [customDomain, setCustomDomain] = useState("");
  const [domainSaved, setDomainSaved] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    async function load() {
      const u = await base44.auth.me();
      setUser(u);
      const [pages, profiles] = await Promise.all([
        base44.entities.LandingPage.filter({ created_by: u.email }),
        base44.entities.UserProfile.filter({ created_by: u.email }),
      ]);
      const p = profiles[0] || null;
      setProfile(p);
      setBusinessName(p?.business_name || u.full_name || "העסק שלי");
      if (pages.length > 0) setPage(pages[0]);
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleGenerate() {
    setGenerating(true);
    const bizTypeHe = BIZ_TYPE_HE[profile?.business_type] || "עסק";
    const city = profile?.city || "";
    const bizName = profile?.business_name || businessName;
    const newPage = await base44.entities.LandingPage.create({
      headline: `ברוכים הבאים ל${bizName}`,
      subheadline: `שירותי ${bizTypeHe} מקצועיים${city ? ` ב${city}` : ""}`,
      tagline: `${bizName}${city ? ` — ${city}` : ""}`,
      primary_color: "#1E5FA8",
      secondary_color: "#EAF2FB",
      services_list: [],
      contact_email: user.email,
      contact_phone: profile?.phone_il || "",
      subdomain: slugify(bizName),
      is_published: false,
    });
    setPage(newPage);
    setGenerating(false);
  }

  async function handleSendMessage(text) {
    const msg = text || input.trim();
    if (!msg || !page) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: msg }]);
    setSending(true);

    const currentConfig = JSON.stringify({
      headline: page.headline,
      subheadline: page.subheadline,
      tagline: page.tagline,
      primary_color: page.primary_color,
      secondary_color: page.secondary_color,
      services_list: page.services_list,
      contact_email: page.contact_email,
      contact_phone: page.contact_phone,
    });

    const systemPrompt = `You control a landing page editor for an Israeli small business.
The user gives instructions in Hebrew or English to modify their page.

Current page config:
${currentConfig}

Return ONLY a valid JSON patch object with the fields to update.
Editable fields: headline, subheadline, tagline, primary_color,
secondary_color, services_list (array of {title, description}),
contact_email, contact_phone.

Examples:
User: "שנה את הכותרת ל-ברוכים הבאים לעסק שלי"
Response: {"headline": "ברוכים הבאים לעסק שלי"}

User: "הוסף שירות: עיצוב לוגו"
Response: {"services_list": [{"title": "עיצוב לוגו", "description": ""}]}

User: "שנה צבע ראשי לירוק"
Response: {"primary_color": "#1A7A4A"}

Respond ONLY with the JSON patch. No explanation. No markdown.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `${systemPrompt}\n\nUser: ${msg}`,
      response_json_schema: {
        type: "object",
        properties: {
          headline: { type: "string" },
          subheadline: { type: "string" },
          tagline: { type: "string" },
          primary_color: { type: "string" },
          secondary_color: { type: "string" },
          services_list: { type: "array", items: { type: "object" } },
          contact_email: { type: "string" },
          contact_phone: { type: "string" },
        },
      },
    });

    // Filter out undefined/null values
    const patch = Object.fromEntries(Object.entries(result).filter(([, v]) => v !== undefined && v !== null));
    if (Object.keys(patch).length > 0) {
      await base44.entities.LandingPage.update(page.id, patch);
      setPage(prev => ({ ...prev, ...patch }));
    }

    setMessages(prev => [...prev, { role: "ai", text: "עודכן ✓" }]);
    setSending(false);
  }

  async function handlePublish() {
    await base44.entities.LandingPage.update(page.id, { is_published: true });
    setPage(prev => ({ ...prev, is_published: true }));
    setShowPublishConfirm(false);
    setPublishSuccess(true);
    // Achievement
    const existing = await base44.entities.Achievement.filter({ created_by: user.email, achievement_key: "page_published" });
    if (existing.length === 0) {
      await base44.entities.Achievement.create({
        achievement_key: "page_published",
        title_he: "דף הנחיתה שלי באוויר!",
        description_he: "פרסמת את דף הנחיתה שלך",
        icon: "🌐",
        unlocked_at: new Date().toISOString(),
      });
      checkAndUnlockAchievements().catch(() => {});
    }
  }

  async function handleUnpublish() {
    await base44.entities.LandingPage.update(page.id, { is_published: false });
    setPage(prev => ({ ...prev, is_published: false }));
    setPublishSuccess(false);
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(`https://freshstart.app/${page.subdomain}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row md:h-[calc(100vh-3.5rem)] md:overflow-hidden" dir="rtl">
      {/* LEFT PANEL */}
      <div className="w-full md:w-[40%] md:flex-shrink-0 border-b md:border-b-0 md:border-l border-gray-200 bg-white overflow-y-auto flex flex-col">
        <div className="px-5 py-4 border-b border-gray-100">
          <h1 className="text-xl font-bold text-gray-900">דף הנחיתה שלי 🌐</h1>
        </div>

        {/* SECTION A */}
        {!page ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
            <span className="text-6xl mb-4">🌐</span>
            <h2 className="text-lg font-bold text-gray-800 mb-1">עדיין אין דף נחיתה</h2>
            <p className="text-sm text-gray-400 mb-6">צור דף אוטומטי מהפרופיל שלך בלחיצה אחת</p>
            <button onClick={handleGenerate} disabled={generating}
              className="px-6 py-3 rounded-xl text-white font-medium text-base disabled:opacity-60"
              style={{ backgroundColor: "#1E5FA8" }}>
              {generating ? "יוצר..." : "✨ צור דף אוטומטי"}
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col px-5 py-4 gap-4 overflow-y-auto">
            {/* Status card */}
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${page.is_published ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {page.is_published ? "מפורסם ✓" : "טיוטה"}
                </span>
                {page.is_published ? (
                  <button onClick={handleUnpublish}
                    className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
                    הסר פרסום
                  </button>
                ) : (
                  <button onClick={() => setShowPublishConfirm(true)}
                    className="text-xs px-3 py-1.5 rounded-lg text-white font-medium"
                    style={{ backgroundColor: "#1E5FA8" }}>
                    פרסם
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500">כתובת: freshstart.app/{page.subdomain}</p>
            </div>

            {/* Publish success */}
            {publishSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                <p className="text-green-800 font-bold mb-1">🎉 הדף פורסם בהצלחה!</p>
                <p className="text-xs text-green-600 mb-3">freshstart.app/{page.subdomain}</p>
                <button onClick={handleCopyLink}
                  className="flex items-center gap-2 mx-auto px-4 py-2 rounded-lg border border-green-300 text-green-700 text-sm hover:bg-green-100 transition-colors">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? "הועתק!" : "העתק קישור 📋"}
                </button>
              </div>
            )}

            {/* AI Chat Editor */}
            <div className="flex-1 flex flex-col">
              <p className="text-sm font-bold text-gray-800 mb-0.5">ערוך עם AI ✏️</p>
              <p className="text-xs text-gray-400 mb-3">תאר בעברית מה לשנות בדף</p>

              {/* Chips */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {CHIPS.map(chip => (
                  <button key={chip} onClick={() => handleSendMessage(chip)}
                    className="text-xs px-2.5 py-1 rounded-full border border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors bg-white">
                    {chip}
                  </button>
                ))}
              </div>

              {/* Messages */}
              <div className="flex-1 max-h-48 overflow-y-auto space-y-2 mb-3">
                {messages.slice(-5).map((m, i) => (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-start" : "justify-end"}`}>
                    <div className={`text-xs px-3 py-2 rounded-xl max-w-[80%] ${m.role === "user" ? "bg-gray-100 text-gray-700" : "text-white"}`}
                      style={m.role === "ai" ? { backgroundColor: "#1E5FA8" } : {}}>
                      {m.text}
                    </div>
                  </div>
                ))}
                {sending && (
                  <div className="flex justify-end">
                    <div className="text-xs px-3 py-2 rounded-xl text-white" style={{ backgroundColor: "#1E5FA8" }}>
                      מעדכן...
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSendMessage()}
                  placeholder="תאר מה לשנות..."
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
                  dir="rtl"
                  disabled={sending}
                />
                <button onClick={() => handleSendMessage()} disabled={sending || !input.trim()}
                  className="p-2 rounded-lg text-white disabled:opacity-50"
                  style={{ backgroundColor: "#1E5FA8" }}>
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Domain */}
            {domainSaved ? (
              <div className="px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 font-medium">
                🌐 דומיין: {customDomain}
              </div>
            ) : (
              <button onClick={() => setShowDomainPaywall(true)}
                className="w-full py-2.5 rounded-lg border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors">
                🌐 חבר דומיין מותאם (₪29)
              </button>
            )}

            {/* Manual edit */}
            <button onClick={() => setShowManual(true)}
              className="w-full py-2.5 rounded-lg border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors">
              עריכה ידנית ⚙️
            </button>
          </div>
        )}
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 bg-gray-100 flex flex-col md:overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-2 px-5 py-3 bg-white border-b border-gray-200">
          <button onClick={() => setPreviewMode("desktop")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${previewMode === "desktop" ? "text-white" : "text-gray-500 hover:bg-gray-100"}`}
            style={previewMode === "desktop" ? { backgroundColor: "#1E5FA8" } : {}}>
            <Monitor className="w-4 h-4" /> דסקטופ
          </button>
          <button onClick={() => setPreviewMode("mobile")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${previewMode === "mobile" ? "text-white" : "text-gray-500 hover:bg-gray-100"}`}
            style={previewMode === "mobile" ? { backgroundColor: "#1E5FA8" } : {}}>
            <Smartphone className="w-4 h-4" /> מובייל
          </button>
        </div>

        {/* Preview area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 flex justify-center">
          {!page ? (
            <div className="flex items-center justify-center text-gray-400 text-sm">
              צור דף נחיתה כדי לראות תצוגה מקדימה
            </div>
          ) : (
            <div
              className="bg-white shadow-xl rounded-xl overflow-hidden transition-all"
              style={{ width: previewMode === "mobile" ? "375px" : "100%", maxWidth: "900px" }}
            >
              <LandingPagePreview page={page} businessName={businessName} />
            </div>
          )}
        </div>
      </div>

      {/* Publish Confirm Dialog */}
      {showPublishConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center">
            <p className="font-bold text-gray-900 text-lg mb-2">פרסם את הדף?</p>
            <p className="text-sm text-gray-500 mb-5">הדף יהיה זמין בכתובת:<br /><strong>freshstart.app/{page?.subdomain}</strong></p>
            <div className="flex gap-3">
              <button onClick={handlePublish}
                className="flex-1 py-2.5 rounded-lg text-white font-medium" style={{ backgroundColor: "#1E5FA8" }}>
                כן, פרסם ←
              </button>
              <button onClick={() => setShowPublishConfirm(false)}
                className="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-700 font-medium hover:bg-gray-50">
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Domain Paywall Modal */}
      {showDomainPaywall && (
        <PaywallModal
          featureKey="domain"
          onClose={() => setShowDomainPaywall(false)}
          onPaymentSuccess={() => {
            setShowDomainPaywall(false);
            const domain = prompt("הזן את שם הדומיין המותאם שלך (לדוגמה: mybusiness.co.il)");
            if (domain) {
              base44.entities.LandingPage.update(page.id, { subdomain: domain.replace(/https?:\/\//, "").replace(/\/$/, "") });
              setCustomDomain(domain);
              setDomainSaved(true);
            }
          }}
        />
      )}

      {/* Manual Edit Modal */}
      {showManual && page && (
        <ManualEditModal
          page={page}
          onClose={() => setShowManual(false)}
          onSaved={(updated) => { setPage(prev => ({ ...prev, ...updated })); setShowManual(false); }}
        />
      )}
    </div>
  );
}