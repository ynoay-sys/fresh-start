import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import EmbeddedBrowser from "../../components/EmbeddedBrowser";
import { storeSession, getSession, clearSession, clearExpiredSessions } from "../../lib/agentSession";

const PORTALS = [
  { key: "vat_portal", label: 'פורטל מע"מ', url: "https://www.misim.gov.il" },
  { key: "tax_portal", label: "פורטל מס הכנסה", url: "https://www.misim.gov.il" },
  { key: "nii_portal", label: "פורטל ביטוח לאומי", url: "https://www.btl.gov.il" },
];

function StatusBadge({ status }) {
  if (status === "checking") return <span className="text-yellow-500 text-sm">⏳ בודק...</span>;
  if (status === "ok") return <span className="text-green-600 text-sm font-medium">✅ זמין</span>;
  return <span className="text-red-500 text-sm font-medium">❌ לא זמין</span>;
}

export default function AutomationTest() {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState(null);
  const [portalHealth, setPortalHealth] = useState({});
  const [sessions, setSessions] = useState([]);
  const [showBrowser, setShowBrowser] = useState(false);
  const [automationMode, setAutomationMode] = useState(localStorage.getItem("AUTOMATION_MODE") || null);

  // Load active sessions
  async function loadSessions() {
    const user = await base44.auth.me();
    const now = new Date().toISOString();
    const all = await base44.entities.AgentSession.filter({ created_by: user.email });
    setSessions(all.filter(s => s.expires_at && s.expires_at > now));
  }

  // Portal health check on load
  useEffect(() => {
    loadSessions();
    checkPortalHealth();
  }, []);

  async function checkPortalHealth() {
    const initial = {};
    PORTALS.forEach(p => { initial[p.key] = { status: "checking", ms: null }; });
    setPortalHealth(initial);

    for (const portal of PORTALS) {
      const start = Date.now();
      try {
        const res = await fetch(portal.url, { method: "HEAD", mode: "no-cors" });
        // no-cors returns opaque response (status 0) but doesn't throw = reachable
        const ms = Date.now() - start;
        setPortalHealth(prev => ({ ...prev, [portal.key]: { status: "ok", ms } }));
      } catch (e) {
        setPortalHealth(prev => ({ ...prev, [portal.key]: { status: "error", ms: null } }));
      }
    }
  }

  async function runSpikeTest() {
    setRunning(true);
    setResults(null);

    const testResults = { playwright: null, fetch: null, rpa: null };

    // TEST A — Playwright (not available in browser environment)
    try {
      // Playwright is a Node.js-only library and cannot run in a browser/frontend context.
      // This intentionally throws to confirm it's unavailable.
      throw new Error("Playwright is a Node.js library and cannot run in a browser (frontend) environment. Base44 frontend apps run in the browser — Playwright is not available.");
    } catch (e) {
      testResults.playwright = { available: false, error: e.message };
    }

    // TEST B — Basic fetch
    try {
      const res = await fetch("https://www.gov.il", { mode: "no-cors" });
      testResults.fetch = { available: true, status: res.status || "opaque (no-cors)" };
    } catch (e) {
      testResults.fetch = { available: false, error: e.message };
    }

    // TEST C — RPA webhook
    try {
      const res = await fetch("https://cloud.robocorp.com/health", { method: "HEAD", mode: "no-cors" });
      testResults.rpa = { reachable: true };
    } catch (e) {
      testResults.rpa = { reachable: false, error: e.message };
    }

    // Determine mode
    let mode;
    if (testResults.playwright.available) {
      mode = "playwright";
    } else if (testResults.fetch.available) {
      mode = "guided_manual";
    } else {
      mode = "manual_only";
    }

    setResults({ ...testResults, mode });
    setRunning(false);
  }

  function saveMode() {
    const mode = results?.mode || automationMode;
    if (!mode) return;
    localStorage.setItem("AUTOMATION_MODE", mode);
    setAutomationMode(mode);
    alert(`נשמר: AUTOMATION_MODE = ${mode}`);
  }

  async function handleClearExpired() {
    const user = await base44.auth.me();
    const all = await base44.entities.AgentSession.filter({ created_by: user.email });
    const now = new Date().toISOString();
    const expired = all.filter(s => !s.expires_at || s.expires_at <= now);
    await Promise.all(expired.map(s => base44.entities.AgentSession.delete(s.id)));
    loadSessions();
  }

  function copySummary() {
    if (!results) return;
    const summary = `Sprint 17 Spike Test Results:
Playwright: ${results.playwright?.available ? "✅ זמין" : "❌ לא זמין — " + results.playwright?.error}
Fetch: ${results.fetch?.available ? "✅ זמין" : "❌ לא זמין"}
RPA: ${results.rpa?.reachable ? "✅ זמין" : "❌ לא זמין"}
AUTOMATION_MODE = ${results.mode}`;
    navigator.clipboard.writeText(summary);
    alert("הועתק ללוח ✓");
  }

  const mode = results?.mode || automationMode;

  const modeCard = {
    playwright: { bg: "bg-green-50 border-green-200", icon: "✅", title: "Playwright זמין!", desc: "Base44 תומך בהפעלת דפדפן אוטומטי.", sub: "ניתן לבנות אוטומציה מלאה של הגשת טפסים.", rec: "המלצה: בנה אוטומציה מלאה (Sprint 18 — מצב Playwright)" },
    guided_manual: { bg: "bg-orange-50 border-orange-200", icon: "⚠️", title: "Playwright לא זמין — מצב מדריך", desc: "Base44 אינו תומך בהפעלת דפדפן אוטומטי.", sub: "המערכת תעבוד במצב הדרכה ידנית מתקדמת.", rec: "המלצה: בנה מדריך ידני מתקדם עם קישורים ישירים (Sprint 18 — מצב Guided)" },
    manual_only: { bg: "bg-red-50 border-red-200", icon: "❌", title: "אוטומציה לא זמינה", desc: "המערכת תעבוד במצב ידני מלא.", sub: "", rec: "המלצה: בנה מדריך ידני מלא עם טפסים מוכנים מראש (Sprint 18 — מצב Manual)" },
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4" dir="rtl">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
          <div className="text-5xl mb-3">⚙️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">בדיקת תשתית אוטומציה</h1>
          <p className="text-sm text-gray-500">בדיקה האם Base44 תומך בהפעלת דפדפן אוטומטי</p>
          <p className="text-xs text-gray-400 mt-1">Sprint 17 — Spike Test</p>
        </div>

        {/* Portal Health */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h2 className="font-bold text-gray-800 mb-3">🏥 בריאות פורטלים ממשלתיים</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-gray-100">
                <th className="text-right pb-2 font-medium">פורטל</th>
                <th className="text-right pb-2 font-medium">כתובת</th>
                <th className="text-right pb-2 font-medium">סטטוס</th>
                <th className="text-right pb-2 font-medium">זמן תגובה</th>
              </tr>
            </thead>
            <tbody>
              {PORTALS.map(p => {
                const h = portalHealth[p.key] || { status: "checking" };
                return (
                  <tr key={p.key} className="border-b border-gray-50">
                    <td className="py-2 font-medium text-gray-800">{p.label}</td>
                    <td className="py-2 text-gray-400 text-xs">{p.url}</td>
                    <td className="py-2"><StatusBadge status={h.status} /></td>
                    <td className="py-2 text-gray-500 text-xs">{h.ms != null ? `${h.ms}ms` : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <button onClick={checkPortalHealth} className="mt-3 text-xs text-blue-600 hover:underline">רענן ←</button>
        </div>

        {/* Spike Test */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-bold text-gray-800 mb-4">🧪 בדיקת Playwright</h2>
          <button
            onClick={runSpikeTest}
            disabled={running}
            className="w-full py-3 rounded-xl text-white font-medium text-base disabled:opacity-60"
            style={{ backgroundColor: "#1E5FA8" }}>
            {running ? "בודק..." : "הפעל בדיקה ←"}
          </button>

          {running && (
            <div className="mt-4 flex items-center gap-3 text-sm text-gray-600">
              <div className="w-5 h-5 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin flex-shrink-0" />
              מריץ בדיקות A / B / C...
            </div>
          )}

          {results && (
            <div className="mt-5 space-y-3">
              {/* Test A */}
              <div className={`p-3 rounded-lg border text-sm ${results.playwright.available ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                <p className="font-bold">{results.playwright.available ? "✅" : "❌"} בדיקה A — Playwright</p>
                {results.playwright.available
                  ? <p className="text-green-700 mt-1">זמין! דף: {results.playwright.title}</p>
                  : <p className="text-red-600 mt-1 font-mono text-xs break-all">{results.playwright.error}</p>}
              </div>

              {/* Test B */}
              <div className={`p-3 rounded-lg border text-sm ${results.fetch.available ? "bg-orange-50 border-orange-200" : "bg-red-50 border-red-200"}`}>
                <p className="font-bold">{results.fetch.available ? "⚠️" : "❌"} בדיקה B — Fetch</p>
                {results.fetch.available
                  ? <p className="text-orange-700 mt-1">Fetch זמין (מוגבל). סטטוס: {results.fetch.status}</p>
                  : <p className="text-red-600 mt-1 font-mono text-xs break-all">{results.fetch.error}</p>}
              </div>

              {/* Test C */}
              <div className={`p-3 rounded-lg border text-sm ${results.rpa.reachable ? "bg-blue-50 border-blue-200" : "bg-gray-50 border-gray-200"}`}>
                <p className="font-bold">{results.rpa.reachable ? "🤖" : "📋"} בדיקה C — RPA Webhook</p>
                <p className="text-gray-600 mt-1">{results.rpa.reachable ? "RPA integration possible" : "RPA integration requires setup"}</p>
              </div>

              {/* Mode result */}
              {mode && modeCard[mode] && (
                <div className={`p-4 rounded-xl border ${modeCard[mode].bg}`}>
                  <p className="font-bold text-gray-900 text-lg">{modeCard[mode].icon} {modeCard[mode].title}</p>
                  <p className="text-sm text-gray-700 mt-1">{modeCard[mode].desc}</p>
                  {modeCard[mode].sub && <p className="text-sm text-gray-600">{modeCard[mode].sub}</p>}
                  <p className="text-sm font-semibold text-gray-800 mt-3">🎯 {modeCard[mode].rec}</p>
                </div>
              )}

              <div className="flex gap-2 flex-wrap">
                <button onClick={saveMode} className="px-4 py-2 rounded-lg text-white text-sm font-medium" style={{ backgroundColor: "#1A7A4A" }}>
                  שמור הגדרה זו ✓
                </button>
                <button onClick={copySummary} className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50">
                  📋 שלח תוצאה
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Active Sessions */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-800">🔐 סשנים פעילים: {sessions.length}</h2>
            <button onClick={handleClearExpired} className="text-xs text-red-500 hover:underline">נקה פגי תוקף</button>
          </div>
          {sessions.length === 0 ? (
            <p className="text-sm text-gray-400">אין סשנים פעילים</p>
          ) : (
            <div className="space-y-2">
              {sessions.map(s => (
                <div key={s.id} className="flex items-center justify-between text-sm border-b border-gray-50 pb-1">
                  <span className="font-medium text-gray-700">{s.portal_key}</span>
                  <span className="text-xs text-gray-400">פג תוקף: {s.expires_at ? new Date(s.expires_at).toLocaleString("he-IL") : "—"}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Embedded Browser Demo */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h2 className="font-bold text-gray-800 mb-3">🌐 דפדפן מוטמע (מצב ידני)</h2>
          <button onClick={() => setShowBrowser(v => !v)}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50">
            {showBrowser ? "סגור דפדפן" : "פתח דפדפן לדוגמה ←"}
          </button>
          {showBrowser && (
            <div className="mt-4">
              <EmbeddedBrowser
                portalUrl="https://www.btl.gov.il"
                portalName="ביטוח לאומי"
                onLoginComplete={() => { alert("הכניסה הושלמה!"); setShowBrowser(false); }}
                onCancel={() => setShowBrowser(false)}
              />
            </div>
          )}
        </div>

        {/* Saved mode */}
        {automationMode && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
            ⚙️ מצב שמור: <strong>{automationMode}</strong>
          </div>
        )}
      </div>
    </div>
  );
}