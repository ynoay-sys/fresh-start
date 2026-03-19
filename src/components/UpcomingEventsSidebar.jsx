import { isAfter, addDays, format, isToday, isTomorrow } from "date-fns";

const CAT_COLORS = {
  client: "#1E5FA8", delivery: "#C25A00", order: "#C25A00",
  milestone: "#5C1A8A", government: "#AA1111", personal: "#555555",
};

function dayLabel(date) {
  const d = new Date(date);
  if (isToday(d)) return "היום";
  if (isTomorrow(d)) return "מחר";
  return format(d, "dd/MM");
}

export default function UpcomingEventsSidebar({ events, onAddEvent }) {
  const now = new Date();
  const cutoff = addDays(now, 7);

  const upcoming = events
    .filter(e => isAfter(new Date(e.start_time), now) && new Date(e.start_time) <= cutoff)
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4" dir="rtl">
      <h3 className="font-bold text-gray-800 text-sm mb-4">אירועים קרובים</h3>

      {upcoming.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-sm text-gray-400 mb-3">אין אירועים קרובים</p>
          <button onClick={onAddEvent}
            className="text-sm font-medium px-3 py-1.5 rounded-lg text-white"
            style={{ backgroundColor: "#1E5FA8" }}>
            + הוסף אירוע
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-2.5">
            {upcoming.map(ev => (
              <div key={ev.id} className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: CAT_COLORS[ev.category] || "#555" }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{ev.title}</p>
                  <p className="text-xs text-gray-400">
                    <span className={`font-medium ${isToday(new Date(ev.start_time)) ? "text-blue-600" : ""}`}>
                      {dayLabel(ev.start_time)}
                    </span>
                    {!ev.all_day && ` | ${format(new Date(ev.start_time), "HH:mm")}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <button onClick={onAddEvent}
            className="mt-4 text-sm font-medium w-full text-center py-1.5 rounded-lg border border-dashed border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors">
            + הוסף אירוע
          </button>
        </>
      )}
    </div>
  );
}