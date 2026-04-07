import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

export default function CompletionSummaryCard({ steps, profile }) {
  const navigate = useNavigate();

  const getStep = (key) => steps.find(s => s.step_key === key);
  const bankStep = getStep("bank_account");
  const vatStep = getStep("vat_file");
  const taxStep = getStep("tax_file");
  const niiStep = getStep("nii");

  function handlePrint() {
    const win = window.open("", "_blank");
    win.document.write(`
      <html dir="rtl"><head><title>סיכום פתיחת עסק</title>
      <style>body{font-family:Arial,sans-serif;padding:30px;direction:rtl}h1{color:#1E5FA8}li{margin:8px 0}</style></head>
      <body>
        <h1>🎉 סיכום פתיחת עסק — Fresh Start</h1>
        <p>תאריך: ${new Date().toLocaleDateString("he-IL")}</p>
        <ul>
          <li>✓ חשבון בנק — ${bankStep?.draft_data?.confirmationNumber || "הושלם"}</li>
          <li>✓ מע"מ: ${profile?.vat_type ? `עוסק ${profile.vat_type}` : "הושלם"} — מספר ${profile?.vat_number || "—"}</li>
          <li>✓ מס הכנסה — תיק ${profile?.tax_file_number || "—"}</li>
          <li>✓ ביטוח לאומי — תיק ${profile?.nii_number || "—"}</li>
        </ul>
      </body></html>
    `);
    win.document.close();
    win.print();
  }

  return (
    <div className="rounded-2xl p-6 text-white mb-6" style={{ background: "linear-gradient(135deg, #1E5FA8, #1A7A4A)" }}>
      <p className="text-2xl font-bold mb-1">🎉 מזל טוב! העסק שלך רשום רשמית!</p>
      <p className="text-sm opacity-90 mb-5">השלמת את כל שלבי פתיחת העסק. אתה מוכן להתחיל!</p>

      <div className="bg-white/15 rounded-xl p-4 mb-5 space-y-2 text-sm">
        <p>✓ חשבון בנק{bankStep?.draft_data?.confirmationNumber ? ` — ${bankStep.draft_data.confirmationNumber}` : ""}</p>
        <p>✓ מע&quot;מ: {profile?.vat_type ? `עוסק ${profile.vat_type}` : "הושלם"}{profile?.vat_number ? ` — מספר ${profile.vat_number}` : ""}</p>
        <p>✓ מס הכנסה{profile?.tax_file_number ? ` — תיק ${profile.tax_file_number}` : ""}</p>
        <p>✓ ביטוח לאומי{profile?.nii_number ? ` — תיק ${profile.nii_number}` : ""}</p>
      </div>

      <button onClick={handlePrint}
        className="mb-4 px-4 py-2 bg-white/20 rounded-lg text-white text-sm font-medium hover:bg-white/30 transition-colors border border-white/30">
        🖨️ הדפס סיכום
      </button>

      <div>
        <p className="text-sm font-semibold opacity-90 mb-2">עכשיו כדאי ל...</p>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "הוסף לקוח ראשון", path: "/clients" },
            { label: "צור חתימה דיגיטלית", path: "/documents/sign/create" },
            { label: "בנה דף נחיתה", path: "/landing-page" },
          ].map(({ label, path }) => (
            <button key={path} onClick={() => navigate(path)}
              className="px-3 py-1.5 bg-white/20 rounded-lg text-white text-xs font-medium hover:bg-white/30 transition-colors border border-white/30">
              {label} ←
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}