import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Trash2, Monitor, Smartphone } from "lucide-react";
import html2canvas from "html2canvas";
import { format } from "date-fns";
import { generateSignatureHtml } from "../lib/generateSignatureHtml";
import InstallGuideModal from "../components/InstallGuideModal";
import PaywallModal from "../components/PaywallModal";

const BIZ_TYPE_HE = {
  freelancer: "פרילנסר", retail: "קמעונאות", studio: "סטודיו",
  food: "מזון", consultant: "ייעוץ", other: "עצמאי",
};

const STYLE_OPTIONS = [
  { key: "modern", label: "מודרני" },
  { key: "classic", label: "קלאסי" },
  { key: "minimal", label: "מינימלי" },
];

const MAX_SIGS = 5;

export default function EmailSignaturePage() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({
    fullName: "", role: "", businessName: "",
    phone: "", email: "", website: "",
    primaryColor: "#1E5FA8", style: "modern", includeAvatar: true,
  });
  const [generatedHtml, setGeneratedHtml] = useState("");
  const [savedSigs, setSavedSigs] = useState([]);
  const [usageRecord, setUsageRecord] = useState(null);
  const [usageCount, setUsageCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showInstall, setShowInstall] = useState(false);
  const previewRef = useRef(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [mobilePreview, setMobilePreview] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [firstFreeToast, setFirstFreeToast] = useState(false);

  useEffect(() => {
    async function load() {
      const u = await base44.auth.me();
      setUser(u);

      const [profiles, landingPages, usageRes, sigs] = await Promise.all([
        base44.entities.UserProfile.filter({ created_by: u.email }),
        base44.entities.LandingPage.filter({ created_by: u.email }),
        base44.entities.UserFeatureUsage.filter({ created_by: u.email, feature_key: "email_sig" }),
        base44.entities.EmailSignature.filter({ created_by: u.email }, "-created_date"),
      ]);

      const p = profiles[0] || {};
      const lp = landingPages[0];
      const validSubdomain = lp?.subdomain && lp.subdomain !== '-' && lp.is_published;
      const website = validSubdomain ? lp.subdomain : "";

      setForm(f => ({
        ...f,
        fullName: [p.first_name, p.last_name].filter(Boolean).join(" "),
        role: p.business_type ? (BIZ_TYPE_HE[p.business_type] || p.business_type) : "",
        businessName: p.business_name || "",
        phone: p.phone_il || "",
        email: u.email || "",
        website,
      }));

      if (usageRes.length > 0) {
        setUsageRecord(usageRes[0]);
        setUsageCount(usageRes[0].usage_count || 0);
      }

      setSavedSigs(sigs);
      setLoading(false);
    }
    load();
  }, []);

  // Live preview updates
  const previewHtml = generateSignatureHtml(form);

  async function doGenerate() {
    setGenerating(true);
    const html = generateSignatureHtml(form);
    setGeneratedHtml(html);

    // Save to entity
    await base44.entities.EmailSignature.create({
      html_content: html,
      style: form.style,
      primary_color: form.primaryColor,
      full_name: form.fullName,
      role: form.role,
      business_name: form.businessName,
      phone: form.phone,
      email: form.email,
      website: form.website,
      include_avatar: form.includeAvatar,
    });

    // Increment usage
    const newCount = usageCount + 1;
    if (usageRecord) {
      await base44.entities.UserFeatureUsage.update(usageRecord.id, { usage_count: newCount });
    } else {
      const created = await base44.entities.UserFeatureUsage.create({
        user_id: user.id, feature_key: "email_sig", usage_count: 1,
      });
      setUsageRecord(created);
    }
    setUsageCount(newCount);

    // Refresh saved
    const u = await base44.auth.me();
    const sigs = await base44.entities.EmailSignature.filter({ created_by: u.email }, "-created_date");
    setSavedSigs(sigs);
    setGenerating(false);
  }

  async function handleGenerate() {
    if (savedSigs.length >= MAX_SIGS) return;
    if (usageCount === 0) {
      setFirstFreeToast(true);
      setTimeout(() => setFirstFreeToast(false), 3000);
      await doGenerate();
    } else {
      setShowPaywall(true);
    }
  }

  async function handlePaymentSuccess() {
    setShowPaywall(false);
    await doGenerate();
  }

  async function handleDelete(id) {
    await base44.entities.EmailSignature.delete(id);
    setSavedSigs(s => s.filter(x => x.id !== id));
  }

  function handleLoad(sig) {
    setForm({
      fullName: sig.full_name || "",
      role: sig.role || "",
      businessName: sig.business_name || "",
      phone: sig.phone || "",
      email: sig.email || "",
      website: sig.website || "",
      primaryColor: sig.primary_color || "#1E5FA8",
      style: sig.style || "modern",
      includeAvatar: sig.include_avatar ?? true,
    });
    setGeneratedHtml(sig.html_content || "");
  }

  async function handleDownload() {
    if (!previewRef.current) return;
    setDownloading(true);
    const canvas = await html2canvas(previewRef.current, { backgroundColor: "#ffffff", scale: 2 });
    const link = document.createElement("a");
    link.download = `חתימה-אימייל-${form.fullName?.split(" ")[0] || "שלי"}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    setDownloading(false);
  }

  const f = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8" dir="rtl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">יצירת חתימת אימייל</h1>
      <p className="text-sm text-gray-500 mb-6">צור חתימה מקצועית לאימייל שלך תוך שניות</p>

      {firstFreeToast && (
        <div className="mb-4 px-5 py-3 rounded-xl text-white text-sm font-medium" style={{ backgroundColor: "#1A7A4A" }}>
          החתימה הראשונה שלך — חינם! 🎉
        </div>
      )}

      {savedSigs.length >= MAX_SIGS && (
        <div className="mb-4 px-5 py-3 rounded-xl bg-orange-50 border border-orange-200 text-orange-800 text-sm font-medium">
          הגעת למגבלת 5 חתימות. מחק חתימה ישנה כדי ליצור חדשה.
        </div>
      )}

      {/* Split layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* LEFT PANEL */}
        <div className="lg:w-2/5 space-y-4 flex-shrink-0">
          {/* Section A: Fields */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-bold text-gray-800 mb-4">פרטי החתימה</h2>
            <div className="space-y-3">
              {[
                { key: "fullName", label: "שם מלא *" },
                { key: "role", label: "תפקיד / עיסוק" },
                { key: "businessName", label: "שם העסק" },
                { key: "phone", label: "טלפון" },
                { key: "email", label: "אימייל" },
                { key: "website", label: "אתר אינטרנט" },
              ].map(({ key, label }) => (
                <div key={key} className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-600">{label}</label>
                  <input
                    type="text"
                    value={form[key] || ""}
                    onChange={e => f(key, e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
                    dir="rtl"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Section B: Design */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-bold text-gray-800 mb-4">עיצוב</h2>
            <div className="space-y-4">
              {/* Color */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600">צבע ראשי</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={form.primaryColor}
                    onChange={e => f("primaryColor", e.target.value)}
                    className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5" />
                  <span className="text-sm text-gray-600 font-mono">{form.primaryColor}</span>
                </div>
              </div>

              {/* Style */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600">סגנון</label>
                <div className="flex gap-2">
                  {STYLE_OPTIONS.map(s => (
                    <button key={s.key} onClick={() => f("style", s.key)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${form.style === s.key ? "text-white border-transparent" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                      style={form.style === s.key ? { backgroundColor: "#1E5FA8" } : {}}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>


            </div>
          </div>

          {/* Section C: Generate */}
          <button
            onClick={handleGenerate}
            disabled={generating || !form.fullName || savedSigs.length >= MAX_SIGS}
            className="w-full py-3 rounded-xl text-white font-bold text-sm transition-all disabled:opacity-50"
            style={{ backgroundColor: "#1E5FA8" }}
          >
            {generating ? "יוצר חתימה..." : "✨ צור חתימה"}
          </button>

          {/* Section D: Export */}
          <div className="flex flex-col gap-2">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-50"
              style={{ backgroundColor: "#1E5FA8" }}
            >
              {downloading ? "מוריד..." : "⬇️ הורד חתימה"}
            </button>
            <button onClick={() => setShowInstall(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium"
              style={{ borderColor: "#1E5FA8", color: "#1E5FA8" }}>
              📖 הוראות התקנה
            </button>
            <button
              onClick={() => {
                const subject = encodeURIComponent('החתימה שלי מ-Fresh Start');
                const body = encodeURIComponent('שלום,\n\nמצורפת החתימה שלי שנוצרה ב-Fresh Start.\n\nניתן להוריד את תמונת החתימה מהקישור:\n' + window.location.href);
                const mailtoLink = `mailto:${user?.email || ''}?subject=${subject}&body=${body}`;
                const link = document.createElement('a');
                link.href = mailtoLink;
                link.click();
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50"
            >
              📧 שלח לאימייל שלי
            </button>
          </div>
        </div>

        {/* RIGHT PANEL: Preview */}
        <div className="lg:flex-1">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Email bar */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-gray-100 border-b border-gray-200">
              <span className="text-xs text-gray-500 font-medium">אימייל חדש — תצוגה מקדימה</span>
              <div className="flex gap-1">
                <button onClick={() => setMobilePreview(false)}
                  className={`p-1.5 rounded ${!mobilePreview ? "bg-white shadow-sm" : "text-gray-400 hover:text-gray-600"}`}>
                  <Monitor className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setMobilePreview(true)}
                  className={`p-1.5 rounded ${mobilePreview ? "bg-white shadow-sm" : "text-gray-400 hover:text-gray-600"}`}>
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Preview content */}
            <div className="p-6 min-h-64 flex items-start justify-start">
              <div style={{ maxWidth: mobilePreview ? 320 : "100%", width: "100%" }}>
                <p className="text-xs text-gray-400 mb-3 border-b border-gray-100 pb-2">— חתימה —</p>
                <div ref={previewRef} dangerouslySetInnerHTML={{ __html: previewHtml }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Saved Signatures */}
      {savedSigs.length > 0 && (
        <div className="mt-10">
          <h2 className="text-lg font-bold text-gray-900 mb-4">החתימות שלי</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedSigs.map(sig => (
              <div key={sig.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* Mini preview */}
                <div className="p-4 bg-gray-50 border-b border-gray-100 min-h-[80px] overflow-hidden">
                  <div style={{ transform: "scale(0.65)", transformOrigin: "top right", pointerEvents: "none" }}
                    dangerouslySetInnerHTML={{ __html: sig.html_content }} />
                </div>
                <div className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400">
                      {sig.created_date ? format(new Date(sig.created_date), "dd/MM/yyyy") : ""}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full text-white font-medium"
                      style={{ backgroundColor: "#1E5FA8" }}>
                      {{ modern: "מודרני", classic: "קלאסי", minimal: "מינימלי" }[sig.style] || sig.style}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleLoad(sig)}
                      className="flex-1 py-1.5 rounded-lg text-white text-xs font-medium"
                      style={{ backgroundColor: "#1E5FA8" }}>
                      השתמש בחתימה זו
                    </button>
                    <button onClick={() => handleDelete(sig.id)}
                      className="flex items-center justify-center px-2.5 py-1.5 rounded-lg border border-red-100 text-red-500 hover:bg-red-50">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      {showInstall && (
        <InstallGuideModal
          onClose={() => setShowInstall(false)}
          onDownload={() => { setShowInstall(false); handleDownload(); }}
          userEmail={form.email}
        />
      )}
      {showPaywall && (
        <PaywallModal
          featureKey="email_sig"
          usedCount={usageCount}
          onClose={() => setShowPaywall(false)}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}