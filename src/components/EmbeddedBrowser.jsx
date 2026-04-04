import { useState } from "react";

export default function EmbeddedBrowser({ portalUrl, portalName, onLoginComplete, onCancel }) {
  const [blocked, setBlocked] = useState(false);

  return (
    <div className="space-y-3" dir="rtl">
      {/* Instruction banner */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-3 text-sm text-orange-800">
        <p className="font-semibold mb-0.5">יש להיכנס לחשבון שלך ב-{portalName} בחלון זה.</p>
        <p>לאחר הכניסה, לחץ "סיימתי להיכנס".</p>
      </div>

      {/* iframe or blocked fallback */}
      {blocked ? (
        <div className="flex flex-col items-center justify-center h-40 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 gap-3">
          <p>הפורטל אינו מאפשר הצגה בתוך המערכת.</p>
          <a href={portalUrl} target="_blank" rel="noopener noreferrer"
            className="text-blue-600 hover:underline font-medium">
            לחץ כאן לפתיחה בחלון חדש ←
          </a>
        </div>
      ) : (
        <iframe
          src={portalUrl}
          title={portalName}
          className="w-full rounded-lg border border-gray-200"
          style={{ height: "500px" }}
          onError={() => setBlocked(true)}
          sandbox="allow-scripts allow-forms allow-same-origin allow-popups"
        />
      )}

      {/* Security notice */}
      <p className="text-xs text-gray-400 text-center">
        🔒 הסיסמה שלך אינה נשמרת על ידי Fresh Start.
      </p>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onLoginComplete}
          className="flex-1 py-2.5 rounded-lg text-white text-sm font-medium"
          style={{ backgroundColor: "#1A7A4A" }}>
          סיימתי להיכנס ✓
        </button>
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50">
          ביטול
        </button>
      </div>
    </div>
  );
}