export default function PaywallMessage({ usedCount, freeQuota, featureNameHebrew }) {
  return (
    <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-xl mt-3" dir="rtl">
      <span className="text-xl flex-shrink-0">🔒</span>
      <div>
        <p className="font-semibold text-orange-800 text-sm mb-0.5">תכונה בתשלום</p>
        <p className="text-sm text-orange-700">
          השתמשת ב-{usedCount} מתוך {freeQuota} שימושים חינמיים ב{featureNameHebrew}.
        </p>
        <p className="text-xs text-orange-500 mt-1">גרסת התשלום תהיה זמינה בקרוב.</p>
      </div>
    </div>
  );
}