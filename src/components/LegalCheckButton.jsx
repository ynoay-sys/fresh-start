import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Search, X } from "lucide-react";
import PaywallModal from "./PaywallModal";

const FREE_LIMIT = 3;

const SYSTEM_PROMPT = `You are a legal document analyzer specializing in Israeli law.
Analyze this document and determine the probability that it requires
an Advanced Electronic Signature or legally certified signature under Israeli law.

Consider these factors:
- Contract language (חוזה, הסכם)
- Government form submissions (הגשה לרשות)
- Financial commitments over ₪10,000 (התחייבות כספית)
- Property or asset transfers (העברת נכס)
- Employment agreements (הסכם עבודה)
- Power of attorney (יפוי כוח)
- Lease agreements (חוזה שכירות)

Respond ONLY with valid JSON, no explanation, no markdown:
{"confidence": <integer 0-100>, "reasons": ["reason in Hebrew", "reason in Hebrew"], "document_type": "<document type in Hebrew>"}`;

function ResultBox({ result, onClose }) {
  const { confidence, reasons, document_type } = result;
  let bg, border, icon, title, advisory;

  if (confidence >= 80) {
    bg = "bg-red-50"; border = "border-red-200"; icon = "🔴";
    title = `סבירות גבוהה לחתימה משפטית: ${confidence}%`;
    advisory = "מסמך זה עשוי לדרוש חתימה אלקטרונית מאומתת. מומלץ להתייעץ עם עורך דין לפני החתימה.";
  } else if (confidence >= 50) {
    bg = "bg-orange-50"; border = "border-orange-200"; icon = "🟠";
    title = `סבירות בינונית לחתימה משפטית: ${confidence}%`;
    advisory = "ייתכן שמסמך זה דורש חתימה מאומתת. שקול להתייעץ עם איש מקצוע.";
  } else {
    bg = "bg-green-50"; border = "border-green-200"; icon = "🟢";
    title = `חתימה פשוטה ככל הנראה מספיקה: ${confidence}%`;
    advisory = null;
  }

  return (
    <div className={`mt-3 p-3 rounded-lg border text-sm ${bg} ${border}`} dir="rtl">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <p className="font-semibold text-gray-800 mb-1">{icon} {title}</p>
          <p className="text-xs text-gray-500 mb-2">סוג מסמך: {document_type}</p>
          {reasons?.length > 0 && (
            <ul className="text-xs text-gray-700 space-y-0.5 mb-2">
              {reasons.map((r, i) => <li key={i}>• {r}</li>)}
            </ul>
          )}
          {advisory && <p className="text-xs text-gray-600 font-medium">{advisory}</p>}
          <p className="text-xs text-gray-400 italic mt-2">⚠️ זוהי הערכה של מערכת AI בלבד ואינה ייעוץ משפטי.</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export default function LegalCheckButton({ doc, onConfidenceUpdate }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [blocked, setBlocked] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [usageRecord, setUsageRecord] = useState(null);
  const [usageCount, setUsageCount] = useState(0);

  useEffect(() => {
    async function checkUsage() {
      const user = await base44.auth.me();
      const records = await base44.entities.UserFeatureUsage.filter({
        created_by: user.email,
        feature_key: "ai_query",
      });
      if (records.length > 0) {
        setUsageRecord(records[0]);
        setUsageCount(records[0].usage_count || 0);
        if ((records[0].usage_count || 0) >= FREE_LIMIT) setBlocked(true);
      }
    }
    checkUsage();
  }, []);

  async function handleCheck() {
    if (blocked || loading) return;
    setLoading(true);
    setResult(null);

    const user = await base44.auth.me();
    const isImage = ["jpg", "jpeg", "png"].includes(doc.file_type);

    const prompt = `${SYSTEM_PROMPT}\n\nDocument file name: "${doc.file_name}"\nCategory: "${doc.category}"\n${!isImage ? `Document URL: ${doc.storage_path}` : ""}`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      file_urls: isImage ? [doc.storage_path] : undefined,
      response_json_schema: {
        type: "object",
        properties: {
          confidence: { type: "integer" },
          reasons: { type: "array", items: { type: "string" } },
          document_type: { type: "string" },
        },
      },
    });

    const confidence = response.confidence ?? 0;
    setResult(response);

    // Save to Document entity
    await base44.entities.Document.update(doc.id, { legal_check_confidence: confidence });
    if (onConfidenceUpdate) onConfidenceUpdate(doc.id, confidence);

    // Update usage
    const newCount = usageCount + 1;
    if (usageRecord) {
      await base44.entities.UserFeatureUsage.update(usageRecord.id, { usage_count: newCount });
    } else {
      const created = await base44.entities.UserFeatureUsage.create({
        user_id: user.id,
        feature_key: "ai_query",
        usage_count: 1,
      });
      setUsageRecord(created);
    }
    setUsageCount(newCount);
    if (newCount >= FREE_LIMIT) setBlocked(true);
    setLoading(false);
  }

  return (
    <div>
      {blocked && showPaywall && (
        <PaywallModal
          featureKey="ai_query"
          usedCount={usageCount}
          onClose={() => setShowPaywall(false)}
          onPaymentSuccess={() => { setBlocked(false); setShowPaywall(false); handleCheck(); }}
        />
      )}
      {blocked && !result ? (
        <button
          onClick={() => setShowPaywall(true)}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-orange-200 text-xs font-medium text-orange-600 hover:bg-orange-50 transition-colors"
        >
          🔒 בדוק עם תשלום (₪2)
        </button>
      ) : (
        <button
          onClick={handleCheck}
          disabled={loading || blocked}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin inline-block" />
              בודק את המסמך...
            </span>
          ) : (
            <><Search className="w-3.5 h-3.5" />בדוק אם נדרשת חתימה משפטית 🔍</>
          )}
        </button>
      )}
      {result && <ResultBox result={result} onClose={() => setResult(null)} />}
    </div>
  );
}