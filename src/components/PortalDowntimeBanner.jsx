export default function PortalDowntimeBanner({ authority, portalUrl }) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800 flex items-start justify-between gap-4">
      <div>
        <p className="font-semibold">הפורטל {authority} אינו זמין כרגע.</p>
        <p className="text-xs mt-0.5 text-blue-600">המידע שלך נשמר. נסה שוב מאוחר יותר.</p>
      </div>
      <a href={portalUrl} target="_blank" rel="noopener noreferrer"
        className="text-xs px-3 py-1.5 rounded-lg border border-blue-300 text-blue-700 hover:bg-blue-100 transition-colors whitespace-nowrap flex-shrink-0">
        פתח פורטל ←
      </a>
    </div>
  );
}