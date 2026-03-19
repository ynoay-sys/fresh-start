export default function ManualFallbackBanner() {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl border mb-6" style={{ backgroundColor: "#FFF3E0", borderColor: "#C25A00" }}>
      <span className="text-xl">⚙️</span>
      <div>
        <p className="text-sm font-semibold text-orange-900">האוטומציה של הגשת הטפסים תהיה זמינה בקרוב.</p>
        <p className="text-sm text-orange-800 mt-0.5">כרגע, יש לבצע את הפעולות ידנית דרך הקישורים המפורטים בכל שלב.</p>
      </div>
    </div>
  );
}